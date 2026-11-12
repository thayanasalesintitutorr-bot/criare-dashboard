export const dynamic = 'force-dynamic'

import { saudacao } from '@/lib/slack'
import { agoraBrasilia } from '@/lib/date-range'
import { calcularFaturamento, calcularMetaDinamica, toNumber } from '@/lib/meta-dinamica'

const SUPABASE_URL = 'https://afxgfgvdmgxcvamginjc.supabase.co'

function supabaseHeaders() {
  return {
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
    'Accept-Profile': 'kommo',
  }
}

type LeadEvento = {
  id: number
  name?: string | null
  contact_name?: string | null
  venda?: number | string | null
  faturamento?: number | string | null
  Produto?: string | string[] | null
  closed_at?: string | null
  tipo: 'venda' | 'consulta' | 'reabord'
}

// O nome do lead no Kommo vem como "PRODUTO - Nome do Paciente" — contact_name
// quase sempre vem vazio na prática, então o nome do paciente sai da última
// parte depois do " - " (ou do nome inteiro, se não tiver esse separador).
function nomePaciente(lead: LeadEvento) {
  if (lead.contact_name?.trim()) return lead.contact_name.trim()

  const partes = String(lead.name || '').split(' - ')
  return (partes[partes.length - 1] || lead.name || 'Paciente').trim()
}

function nomeProduto(lead: LeadEvento) {
  if (lead.tipo === 'consulta') return 'Consulta'
  if (lead.tipo === 'reabord') return 'Reabordagem'
  if (Array.isArray(lead.Produto)) return lead.Produto.filter(Boolean).join(', ') || 'Produto não informado'
  return String(lead.Produto || '').trim() || 'Produto não informado'
}

function valorLead(lead: LeadEvento) {
  return lead.tipo === 'venda' ? toNumber(lead.venda) : toNumber(lead.faturamento)
}

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

// Busca vendas fechadas (pipeline VENDAS, Venda ganha), consultas recebidas
// (pipeline CONSULTA, GANHOU) e reabordagens fechadas (pipeline REABORD,
// FECHADO (GANHO)) do dia que ainda não geraram aviso — as três contam como
// "venda fechada" pro aviso no Slack.
async function buscarEventosDoDiaAindaNaoNotificados(inicio: string, fim: string): Promise<LeadEvento[]> {
  const [vendasResp, consultasResp, reabordResp, notificadasResp] = await Promise.all([
    fetch(
      `${SUPABASE_URL}/rest/v1/leads?pipeline_id=eq.VENDAS&status_id=eq.${encodeURIComponent('Venda ganha')}` +
        `&closed_at=gte.${inicio}&closed_at=lt.${fim}&is_deleted=is.false` +
        `&select=id,name,contact_name,venda,Produto,closed_at&order=closed_at.asc`,
      { headers: supabaseHeaders() }
    ),
    fetch(
      `${SUPABASE_URL}/rest/v1/leads?pipeline_id=eq.CONSULTA&status_id=eq.${encodeURIComponent('GANHOU')}` +
        `&closed_at=gte.${inicio}&closed_at=lt.${fim}&is_deleted=is.false` +
        `&select=id,name,contact_name,faturamento,closed_at&order=closed_at.asc`,
      { headers: supabaseHeaders() }
    ),
    fetch(
      `${SUPABASE_URL}/rest/v1/leads?pipeline_id=eq.REABORD&status_id=eq.${encodeURIComponent('FECHADO (GANHO)')}` +
        `&closed_at=gte.${inicio}&closed_at=lt.${fim}&is_deleted=is.false` +
        `&select=id,name,contact_name,faturamento,closed_at&order=closed_at.asc`,
      { headers: supabaseHeaders() }
    ),
    fetch(`${SUPABASE_URL}/rest/v1/vendas_notificadas?select=lead_id`, { headers: supabaseHeaders() }),
  ])

  if (!vendasResp.ok) throw new Error(await vendasResp.text())
  if (!consultasResp.ok) throw new Error(await consultasResp.text())
  if (!reabordResp.ok) throw new Error(await reabordResp.text())
  if (!notificadasResp.ok) throw new Error(await notificadasResp.text())

  const vendas: LeadEvento[] = (await vendasResp.json()).map((l: LeadEvento) => ({ ...l, tipo: 'venda' as const }))
  const consultas: LeadEvento[] = (await consultasResp.json()).map((l: LeadEvento) => ({ ...l, tipo: 'consulta' as const }))
  const reabord: LeadEvento[] = (await reabordResp.json()).map((l: LeadEvento) => ({ ...l, tipo: 'reabord' as const }))
  const notificadas: { lead_id: number }[] = await notificadasResp.json()
  const jaNotificados = new Set(notificadas.map((n) => n.lead_id))

  return [...vendas, ...consultas, ...reabord]
    .filter((l) => valorLead(l) > 0 && !jaNotificados.has(l.id))
    .sort((a, b) => String(a.closed_at).localeCompare(String(b.closed_at)))
}

async function marcarNotificados(leadIds: number[]) {
  if (leadIds.length === 0) return

  const resp = await fetch(`${SUPABASE_URL}/rest/v1/vendas_notificadas`, {
    method: 'POST',
    headers: {
      ...supabaseHeaders(),
      'Content-Profile': 'kommo',
      'Content-Type': 'application/json',
      Prefer: 'resolution=ignore-duplicates',
    },
    body: JSON.stringify(leadIds.map((id) => ({ lead_id: id }))),
  })

  if (!resp.ok) throw new Error(await resp.text())
}

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ ok: false, error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const hoje = agoraBrasilia()
    const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
    const inicioAmanha = new Date(inicioHoje)
    inicioAmanha.setDate(inicioAmanha.getDate() + 1)

    const novosEventos = await buscarEventosDoDiaAindaNaoNotificados(inicioHoje.toISOString(), inicioAmanha.toISOString())

    if (novosEventos.length === 0) {
      return Response.json({ ok: true, novosEventos: 0 })
    }

    const [totalHoje, metaInfo] = await Promise.all([
      calcularFaturamento(inicioHoje.toISOString(), inicioAmanha.toISOString()),
      calcularMetaDinamica(hoje),
    ])

    const metaHoje = metaInfo.metaDiaria
    const falta = Math.max(metaHoje - totalHoje, 0)

    const mensagens = novosEventos.map((evento) => {
      const titulo =
        evento.tipo === 'venda' ? 'Venda fechada!' : evento.tipo === 'reabord' ? 'Reabordagem fechada!' : 'Consulta recebida!'
      const emoji = evento.tipo === 'venda' ? '💰' : evento.tipo === 'reabord' ? '🔁' : '🩺'

      return (
        `${emoji} *${saudacao(hoje)}, equipe! ${titulo}*\n` +
        `${nomePaciente(evento)} — ${nomeProduto(evento)} — *${brl(valorLead(evento))}*\n` +
        `Total do dia: ${brl(totalHoje)} · ` +
        (falta > 0 ? `falta ${brl(falta)} pra meta de hoje (${brl(metaHoje)})` : `meta do dia batida! 🎉`)
      )
    })

    await marcarNotificados(novosEventos.map((e) => e.id))

    return Response.json({ ok: true, novosEventos: novosEventos.length, totalHoje, metaHoje, falta, mensagens })
  } catch (erro) {
    return Response.json({ ok: false, error: 'Falha ao checar eventos fechados', details: String(erro) }, { status: 500 })
  }
}
