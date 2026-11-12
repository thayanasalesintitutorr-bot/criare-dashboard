export const dynamic = 'force-dynamic'

import { requireSession } from '@/lib/require-session'
import { saudacao } from '@/lib/slack'
import { agoraBrasilia } from '@/lib/date-range'
import { calcularFaturamento, calcularMetaDinamica } from '@/lib/meta-dinamica'

const SUPABASE_URL = 'https://afxgfgvdmgxcvamginjc.supabase.co'

function supabaseHeaders() {
  return {
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
    'Accept-Profile': 'kommo',
  }
}

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

async function jaNotificadoHoje(diaChave: string) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/meta_diaria_notificada?dia=eq.${diaChave}&select=dia`, {
    headers: supabaseHeaders(),
  })
  if (!resp.ok) throw new Error(await resp.text())
  const rows = await resp.json()
  return rows.length > 0
}

async function marcarNotificado(diaChave: string, valor: number, meta: number) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/meta_diaria_notificada`, {
    method: 'POST',
    headers: {
      ...supabaseHeaders(),
      'Content-Profile': 'kommo',
      'Content-Type': 'application/json',
      Prefer: 'resolution=ignore-duplicates',
    },
    body: JSON.stringify([{ dia: diaChave, valor, meta }]),
  })
  if (!resp.ok) throw new Error(await resp.text())
}

// {{NOME}} é substituído pelo n8n pelo primeiro nome de cada pessoa do Slack
// antes de enviar — assim cada um recebe a mensagem personalizada.
function montarMensagemMetaBatida(valor: number, meta: number, hoje: Date) {
  const dataFormatada = hoje.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

  return (
    `🎉🔥 *META DIÁRIA BATIDA!* 🔥🎉\n` +
    `${saudacao(hoje)}, {{NOME}}! (${dataFormatada})\n\n` +
    `💰 Faturamento de hoje: *${brl(valor)}*\n` +
    `🎯 Meta do dia: ${brl(meta)}\n\n` +
    `🚀🙌 Parabéns pelo esforço, time! Bora continuar nesse ritmo! 🏆✨`
  )
}

export async function GET(req: Request) {
  // Aceita tanto a sessão logada (painel aberto no navegador) quanto o
  // CRON_SECRET (chamada agendada pelo n8n), já que agora os dois disparam
  // essa checagem.
  const cronHeader = req.headers.get('authorization')
  const viaCron = process.env.CRON_SECRET && cronHeader === `Bearer ${process.env.CRON_SECRET}`

  if (!viaCron) {
    const auth = await requireSession(req)
    if (!auth.ok) return auth.response
  }

  try {
    const hoje = agoraBrasilia()
    const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
    const inicioAmanha = new Date(inicioHoje)
    inicioAmanha.setDate(inicioAmanha.getDate() + 1)

    const diaChave = `${inicioHoje.getFullYear()}-${String(inicioHoje.getMonth() + 1).padStart(2, '0')}-${String(inicioHoje.getDate()).padStart(2, '0')}`

    if (await jaNotificadoHoje(diaChave)) {
      return Response.json({ ok: true, atingiu: true, jaNotificado: true })
    }

    const [valor, metaInfo] = await Promise.all([
      calcularFaturamento(inicioHoje.toISOString(), inicioAmanha.toISOString()),
      calcularMetaDinamica(hoje),
    ])

    const meta = metaInfo.metaDiaria
    const atingiu = meta > 0 && valor >= meta
    let mensagem: string | null = null

    if (atingiu) {
      mensagem = montarMensagemMetaBatida(valor, meta, hoje)
      await marcarNotificado(diaChave, valor, meta)
    }

    return Response.json({ ok: true, atingiu, jaNotificado: false, valor, meta, mensagem, metaInfo })
  } catch (erro) {
    return Response.json({ ok: false, error: 'Falha ao checar meta diária', details: String(erro) }, { status: 500 })
  }
}
