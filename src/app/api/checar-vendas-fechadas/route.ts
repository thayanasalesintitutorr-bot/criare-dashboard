export const dynamic = 'force-dynamic'

import { saudacao } from '@/lib/slack'
import { agoraBrasilia } from '@/lib/date-range'
import { diasDoMes } from '@/lib/dias-uteis'

const SUPABASE_URL = 'https://afxgfgvdmgxcvamginjc.supabase.co'

function toNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return 0
  if (typeof value === 'number') return value

  const raw = String(value).trim()
  if (!raw) return 0

  const normalized = raw.replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
  const parsed = Number(normalized)

  return Number.isFinite(parsed) ? parsed : 0
}

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
  tipo: 'venda' | 'consulta'
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
  if (Array.isArray(lead.Produto)) return lead.Produto.filter(Boolean).join(', ') || 'Produto não informado'
  return String(lead.Produto || '').trim() || 'Produto não informado'
}

function valorLead(lead: LeadEvento) {
  return lead.tipo === 'venda' ? toNumber(lead.venda) : toNumber(lead.faturamento)
}

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

async function buscarLeadsFechados(pipelineId: string, status: string, inicio: string, fim: string) {
  const url =
    `${SUPABASE_URL}/rest/v1/leads?pipeline_id=eq.${pipelineId}&status_id=eq.${encodeURIComponent(status)}` +
    `&closed_at=gte.${inicio}&closed_at=lt.${fim}&is_deleted=is.false&select=venda,faturamento`

  const response = await fetch(url, { headers: supabaseHeaders() })
  if (!response.ok) throw new Error(await response.text())

  return response.json() as Promise<{ venda?: number | string | null; faturamento?: number | string | null }[]>
}

// Mesmo critério do consolidadoValorVendas em src/app/api/test/route.ts.
async function calcularFaturamentoDoDia(inicio: string, fim: string) {
  const [consulta, reabord, vendas] = await Promise.all([
    buscarLeadsFechados('CONSULTA', 'GANHOU', inicio, fim),
    buscarLeadsFechados('REABORD', 'FECHADO (GANHO)', inicio, fim),
    buscarLeadsFechados('VENDAS', 'Venda ganha', inicio, fim),
  ])

  const vendasValidas = vendas.filter((l) => toNumber(l.venda) > 0)
  const valorConsulta = consulta.reduce((acc, l) => acc + toNumber(l.faturamento), 0)
  const valorReabord = reabord.reduce((acc, l) => acc + toNumber(l.faturamento), 0)
  const valorVendas = vendasValidas.reduce((acc, l) => acc + toNumber(l.venda), 0)

  return valorConsulta + valorReabord + valorVendas
}

// Mesma meta mensal usada em getMetaMensalVendas (src/app/api/test/route.ts) —
// mantém os três (essa rota, checar-meta-diaria e resumo-matinal) sincronizados
// manualmente se a meta mudar de novo.
function getMetaMensal(ano: number, mes: number) {
  if (ano === 2026 && mes === 10) return 839000 // novembro
  if (ano === 2026 && mes === 11) return 661000 // dezembro

  if (ano > 2026 || (ano === 2026 && mes >= 8)) return 1000000

  return 750000
}

// Mesma contagem de dias úteis do card Perspectiva de venda (desconta
// feriados e pontos facultativos, não só fim de semana) — ver dias-uteis.ts.
function getBusinessDaysInMonth(ano: number, mes: number) {
  return diasDoMes(new Date(ano, mes, 1)).filter((d) => d.util).length
}

function getMetaDiaria(hoje: Date) {
  const diasUteis = getBusinessDaysInMonth(hoje.getFullYear(), hoje.getMonth())
  const metaMensal = getMetaMensal(hoje.getFullYear(), hoje.getMonth())
  return diasUteis > 0 ? metaMensal / diasUteis : 0
}

// Busca tanto vendas fechadas (pipeline VENDAS, Venda ganha) quanto consultas
// recebidas (pipeline CONSULTA, GANHOU) do dia que ainda não geraram aviso —
// as duas contam como "venda fechada" pro aviso no Slack.
async function buscarEventosDoDiaAindaNaoNotificados(inicio: string, fim: string): Promise<LeadEvento[]> {
  const [vendasResp, consultasResp, notificadasResp] = await Promise.all([
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
    fetch(`${SUPABASE_URL}/rest/v1/vendas_notificadas?select=lead_id`, { headers: supabaseHeaders() }),
  ])

  if (!vendasResp.ok) throw new Error(await vendasResp.text())
  if (!consultasResp.ok) throw new Error(await consultasResp.text())
  if (!notificadasResp.ok) throw new Error(await notificadasResp.text())

  const vendas: LeadEvento[] = (await vendasResp.json()).map((l: LeadEvento) => ({ ...l, tipo: 'venda' as const }))
  const consultas: LeadEvento[] = (await consultasResp.json()).map((l: LeadEvento) => ({ ...l, tipo: 'consulta' as const }))
  const notificadas: { lead_id: number }[] = await notificadasResp.json()
  const jaNotificados = new Set(notificadas.map((n) => n.lead_id))

  return [...vendas, ...consultas]
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

    const [totalHoje, metaHoje] = await Promise.all([
      calcularFaturamentoDoDia(inicioHoje.toISOString(), inicioAmanha.toISOString()),
      Promise.resolve(getMetaDiaria(hoje)),
    ])

    const falta = Math.max(metaHoje - totalHoje, 0)

    const mensagens = novosEventos.map((evento) => {
      const titulo = evento.tipo === 'venda' ? 'Venda fechada!' : 'Consulta recebida!'
      const emoji = evento.tipo === 'venda' ? '💰' : '🩺'

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
