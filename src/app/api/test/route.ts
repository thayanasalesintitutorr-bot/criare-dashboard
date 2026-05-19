import { supabase } from '@/app/lib/supabase'

export const dynamic = 'force-dynamic'

type Lead = {
  id: number
  name?: string | null
  pipeline_id?: string | null
  status_id?: string | null
  medico?: string | null
  faturamento?: number | string | null
  venda?: number | string | null
  created_at?: string | null
  updated_at?: string | null
  closed_at?: string | null
  closest_task_at?: string | null
  scheduled_at?: string | null
  campanha?: string | null
  source?: string | null
  tag?: string | null
  Produto?: string | string[] | null
  Atendimento?: string | null
'Convênio'?: string | null
}

function normalize(value: unknown) {
  return String(value || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toUpperCase()
}

function statusIs(lead: Lead, status: string) {
  return normalize(lead.status_id) === normalize(status)
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

function hasVenda(lead: Lead) {
  return toNumber(lead.venda) > 0
}

function normalizeCampaignName(name?: string | null) {
  if (!name) return 'SEM CAMPANHA'

  let normalized = name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

  // aliases manuais
  if (
    normalized.includes('link bio') ||
    normalized.includes('link da bio')
  ) {
    return 'LINK BIO DR RODOLPHO'
  }

  if (normalized === 'outros') {
    return 'OUTROS'
  }

  if (
    normalized.includes('organico') ||
    normalized.includes('sem campanha')
  ) {
    return 'Orgânico (sem campanha)'
  }

  return normalized.toUpperCase()
}

// PARSE LOCAL MANUAL — sem UTC
function parseDateLocal(value?: string | null) {
  if (!value) return null

  const clean = String(value)
    .trim()
    .replace('T', ' ')
    .replace('Z', '')

  const match = clean.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?(?:\.(\d{1,3}))?)?$/
  )

  if (!match) return null

  const [, y, m, d, hh = '0', mm = '0', ss = '0', ms = '0'] = match

  return new Date(
    Number(y),
    Number(m) - 1,
    Number(d),
    Number(hh),
    Number(mm),
    Number(ss),
    Number(ms.padEnd(3, '0'))
  )
}

function parseLocalDate(value: string, end = false) {
  const [year, month, day] = value.split('-').map(Number)

  if (end) {
    return new Date(year, month - 1, day, 23, 59, 59, 999)
  }

  return new Date(year, month - 1, day, 0, 0, 0, 0)
}

function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

function getWeekRangeSaturdayToFriday(baseDate: Date) {
  const current = startOfDay(baseDate)
  const day = current.getDay()
  const diffToSaturday = day === 6 ? 0 : day + 1

  const start = new Date(current)
  start.setDate(current.getDate() - diffToSaturday)

  const end = new Date(start)
  end.setDate(start.getDate() + 6)

  return { start: startOfDay(start), end: endOfDay(end) }
}
function getNextWeekRangeSaturdayToFriday(baseDate: Date) {
  const thisWeek = getWeekRangeSaturdayToFriday(baseDate)

  const start = new Date(thisWeek.start)
  start.setDate(start.getDate() + 7)

  const end = new Date(thisWeek.end)
  end.setDate(end.getDate() + 7)

  return {
    start: startOfDay(start),
    end: endOfDay(end),
  }
}
function getMonthRange(date: Date) {
  return {
    start: startOfDay(new Date(date.getFullYear(), date.getMonth(), 1)),
    end: endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0)),
  }
}

function getPreviousMonthRange(date: Date) {
  return {
    start: startOfDay(new Date(date.getFullYear(), date.getMonth() - 1, 1)),
    end: endOfDay(new Date(date.getFullYear(), date.getMonth(), 0)),
  }
}

function getGlobalRange(periodo: string, customStart?: string, customEnd?: string) {
  const now = new Date()

  switch (periodo) {
    case 'hoje':
      return { start: startOfDay(now), end: endOfDay(now) }

    case 'ontem': {
      const y = new Date(now)
      y.setDate(now.getDate() - 1)
      return { start: startOfDay(y), end: endOfDay(y) }
    }

    case 'semana':
      return getWeekRangeSaturdayToFriday(now)

    case 'mes-atual':
      return getMonthRange(now)

    case 'mes-passado':
      return getPreviousMonthRange(now)

    case 'personalizado': {
      if (customStart && customEnd) {
        return {
          start: parseLocalDate(customStart),
          end: parseLocalDate(customEnd, true),
        }
      }
      return { start: startOfDay(now), end: endOfDay(now) }
    }

    default:
      return { start: startOfDay(now), end: endOfDay(now) }
  }
}

function inRange(date: Date | null, start: Date, end: Date) {
  if (!date) return false
  return date >= start && date <= end
}

function safePercent(part: number, total: number) {
  if (!total) return 0
  return (part / total) * 100
}

const MEDICOS_VASCULAR = ['DR. RODOLPHO REIS', 'DRA. CLAUDIA LAMEIRA']
const MEDICOS_EMAGRECIMENTO = ['DR. BRENO PITANGUI']

function filterBySegmento(leads: Lead[], segmento: string) {
  if (segmento === 'geral') return leads

  const allowed = segmento === 'vascular' ? MEDICOS_VASCULAR : MEDICOS_EMAGRECIMENTO

  return leads.filter((lead) => {
    const med = normalize(lead.medico)
    return allowed.some((m) => normalize(m) === med)
  })
}

const META_MENSAL_VENDAS = 700000
const META_SEMANAL_VENDAS = 175000
const META_DIARIA_VENDAS = META_SEMANAL_VENDAS / 7
const META_TICKET_MEDIO = 2800
const META_MENSAL_NPS = 25


function isDiaUtil(date: Date) {
  const day = date.getDay()
  return day >= 1 && day <= 5
}

function countDiasUteis(start: Date, end: Date) {
  let count = 0
  const current = startOfDay(new Date(start))

  while (current <= end) {
    if (isDiaUtil(current)) count++
    current.setDate(current.getDate() + 1)
  }

  return count
}

function getMetaNps(start: Date, end: Date) {
  const mesInicio = new Date(start.getFullYear(), start.getMonth(), 1)
  const mesFim = new Date(start.getFullYear(), start.getMonth() + 1, 0)

  const diasUteisMes = countDiasUteis(mesInicio, mesFim)
  const diasUteisPeriodo = Math.max(1, countDiasUteis(start, end))

  return Math.round((META_MENSAL_NPS / diasUteisMes) * diasUteisPeriodo)
}

function getMetaVendas(periodo: string, start: Date, end: Date) {
  switch (periodo) {
    case 'mes-atual':
    case 'mes-passado':
      return META_MENSAL_VENDAS
    case 'semana':
      return META_SEMANAL_VENDAS
    case 'hoje':
    case 'ontem':
      return Math.round(META_DIARIA_VENDAS)
    default: {
      const diff = end.getTime() - start.getTime()
      const days = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1)
      return Math.round(META_DIARIA_VENDAS * days)
    }
  }
}

function buildEvolucaoDiaria(
  vendasLeads: Lead[],
  consultaLeads: Lead[],
  range: { start: Date; end: Date }
) {
  const result: {
    data: string
    label: string
    leads: number
    vendasValor: number
    desqualificados: number
  }[] = []

  const current = new Date(range.start)

  while (current <= range.end) {
    const dayStart = startOfDay(new Date(current))
    const dayEnd = endOfDay(new Date(current))

    const leadsCount = consultaLeads.filter((l) => {
      const d = parseDateLocal(l.created_at)
      return d && d >= dayStart && d <= dayEnd
    }).length

    const desqualificadosCount = consultaLeads.filter((l) => {
      if (!statusIs(l, 'PERDEU [NÃO QUALIFICADO]')) return false
      const d = parseDateLocal(l.created_at)
      return d && d >= dayStart && d <= dayEnd
    }).length

    const vendasDoDia = vendasLeads.filter((l) => {
      if (!hasVenda(l)) return false
      const d = parseDateLocal(l.closed_at)
      return d && d >= dayStart && d <= dayEnd
    })

    const vendasValor = vendasDoDia.reduce((acc, l) => acc + toNumber(l.venda), 0)

    const day = current.getDate().toString().padStart(2, '0')
    const month = (current.getMonth() + 1).toString().padStart(2, '0')

    result.push({
      data: `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`,
      label: `${day}/${month}`,
      leads: leadsCount,
      vendasValor,
      desqualificados: desqualificadosCount,
    })

    current.setDate(current.getDate() + 1)
  }

  return result
}

function buildOrigens(consultaLeads: Lead[]) {
  const map: Record<string, number> = {}

  for (const lead of consultaLeads) {
    const key = (lead.campanha || '').trim() || 'Sem campanha'
    map[key] = (map[key] || 0) + 1
  }

  return Object.entries(map)
    .map(([nome, quantidade]) => ({ nome, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade)
}

async function fetchAllLeadsByPipeline(
  pipelineId: 'CONSULTA' | 'VENDAS' | 'REABORD'
) {
  let allData: Lead[] = []
  let from = 0
  const pageSize = 1000

  while (true) {

  const response = await fetch(
    `https://afxgfgvdmgxcvamginjc.supabase.co/rest/v1/leads?pipeline_id=eq.${pipelineId}&select=id,name,pipeline_id,status_id,faturamento,venda,created_at,updated_at,closed_at,closest_task_at,campanha,source,tag,medico,scheduled_at,Produto,Atendimento,Convênio&offset=${from}&limit=${pageSize}`,
    {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        'Accept-Profile': 'kommo',
      },
    }
  )

  const data = await response.json()

  if (!data || data.length === 0) break

  allData = allData.concat(data as Lead[])

  if (data.length < pageSize) break

  from += pageSize
}


  return allData
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)

    const periodo = searchParams.get('periodo') || 'mes-atual'
    const segmento = searchParams.get('segmento') || 'geral'
    const customStart = searchParams.get('inicio') || ''
    const customEnd = searchParams.get('fim') || ''

    const range = getGlobalRange(periodo, customStart, customEnd)

    const [consultaBase, vendasBase, reabordBase] = await Promise.all([
      fetchAllLeadsByPipeline('CONSULTA'),
      fetchAllLeadsByPipeline('VENDAS'),
      fetchAllLeadsByPipeline('REABORD'),
    ])

    const consultaLeads = filterBySegmento(
      consultaBase.filter((l) => normalize(l.pipeline_id) === 'CONSULTA'),
      segmento
    )

    const vendasLeads = filterBySegmento(
      vendasBase.filter((l) => normalize(l.pipeline_id) === 'VENDAS'),
      segmento
    )

    const reabordLeads = filterBySegmento(
      reabordBase.filter((l) => normalize(l.pipeline_id) === 'REABORD'),
      segmento
    )
    const nextWeekRange = getNextWeekRangeSaturdayToFriday(new Date())

const tarefasProximaSemanaConsulta = consultaLeads.filter((l) => {
  const criadoNoPeriodo = inRange(
    parseDateLocal(l.created_at),
    range.start,
    range.end
  )

  const tarefaNaProximaSemana = inRange(
    parseDateLocal(l.closest_task_at),
    nextWeekRange.start,
    nextWeekRange.end
  )

  return criadoNoPeriodo && tarefaNaProximaSemana
}).length

const tarefasProximaSemanaVendas = vendasLeads.filter((l) => {
  const criadoNoPeriodo = inRange(
    parseDateLocal(l.created_at),
    range.start,
    range.end
  )

  const tarefaNaProximaSemana = inRange(
    parseDateLocal(l.closest_task_at),
    nextWeekRange.start,
    nextWeekRange.end
  )

  return criadoNoPeriodo && tarefaNaProximaSemana
}).length

    // CONSULTA
    const consultaBasePeriodo = consultaLeads.filter((l) =>
      inRange(parseDateLocal(l.created_at), range.start, range.end)
    )

    // FILTRO NOVO - CAMPANHA SITE DR RODOLPHO
const leadsSiteRodolpho = consultaBasePeriodo.filter((l) => {
  const campanha = normalize(l.campanha)
  const tag = normalize(l.tag)
  const source = normalize(l.source)

  return (
    campanha.includes('SITE-ALTUUS') ||
    tag.includes('SITE-ALTUUS') ||
    source.includes('SITE-ALTUUS')
  )
})
console.log('SITE ALTUUS TOTAL:', leadsSiteRodolpho.length)

// AGRUPAR STATUS_ID
const statusSiteRodolpho: Record<string, number> = {}

leadsSiteRodolpho.forEach((l) => {
  const status = l.status_id || 'SEM STATUS'
  statusSiteRodolpho[status] = (statusSiteRodolpho[status] || 0) + 1
})
    const totalEntradas = consultaBasePeriodo.length 

    const naoQualificados = consultaBasePeriodo.filter((l) =>
      statusIs(l, 'PERDEU [NÃO QUALIFICADO]')
    ).length

    const leadsAceitos = totalEntradas - naoQualificados

    const agendados = consultaLeads.filter((l) =>
      statusIs(l, 'AGENDADO') &&
      inRange(parseDateLocal(l.scheduled_at), range.start, range.end)
    ).length

    const agendadosFunil = consultaBasePeriodo.filter((l) =>
      statusIs(l, 'AGENDADO')
    ).length

    const consultaGanhosLeads = [
  ...consultaLeads.filter((l) => {
    return (
      statusIs(l, 'GANHOU') &&
      inRange(parseDateLocal(l.closed_at), range.start, range.end)
    )
  }),

  ...reabordLeads.filter((l) => {
    return (
      statusIs(l, 'FECHADO (GANHO)') &&
      inRange(parseDateLocal(l.closed_at), range.start, range.end)
    )
  }),
]

    const quantidadeConsulta = consultaGanhosLeads.length
    const valorTotalConsulta = consultaGanhosLeads.reduce(
      (acc, l) => acc + toNumber(l.faturamento),
      0
    )

    const ticketMedioConsulta =
      quantidadeConsulta > 0 ? valorTotalConsulta / quantidadeConsulta : 0

      const campanhasConsultaMap: Record<string, { qtd: number; valor: number }> = {}

consultaGanhosLeads.forEach((lead) => {
  const campanha = normalizeCampaignName(lead.campanha)
  const valorConsulta = toNumber(lead.faturamento)

  if (valorConsulta <= 0) return

  if (!campanhasConsultaMap[campanha]) {
    campanhasConsultaMap[campanha] = { qtd: 0, valor: 0 }
  }

  campanhasConsultaMap[campanha].qtd += 1
  campanhasConsultaMap[campanha].valor += valorConsulta
})

const valorTotalCampanhasConsulta = Object.values(campanhasConsultaMap).reduce(
  (acc, item) => acc + item.valor,
  0
)

const campanhasConsulta = Object.entries(campanhasConsultaMap)
  .map(([nome, item]) => ({
    nome,
    qtd: item.qtd,
    valor: item.valor,
    percentual:
      valorTotalCampanhasConsulta > 0
        ? (item.valor / valorTotalCampanhasConsulta) * 100
        : 0,
  }))
  .sort((a, b) => b.valor - a.valor)

    const funil = {
      entrada: totalEntradas,
      primeiroContato: consultaBasePeriodo.filter((l) =>
        statusIs(l, '1º CONTATO')
      ).length,
      formulario: consultaBasePeriodo.filter((l) =>
        statusIs(l, 'FORMULÁRIO [CAMPANHA]')
      ).length,
      followUp: consultaBasePeriodo.filter((l) =>
        statusIs(l, 'FOLLOW-UP [S/ RESPOSTA]')
      ).length,
      naoQualificado: naoQualificados,
      qualificado: consultaBasePeriodo.filter((l) =>
        statusIs(l, 'LEAD QUALIFICADO [SAL]')
      ).length,
      agendado: agendadosFunil,
      ganhou: consultaBasePeriodo.filter((l) =>
        statusIs(l, 'GANHOU')
      ).length,
      perdeu: consultaBasePeriodo.filter((l) =>
        statusIs(l, 'PERDEU')
      ).length,
    }

    // VENDAS
    
    const propostasEnviadasLeads = vendasLeads.filter((l) =>
      inRange(parseDateLocal(l.created_at), range.start, range.end)
    )

    const hoje = new Date()
const seteDiasAtras = new Date()
seteDiasAtras.setDate(hoje.getDate() - 7)

const leadsParadosVendas = vendasLeads.filter((l) => {
  const criadoNoPeriodo = inRange(
    parseDateLocal(l.created_at),
    range.start,
    range.end
  )

  const criadoHaMaisDe7Dias =
    parseDateLocal(l.created_at) !== null &&
    parseDateLocal(l.created_at)! <= seteDiasAtras

  return (
    criadoNoPeriodo &&
    criadoHaMaisDe7Dias &&
    statusIs(l, 'ORÇAMENTO ENTREGUE')
  )
}).length

    const propostasEnviadas = propostasEnviadasLeads.filter((l) => {
  return (
    toNumber(l.venda) > 0 &&
    toNumber(l.faturamento) > 0
  )
}).length

    const propostasFechadasLeads = vendasLeads.filter((l) => {
      return (
        statusIs(l, 'VENDA GANHA') &&
        toNumber(l.venda) > 0 &&
        inRange(parseDateLocal(l.closed_at), range.start, range.end)
      )
    })

    const produtosMap: Record<string, { qtd: number; valor: number }> = {}
    const campanhasMap: Record<string, { qtd: number; valor: number }> = {}

    const medicosMap: Record<
  string,
  {
    valor: number
    produtos: Record<string, number>
  }
> = {}

vendasLeads
  .filter((l) =>
    normalize(l.status_id).includes('GANHA') &&
    toNumber(l.venda) > 0 &&
    inRange(parseDateLocal(l.closed_at), range.start, range.end)
  )
  .forEach((lead) => {
  const medico = (lead.medico || '').trim() || 'Sem médico'
  const valorVenda = toNumber(lead.venda)
  const produtosRaw = lead.Produto

  const produtos = Array.isArray(produtosRaw)
    ? produtosRaw
    : String(produtosRaw || '')
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)

  if (valorVenda <= 0) return

  if (!medicosMap[medico]) {
    medicosMap[medico] = {
      valor: 0,
      produtos: {},
    }
  }

  medicosMap[medico].valor += valorVenda

  produtos.forEach((produto) => {
    medicosMap[medico].produtos[produto] =
      (medicosMap[medico].produtos[produto] || 0) + 1
  })
})

const vendasPorMedico = Object.entries(medicosMap)
  .map(([nome, item]) => {
  const meta = getMetaMedico(nome, periodo, range.start, range.end)

  const percentual = meta > 0 ? item.valor / meta : 0

  return {
    nome,
    valor: item.valor,
    meta,
    percentual,
    produtos: Object.entries(item.produtos)
      .map(([produto, qtd]) => ({
        produto,
        qtd,
      }))
      .sort((a, b) => b.qtd - a.qtd),
  }
})
  .sort((a, b) => b.valor - a.valor)

  function getMetaMedico(nome: string, periodo: string, start: Date, end: Date) {
  const nomeNorm = normalize(nome)

  let metaMensal = 0

  if (nomeNorm.includes('BRENO')) {
    metaMensal = 150000
  } else if (
    nomeNorm.includes('RODOLPHO') ||
    nomeNorm.includes('CLAUDIA')
  ) {
    metaMensal = 350000
  }

  // ajuste por período (proporcional dias úteis)
  const dias = Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  )

  const diasUteis = dias * (5 / 7)

  const metaPeriodo = (metaMensal / 30) * diasUteis

  return metaPeriodo
}

propostasFechadasLeads.forEach((lead) => {
  const valorVenda = toNumber(lead.venda)
  const campanha = normalizeCampaignName(lead.campanha)

  if (valorVenda <= 0) return

  if (!campanhasMap[campanha]) {
    campanhasMap[campanha] = { qtd: 0, valor: 0 }
  }

  campanhasMap[campanha].qtd += 1
  campanhasMap[campanha].valor += valorVenda
})

propostasFechadasLeads.forEach((lead) => {
  const valorVenda = toNumber(lead.venda)
  const produtosRaw = lead.Produto

  const produtos = Array.isArray(produtosRaw)
    ? produtosRaw
    : String(produtosRaw || '')
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)

  if (!produtos.length || valorVenda <= 0) return

  const valorPorProduto = valorVenda / produtos.length

  produtos.forEach((produto) => {
    if (!produtosMap[produto]) {
      produtosMap[produto] = { qtd: 0, valor: 0 }
    }

    produtosMap[produto].qtd += 1
    produtosMap[produto].valor += valorPorProduto
  })
})

const valorTotalProdutos = Object.values(produtosMap).reduce(
  (acc, item) => acc + item.valor,
  0
)

const produtosVendidos = Object.entries(produtosMap)
  .map(([nome, item]) => ({
    nome,
    qtd: item.qtd,
    valor: item.valor,
    percentual: valorTotalProdutos > 0 ? (item.valor / valorTotalProdutos) * 100 : 0,
  }))
  .sort((a, b) => b.valor - a.valor)

propostasFechadasLeads.forEach((lead) => {
  const campanha = normalizeCampaignName(lead.campanha)
  const valorVenda = toNumber(lead.venda)

  if (!campanhasMap[campanha]) {
    campanhasMap[campanha] = { qtd: 0, valor: 0 }
  }

  campanhasMap[campanha].qtd += 1
  campanhasMap[campanha].valor += valorVenda
})

const valorTotalCampanhas = Object.values(campanhasMap).reduce(
  (acc, item) => acc + item.valor,
  0
)

const campanhasVendidas = Object.entries(campanhasMap)
  .map(([nome, item]) => ({
    nome,
    qtd: item.qtd,
    valor: item.valor,
    percentual:
      valorTotalCampanhas > 0 ? (item.valor / valorTotalCampanhas) * 100 : 0,
  }))
  .sort((a, b) => b.valor - a.valor)

    const propostasFechadas = propostasFechadasLeads.length

    const valorTotalVendas = propostasFechadasLeads.reduce(
      (acc, l) => acc + toNumber(l.venda),
      0
    )

    const ticketMedioVendas =
      propostasFechadas > 0 ? valorTotalVendas / propostasFechadas : 0

    const propostasFechadasPercent = safePercent(propostasFechadas, propostasEnviadas)
    const metaValorTotalVendas = getMetaVendas(periodo, range.start, range.end)

    const funilVendas = {
      total: propostasEnviadasLeads.length,
      orcamentoEntregue: propostasEnviadasLeads.filter((l) =>
        statusIs(l, 'ORÇAMENTO ENTREGUE')
      ).length,
      solicitacaoCirurgia: propostasEnviadasLeads.filter((l) =>
        statusIs(l, 'SOLICITAÇÃO DE CIRURGIA')
      ).length,
      marcado: propostasEnviadasLeads.filter((l) =>
        statusIs(l, 'MARCADO')
      ).length,
      vendaGanha: propostasEnviadasLeads.filter((l) =>
        statusIs(l, 'VENDA GANHA')
      ).length,
      vendaPerdida: propostasEnviadasLeads.filter((l) =>
        statusIs(l, 'VENDA PERDIDA')
      ).length,
    }

    // REABORD
    const reabordCriadasPeriodo = reabordLeads.filter((l) =>
      inRange(parseDateLocal(l.created_at), range.start, range.end)
    )

    const emConversa = reabordCriadasPeriodo.filter((l) =>
      normalize(l.tag).includes('EM CONVERSA')
    ).length

    const semConversa = reabordCriadasPeriodo.filter((l) =>
      normalize(l.tag).includes('SEM CONVERSA')
    ).length

    const funilReabord = {
      total: reabordCriadasPeriodo.length,
      contato: reabordCriadasPeriodo.filter((l) => statusIs(l, 'CONTATO')).length,
      oferta: reabordCriadasPeriodo.filter((l) => statusIs(l, 'OFERTA')).length,
      agendado: reabordCriadasPeriodo.filter((l) => statusIs(l, 'AGENDADO')).length,
      fechadoGanho: reabordCriadasPeriodo.filter((l) =>
        statusIs(l, 'FECHADO (GANHO)')
      ).length,
      fechadoPerdido: reabordCriadasPeriodo.filter((l) =>
        statusIs(l, 'FECHADO (PERDIDO)')
      ).length,
      emConversa,
      semConversa,
    }

    const consolidadoQtdVendas = quantidadeConsulta + propostasFechadas
    const consolidadoValorVendas = valorTotalConsulta + valorTotalVendas
    const consolidadoTicketMedio =
      consolidadoQtdVendas > 0 ? consolidadoValorVendas / consolidadoQtdVendas : 0

    const evolucaoDiaria = buildEvolucaoDiaria(
      vendasLeads,
      consultaBasePeriodo,
      range
    )

    const origens = buildOrigens(consultaBasePeriodo)

    const leadsEntrada = consultaBasePeriodo

const leadsNaoQualificados = consultaBasePeriodo.filter((l) =>
  statusIs(l, 'PERDEU [NÃO QUALIFICADO]')
)

const leadsQualificados = leadsEntrada.filter((l) =>
  !statusIs(l, 'PERDEU [NÃO QUALIFICADO]')
)

const leadsAgendados = consultaLeads.filter((l) =>
  statusIs(l, 'AGENDADO') &&
  inRange(parseDateLocal(l.scheduled_at), range.start, range.end)
)
const origensVendaConsulta = buildOrigens(consultaGanhosLeads)

const origensPropostasFechadas = buildOrigens(propostasFechadasLeads)

   const { data: npsData, error: npsError } = await supabase
  .schema('kommo')
  .from('nps')
  .select('*')

if (npsError) {
  throw new Error(npsError.message)
}

const npsFiltrado = (npsData || []).filter((item: any) => {
  return inRange(
    parseDateLocal(String(item.id)),
    range.start,
    range.end
  )
})

const npsGoogle = npsFiltrado.reduce((total: number, item: any) => {
  return total + toNumber(item.quantidade)
}, 0)

const metaNpsGoogle = getMetaNps(range.start, range.end)
const npsGooglePercent = safePercent(npsGoogle, metaNpsGoogle)

const { data: noShowData, error: noShowError } = await supabase
  .schema('kommo')
  .from('noshow')
  .select('*')

if (noShowError) {
  throw new Error(noShowError.message)
}

const noShowFiltrado = (noShowData || []).filter((item: any) => {
  const dentroDoPeriodo = inRange(
    parseDateLocal(String(item.id)),
    range.start,
    range.end
  )

  if (!dentroDoPeriodo) return false

  if (segmento === 'geral') return true

  const medico = normalize(item.medico)

  if (segmento === 'vascular') {
    return MEDICOS_VASCULAR.some((m) => normalize(m) === medico)
  }

  if (segmento === 'emagrecimento') {
    return MEDICOS_EMAGRECIMENTO.some((m) => normalize(m) === medico)
  }

  return true
})

const totalAtendimentos = noShowFiltrado.reduce((total: number, item: any) => {
  return total + toNumber(item.atendimento)
}, 0)

const totalNoShow = noShowFiltrado.reduce((total: number, item: any) => {
  return total + toNumber(item.noshow)
}, 0)

const noShowPercent = safePercent(totalNoShow, totalAtendimentos)
const metaNoShowPercent = 10
const metaNoShowQuantidade = Math.round(
  totalAtendimentos * 0.1
)

const medicosPermitidos: string[] =
  segmento === 'vascular'
    ? MEDICOS_VASCULAR
    : segmento === 'emagrecimento'
    ? MEDICOS_EMAGRECIMENTO
    : Array.from(
        new Set<string>([
          ...MEDICOS_VASCULAR,
          ...MEDICOS_EMAGRECIMENTO,
          ...noShowFiltrado.map((item: any) => String(item.medico || 'Sem médico')),
          ...consultaGanhosLeads.map((lead) => String(lead.medico || 'Sem médico')),
        ])
      )

const consultaPorMedico = medicosPermitidos.map((medico) => {
  const med = normalize(medico)

  const atendimentosMedico = noShowFiltrado
    .filter((item: any) => normalize(item.medico) === med)
    .reduce((acc: number, item: any) => acc + toNumber(item.atendimento), 0)

  const noShowMedico = noShowFiltrado
    .filter((item: any) => normalize(item.medico) === med)
    .reduce((acc: number, item: any) => acc + toNumber(item.noshow), 0)

  const vendasConsultaMedico = consultaGanhosLeads.filter(
    (lead) => normalize(lead.medico) === med
  )

  const quantidadeConsulta = vendasConsultaMedico.length

  const valorConsulta = vendasConsultaMedico.reduce(
    (acc, lead) => acc + toNumber(lead.faturamento),
    0
  )

const ticketMedio =
  quantidadeConsulta > 0 ? valorConsulta / quantidadeConsulta : 0

const evolucaoConsulta = evolucaoDiaria.map((dia) => {
  const diaData = parseLocalDate(dia.data)

  return vendasConsultaMedico.filter((lead) => {
    const data = parseDateLocal(lead.closed_at)

    return (
      data &&
      data >= startOfDay(diaData) &&
      data <= endOfDay(diaData)
    )
  }).length
})

  return {
  medico: medico || 'Sem médico',
  atendimentos: atendimentosMedico,
  noShow: noShowMedico,
  noShowPercent:
    atendimentosMedico > 0
      ? Math.round((noShowMedico / atendimentosMedico) * 100)
      : 0,
  quantidadeConsulta,
  valorConsulta,
  ticketMedio,
  evolucaoConsulta,
}
})
const atendimentoConsulta = Object.values(
  consultaGanhosLeads.reduce((acc: any, lead: any) => {
    const tipo = String(lead.Atendimento || '').trim().toUpperCase()

    if (!tipo || tipo === 'NULL') return acc

    acc[tipo] = acc[tipo] || {
      nome: tipo,
      qtd: 0,
      valor: 0,
    }

    acc[tipo].qtd += 1
    acc[tipo].valor += toNumber(lead.faturamento || lead.venda || 0)

    return acc
  }, {})
).sort((a: any, b: any) => b.qtd - a.qtd)

const conveniosConsulta = Object.values(
  consultaGanhosLeads.reduce((acc: any, lead: any) => {
    const convenio = String(lead['Convênio'] || '').trim().toUpperCase()

    if (!convenio || convenio === 'NULL') return acc

    acc[convenio] = acc[convenio] || {
      nome: convenio,
      qtd: 0,
      valor: 0,
    }

    acc[convenio].qtd += 1
    acc[convenio].valor += toNumber(lead.faturamento || lead.venda || 0)

    return acc
  }, {})
).sort((a: any, b: any) => b.qtd - a.qtd)



    return Response.json({
      ok: true,
      filtros: {
        periodo,
        segmento,
        inicio: range.start.toISOString(),
        fim: range.end.toISOString(),
      },
      kpis: {
        marketing: {
          totalEntradas,
          naoQualificados,
          naoQualificadosPercent: safePercent(naoQualificados, totalEntradas),
          leadsAceitos,
          leadsAceitosPercent: safePercent(leadsAceitos, totalEntradas),
          agendados,
          agendadosPercent: safePercent(agendados, leadsAceitos),
        },
        comercialConsulta: {
          quantidadeConsulta,
          valorTotalConsulta,
          ticketMedioConsulta,
        },
        comercialVendas: {
  propostasEnviadas,
  propostasFechadas,
  propostasFechadasPercent,
  valorTotalVendas,
  ticketMedioVendas,
  leadsParadosVendas,
  metaPropostasFechadasPercent: 70,
  metaValorTotalVendas,
  metaTicketMedio: META_TICKET_MEDIO,
},
  experienciaCliente: {
  noShow: totalNoShow,
  totalAtendimentos,
  noShowPercent,
  metaNoShowPercent,
  metaNoShowQuantidade,
  npsGoogle,
  metaNpsGoogle,
  npsGooglePercent,
},
      },
        campanhaSiteRodolpho: {
          total: leadsSiteRodolpho.length,
          porStatus: statusSiteRodolpho,
        },
        tarefasProximaSemana: {
  consulta: tarefasProximaSemanaConsulta,
  vendas: tarefasProximaSemanaVendas,
  total: tarefasProximaSemanaConsulta + tarefasProximaSemanaVendas,
},
consultaPorMedico,
      consolidado: {
        qtdVendas: consolidadoQtdVendas,
        valorVendas: consolidadoValorVendas,
        ticketMedio: consolidadoTicketMedio,
        metaValorVendas: metaValorTotalVendas,
        metaTicketMedio: META_TICKET_MEDIO,
      },
      funil,
      funilVendas,
      produtosVendidos,
      campanhasVendidas,
      campanhasConsulta,
      vendasPorMedico,
      funilReabord,
      evolucaoDiaria,
      origens,
      atendimentoConsulta,
      conveniosConsulta,

      origensPorEtapa: {
  entrada: buildOrigens(leadsEntrada),
  naoQualificado: buildOrigens(leadsNaoQualificados),
  qualificado: buildOrigens(leadsQualificados),
  agendado: buildOrigens(leadsAgendados),
},

origensVendaConsulta: campanhasConsulta,
origensPropostasFechadas: campanhasVendidas,

reabordLeads,
    })

    
  } catch (err: any) {
    return Response.json({
      ok: false,
      error: err.message || 'Erro inesperado',
    })
  }
}