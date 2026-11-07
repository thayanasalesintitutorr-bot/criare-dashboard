export const dynamic = 'force-dynamic'

import { requireSession } from '@/lib/require-session'

const SUPABASE_URL = 'https://afxgfgvdmgxcvamginjc.supabase.co'

function normalize(value: unknown) {
  return String(value || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toUpperCase()
}

function toNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return 0
  if (typeof value === 'number') return value

  const raw = String(value).trim()
  if (!raw) return 0

  const normalized = raw.replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
  const parsed = Number(normalized)

  return Number.isFinite(parsed) ? parsed : 0
}

type LeadResumo = { venda?: number | string | null; faturamento?: number | string | null }

async function buscarLeadsFechados(
  pipelineId: string,
  status: string,
  inicio: string,
  fim: string
): Promise<LeadResumo[]> {
  const url =
    `${SUPABASE_URL}/rest/v1/leads?pipeline_id=eq.${pipelineId}&status_id=eq.${encodeURIComponent(status)}` +
    `&closed_at=gte.${inicio}&closed_at=lt.${fim}&is_deleted=is.false&select=venda,faturamento`

  const response = await fetch(url, {
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      'Accept-Profile': 'kommo',
    },
  })

  if (!response.ok) throw new Error(await response.text())

  return response.json()
}

// Mesmo critério do consolidadoValorVendas/consolidadoQtdVendas em
// src/app/api/test/route.ts: soma faturamento de Consulta (GANHOU) +
// Reabord (FECHADO (GANHO)) + venda de Vendas (VENDA GANHA, venda > 0).
async function calcularFechamentoDoMes(inicio: string, fim: string) {
  const [consulta, reabord, vendas] = await Promise.all([
    buscarLeadsFechados('CONSULTA', 'GANHOU', inicio, fim),
    buscarLeadsFechados('REABORD', 'FECHADO (GANHO)', inicio, fim),
    buscarLeadsFechados('VENDAS', 'Venda ganha', inicio, fim),
  ])

  const vendasValidas = vendas.filter((l) => toNumber(l.venda) > 0)

  const valorConsulta = consulta.reduce((acc, l) => acc + toNumber(l.faturamento), 0)
  const valorReabord = reabord.reduce((acc, l) => acc + toNumber(l.faturamento), 0)
  const valorVendas = vendasValidas.reduce((acc, l) => acc + toNumber(l.venda), 0)

  return {
    valorTotal: valorConsulta + valorReabord + valorVendas,
    qtdVendas: consulta.length + reabord.length + vendasValidas.length,
  }
}

function mesParaIntervalo(mes: string): { inicio: string; fim: string } | null {
  const match = mes.match(/^(\d{4})-(\d{2})$/)
  if (!match) return null

  const [, ano, mesNum] = match
  const inicio = `${ano}-${mesNum}-01`
  const proximoMes = Number(mesNum) === 12 ? `${Number(ano) + 1}-01-01` : `${ano}-${String(Number(mesNum) + 1).padStart(2, '0')}-01`

  return { inicio, fim: proximoMes }
}

export async function GET(req: Request) {
  const auth = await requireSession(req)
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(req.url)
  const mes = searchParams.get('mes') || ''
  const intervalo = mesParaIntervalo(mes)

  if (!intervalo) {
    return Response.json({ ok: false, error: 'Parâmetro "mes" inválido, use YYYY-MM' }, { status: 400 })
  }

  try {
    const [aoVivo, congeladoResp] = await Promise.all([
      calcularFechamentoDoMes(intervalo.inicio, intervalo.fim),
      fetch(`${SUPABASE_URL}/rest/v1/fechamento_mensal?mes=eq.${intervalo.inicio}&select=*`, {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          'Accept-Profile': 'kommo',
        },
      }),
    ])

    if (!congeladoResp.ok) throw new Error(await congeladoResp.text())

    const congeladoRows = await congeladoResp.json()
    const congelado = congeladoRows[0] || null

    return Response.json({
      ok: true,
      mes: intervalo.inicio,
      aoVivo,
      congelado: congelado
        ? {
            valorTotal: toNumber(congelado.valor_total),
            qtdVendas: Number(congelado.qtd_vendas) || 0,
            congeladoEm: congelado.congelado_em,
          }
        : null,
    })
  } catch (erro) {
    return Response.json({ ok: false, error: 'Falha ao calcular fechamento do mês', details: String(erro) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const auth = await requireSession(req)
  if (!auth.ok) return auth.response

  if (auth.role !== 'admin') {
    return Response.json({ ok: false, error: 'Apenas admin pode congelar o fechamento do mês' }, { status: 403 })
  }

  let body: { mes?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ ok: false, error: 'Requisição inválida' }, { status: 400 })
  }

  const intervalo = mesParaIntervalo(body.mes || '')
  if (!intervalo) {
    return Response.json({ ok: false, error: 'Parâmetro "mes" inválido, use YYYY-MM' }, { status: 400 })
  }

  try {
    const aoVivo = await calcularFechamentoDoMes(intervalo.inicio, intervalo.fim)

    const upsertResp = await fetch(`${SUPABASE_URL}/rest/v1/fechamento_mensal?on_conflict=mes`, {
      method: 'POST',
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        'Accept-Profile': 'kommo',
        'Content-Profile': 'kommo',
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify([
        {
          mes: intervalo.inicio,
          valor_total: aoVivo.valorTotal,
          qtd_vendas: aoVivo.qtdVendas,
          congelado_em: new Date().toISOString(),
          congelado_por: normalize(auth.role),
        },
      ]),
    })

    if (!upsertResp.ok) throw new Error(await upsertResp.text())

    return Response.json({ ok: true, mes: intervalo.inicio, congelado: aoVivo })
  } catch (erro) {
    return Response.json({ ok: false, error: 'Falha ao congelar o mês', details: String(erro) }, { status: 500 })
  }
}
