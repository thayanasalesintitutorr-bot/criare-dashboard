export const dynamic = 'force-dynamic'

import { requireSession } from '@/lib/require-session'

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

type LeadResumo = { venda?: number | string | null; faturamento?: number | string | null }

async function buscarLeadsFechados(pipelineId: string, status: string, inicio: string, fim: string): Promise<LeadResumo[]> {
  const url =
    `${SUPABASE_URL}/rest/v1/leads?pipeline_id=eq.${pipelineId}&status_id=eq.${encodeURIComponent(status)}` +
    `&closed_at=gte.${inicio}&closed_at=lt.${fim}&is_deleted=is.false&select=venda,faturamento`

  const response = await fetch(url, { headers: supabaseHeaders() })
  if (!response.ok) throw new Error(await response.text())

  return response.json()
}

// Mesmo critério do consolidadoValorVendas em src/app/api/test/route.ts:
// soma faturamento de Consulta (GANHOU) + Reabord (FECHADO (GANHO)) + venda
// de Vendas (VENDA GANHA, venda > 0).
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
// mantém os dois sincronizados manualmente se a meta mudar de novo.
function getMetaMensal(ano: number, mes: number) {
  if (ano === 2026 && mes === 10) return 839000 // novembro
  if (ano === 2026 && mes === 11) return 661000 // dezembro

  if (ano > 2026 || (ano === 2026 && mes >= 8)) return 1000000

  return 750000
}

function isDiaUtil(date: Date) {
  const day = date.getDay()
  return day >= 1 && day <= 5
}

function getBusinessDaysInMonth(ano: number, mes: number) {
  const fim = new Date(ano, mes + 1, 0).getDate()
  let count = 0
  for (let d = 1; d <= fim; d++) {
    if (isDiaUtil(new Date(ano, mes, d))) count++
  }
  return count
}

function getMetaDiaria(hoje: Date) {
  const diasUteis = getBusinessDaysInMonth(hoje.getFullYear(), hoje.getMonth())
  const metaMensal = getMetaMensal(hoje.getFullYear(), hoje.getMonth())
  return diasUteis > 0 ? metaMensal / diasUteis : 0
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

async function notificarSlack(valor: number, meta: number, hoje: Date) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) return

  const dataFormatada = hoje.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text:
        `🎉 *Meta diária batida!* (${dataFormatada})\n` +
        `Faturamento de hoje: *${brl(valor)}* · meta do dia: ${brl(meta)}\n` +
        `Parabéns, equipe! 🚀`,
    }),
  })
}

export async function GET(req: Request) {
  const auth = await requireSession(req)
  if (!auth.ok) return auth.response

  try {
    const hoje = new Date()
    const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
    const inicioAmanha = new Date(inicioHoje)
    inicioAmanha.setDate(inicioAmanha.getDate() + 1)

    const diaChave = `${inicioHoje.getFullYear()}-${String(inicioHoje.getMonth() + 1).padStart(2, '0')}-${String(inicioHoje.getDate()).padStart(2, '0')}`

    if (await jaNotificadoHoje(diaChave)) {
      return Response.json({ ok: true, atingiu: true, jaNotificado: true })
    }

    const [valor, meta] = await Promise.all([
      calcularFaturamentoDoDia(inicioHoje.toISOString(), inicioAmanha.toISOString()),
      Promise.resolve(getMetaDiaria(hoje)),
    ])

    const atingiu = meta > 0 && valor >= meta

    if (atingiu) {
      await notificarSlack(valor, meta, hoje)
      await marcarNotificado(diaChave, valor, meta)
    }

    return Response.json({ ok: true, atingiu, jaNotificado: false, valor, meta })
  } catch (erro) {
    return Response.json({ ok: false, error: 'Falha ao checar meta diária', details: String(erro) }, { status: 500 })
  }
}
