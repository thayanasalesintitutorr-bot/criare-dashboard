export const dynamic = 'force-dynamic'

import { chaveData, diasDoMes } from '@/lib/dias-uteis'

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
async function calcularFaturamento(inicio: string, fim: string) {
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

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

async function notificarSlack(texto: string) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) return

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: texto }),
  })
}

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ ok: false, error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const hoje = new Date()
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    const agora = new Date()

    const [totalMes, metaMensal] = await Promise.all([
      calcularFaturamento(inicioMes.toISOString(), agora.toISOString()),
      Promise.resolve(getMetaMensal(hoje.getFullYear(), hoje.getMonth())),
    ])

    const falta = Math.max(metaMensal - totalMes, 0)
    const percentual = metaMensal > 0 ? Math.round((totalMes / metaMensal) * 100) : 0
    const nomeMes = hoje.toLocaleDateString('pt-BR', { month: 'long' })
    const dataFormatada = hoje.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

    // Mesmo cálculo de "projeção de fechamento" do card Perspectiva de venda
    // (src/components/dashboard/perspectiva-meta.tsx): ritmo médio por dia
    // útil já passado (considerando feriados) projetado pros dias úteis que
    // faltam no mês inteiro.
    const diasMes = diasDoMes(hoje)
    const hojeChave = chaveData(hoje)
    const uteisPassados = diasMes.filter((d) => chaveData(d.data) < hojeChave && d.util).length
    const uteisRestantes = diasMes.filter((d) => chaveData(d.data) >= hojeChave && d.util).length
    const ritmo = uteisPassados > 0 ? totalMes / uteisPassados : 0
    const projecaoFechamento = ritmo * (uteisPassados + uteisRestantes)
    const diffProjecao = projecaoFechamento - metaMensal
    const mostrarProjecao = uteisPassados > 0 && uteisRestantes > 0

    const linhaProjecao = mostrarProjecao
      ? `\nNo ritmo atual (${brl(ritmo)}/dia útil), ${nomeMes} deve fechar em *${brl(projecaoFechamento)}* — ${
          diffProjecao >= 0 ? `${brl(diffProjecao)} acima da meta` : `${brl(Math.abs(diffProjecao))} abaixo da meta`
        }.`
      : ''

    const texto =
      `☀️ *Bom dia! Resumo de ${nomeMes}* (${dataFormatada})\n` +
      `Faturado até agora: *${brl(totalMes)}* (${percentual}% da meta)\n` +
      (falta > 0
        ? `Falta *${brl(falta)}* para bater a meta de ${brl(metaMensal)}`
        : `🎉 Meta de ${brl(metaMensal)} já batida neste mês!`) +
      linhaProjecao

    await notificarSlack(texto)

    return Response.json({ ok: true, totalMes, metaMensal, falta, percentual })
  } catch (erro) {
    return Response.json({ ok: false, error: 'Falha ao gerar resumo matinal', details: String(erro) }, { status: 500 })
  }
}
