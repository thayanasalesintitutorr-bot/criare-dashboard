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
  Convenio?: string | null
  Data_de_atendimento?: string | null
  utm_campaing?: string | null
  utm_content?: string | null
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

// Retorna o campo bruto de origem do lead de acordo com o modo escolhido:
// 'campanha' agrupa por utm_campaing (campanha), 'anuncio' agrupa por utm_content (anúncio).
// Sempre cai para o campo legado "campanha" e depois "source" quando o utm específico não existir.
function origemField(lead: Lead, modo: 'campanha' | 'anuncio') {
  const utmEspecifico =
    modo === 'anuncio' ? lead.utm_content : lead.utm_campaing

  return (
    (utmEspecifico || '').trim() ||
    (lead.campanha || '').trim() ||
    (lead.source || '').trim() ||
    ''
  )
}

// PARSE LOCAL MANUAL — sem UTC
function parseDateLocal(value?: string | null) {
  if (!value) return null

  const clean = String(value)
    .trim()
    .replace('T', ' ')
    .replace(/([+-]\d{2}:\d{2})$/, '')
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

function parseDataAmplimed(value?: string | null) {
  if (!value) return null

  const match = String(value).match(
    /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/
  )

  if (!match) return null

  const [, dia, mes, ano, hora, minuto] = match

  return new Date(
    Number(ano),
    Number(mes) - 1,
    Number(dia),
    Number(hora),
    Number(minuto),
    0,
    0
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
  const now = new Date(
  new Date().toLocaleString('en-US', {
    timeZone: 'America/Sao_Paulo'
  })
)

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
function getPreviousRange(periodo: string, start: Date, end: Date) {
  const previousStart = new Date(start)
  const previousEnd = new Date(end)

  if (periodo === 'hoje' || periodo === 'ontem') {
    previousStart.setDate(start.getDate() - 1)
    previousEnd.setDate(end.getDate() - 1)

    return {
      start: startOfDay(previousStart),
      end: endOfDay(previousEnd),
    }
  }

  if (periodo === 'semana') {
    previousStart.setDate(start.getDate() - 7)
    previousEnd.setDate(end.getDate() - 7)

    return {
      start: startOfDay(previousStart),
      end: endOfDay(previousEnd),
    }
  }

  if (periodo === 'mes-atual' || periodo === 'mes-passado') {
    return {
      start: startOfDay(new Date(start.getFullYear(), start.getMonth() - 1, 1)),
      end: endOfDay(new Date(start.getFullYear(), start.getMonth(), 0)),
    }
  }

  const diff = end.getTime() - start.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1

  previousStart.setDate(start.getDate() - days)
  previousEnd.setDate(end.getDate() - days)

  return {
    start: startOfDay(previousStart),
    end: endOfDay(previousEnd),
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

function segmentoDoLead(lead: Lead): 'vascular' | 'emagrecimento' | null {
  const utm = normalize(lead.utm_campaing)
  const med = normalize(lead.medico)

  if (utm.includes('BRENO') || med.includes('BRENO')) return 'emagrecimento'

  if (
    utm.includes('RODOLPHO') ||
    utm.includes('CLAUDIA') ||
    med.includes('RODOLPHO') ||
    med.includes('CLAUDIA')
  ) {
    return 'vascular'
  }

  return null
}

function filterBySegmento(leads: Lead[], segmento: string) {
  if (segmento === 'geral') return leads

  return leads.filter((lead) => segmentoDoLead(lead) === segmento)
}

const META_MENSAL_VENDAS = 750000
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

// Quantidade de dias úteis (segunda a sexta) de um mês específico.
// Não desconta feriados.
function getBusinessDaysInMonth(ano: number, mes: number) {
  const inicio = new Date(ano, mes, 1)
  const fim = new Date(ano, mes + 1, 0)

  return countDiasUteis(inicio, fim)
}

// Meta diária do mês ao qual a data pertence: meta mensal fixa dividida
// apenas pelos dias úteis daquele mês (nunca pelos dias corridos).
function getDailyGoalForMonth(data: Date) {
  const diasUteisDoMes = getBusinessDaysInMonth(data.getFullYear(), data.getMonth())

  return diasUteisDoMes > 0 ? META_MENSAL_VENDAS / diasUteisDoMes : 0
}

// Soma a meta diária (do mês correspondente a cada dia) de todo dia útil
// dentro do intervalo. Se o intervalo atravessar meses diferentes, cada dia
// usa a meta diária do seu próprio mês.
function sumDailyGoalsInRange(start: Date, end: Date) {
  let total = 0
  const current = startOfDay(new Date(start))
  const fim = startOfDay(new Date(end))

  while (current <= fim) {
    if (isDiaUtil(current)) {
      total += getDailyGoalForMonth(current)
    }
    current.setDate(current.getDate() + 1)
  }

  return total
}

function getMetaNps(start: Date, end: Date) {
  const mesInicio = new Date(start.getFullYear(), start.getMonth(), 1)
  const mesFim = new Date(start.getFullYear(), start.getMonth() + 1, 0)

  const diasUteisMes = countDiasUteis(mesInicio, mesFim)
  const diasUteisPeriodo = Math.max(1, countDiasUteis(start, end))

  return Math.round((META_MENSAL_NPS / diasUteisMes) * diasUteisPeriodo)
}

// Função única para obter a meta de vendas de qualquer período.
//
// Regras:
// - Mês atual / mês passado / mês inteiro selecionado: meta mensal cheia (R$ 750.000).
// - Hoje / ontem: meta diária do mês da data (750.000 / dias úteis do mês).
// - Semana / personalizado / qualquer intervalo parcial: soma da meta diária
//   de cada dia útil dentro do intervalo (usando a meta diária do mês de cada dia).
function getGoalForPeriod(startDate: Date, endDate: Date, periodType: string) {
  const startDay = startOfDay(startDate)
  const endDay = startOfDay(endDate)

  const mesCompletoInicio = startOfDay(
    new Date(startDay.getFullYear(), startDay.getMonth(), 1)
  )

  const mesCompletoFim = startOfDay(
    new Date(startDay.getFullYear(), startDay.getMonth() + 1, 0)
  )

  const selecionouMesInteiro =
    startDay.getTime() === mesCompletoInicio.getTime() &&
    endDay.getTime() === mesCompletoFim.getTime()

  if (
    periodType === 'mes-atual' ||
    periodType === 'mes-passado' ||
    selecionouMesInteiro
  ) {
    return META_MENSAL_VENDAS
  }

  if (periodType === 'hoje' || periodType === 'ontem') {
    return getDailyGoalForMonth(startDay)
  }

  return sumDailyGoalsInRange(startDay, endDay)
}

function getMetaVendas(periodo: string, start: Date, end: Date) {
  return getGoalForPeriod(start, end, periodo)
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

function buildOrigens(leads: Lead[], modo: 'campanha' | 'anuncio' = 'campanha') {
  const map: Record<
    string,
    {
      quantidade: number
      detalhes: Record<string, number>
    }
  > = {}

  for (const lead of leads) {
    const origem = origemField(lead, modo) || 'Sem origem'

    const pipeline = lead.pipeline_id || 'SEM PIPELINE'
    const status = lead.status_id || 'SEM STATUS'
    const chaveDetalhe = `${pipeline} | ${status}`

    if (!map[origem]) {
      map[origem] = {
        quantidade: 0,
        detalhes: {},
      }
    }

    map[origem].quantidade += 1
    map[origem].detalhes[chaveDetalhe] =
      (map[origem].detalhes[chaveDetalhe] || 0) + 1
  }

  return Object.entries(map)
    .map(([nome, item]) => ({
      nome,
      quantidade: item.quantidade,
      detalhes: Object.entries(item.detalhes)
        .map(([nome, quantidade]) => ({
          nome,
          quantidade,
        }))
        .sort((a, b) => b.quantidade - a.quantidade),
    }))
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
  `https://afxgfgvdmgxcvamginjc.supabase.co/rest/v1/leads?pipeline_id=eq.${pipelineId}&select=id,name,pipeline_id,status_id,faturamento,venda,created_at,updated_at,closed_at,closest_task_at,campanha,source,tag,medico,scheduled_at,Produto,Atendimento,Data_de_atendimento,Convenio,utm_campaing,utm_content&offset=${from}&limit=${pageSize}`,
  {
    headers: {
  apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
  'Accept-Profile': 'kommo',
},
  }
)

if (!response.ok) {
  const errorText = await response.text()
  throw new Error(errorText)
}

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
    const origemModo =
      searchParams.get('origemModo') === 'anuncio' ? 'anuncio' : 'campanha'

    const range = getGlobalRange(periodo, customStart, customEnd)
    const previousRange = getPreviousRange(
  periodo,
  range.start,
  range.end
)
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
    const consultaBasePeriodo = consultaLeads.filter((l) => {
  const criadoNoPeriodo = inRange(
    parseDateLocal(l.created_at),
    range.start,
    range.end
  )

  const tag = normalize(l.tag)

  return (
    criadoNoPeriodo &&
    !tag.includes('REGISTRO_VENDA')
  )
})

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

    const consultaBasePeriodoAnterior = consultaLeads.filter((l) => {
  const criadoNoPeriodoAnterior = inRange(
    parseDateLocal(l.created_at),
    previousRange.start,
    previousRange.end
  )

  const tag = normalize(l.tag)

  return (
    criadoNoPeriodoAnterior &&
    !tag.includes('REGISTRO_VENDA')
  )
})

const totalEntradasAnterior = consultaBasePeriodoAnterior.length

const naoQualificadosAnterior = consultaBasePeriodoAnterior.filter((l) =>
  statusIs(l, 'PERDEU [NÃO QUALIFICADO]')
).length

const leadsAceitosAnterior =
  totalEntradasAnterior - naoQualificadosAnterior

const leadAAnterior = consultaBasePeriodoAnterior.filter((l) =>
  normalize(l.tag).includes('LEAD A')
).length

const leadBAnterior = consultaBasePeriodoAnterior.filter((l) =>
  normalize(l.tag).includes('LEAD B')
).length

const leadCAnterior = consultaBasePeriodoAnterior.filter((l) =>
  normalize(l.tag).includes('LEAD C')
).length

const leadDAnterior = consultaBasePeriodoAnterior.filter((l) =>
  normalize(l.tag).includes('LEAD D')
).length

const convertidosAnterior = consultaLeads.filter((l) => {
  return (
    inRange(parseDateLocal(l.created_at), previousRange.start, previousRange.end) &&
    (
      statusIs(l, 'AGENDADO') ||
      statusIs(l, 'GANHOU')
    )
  )
}).length

    const naoQualificados = consultaBasePeriodo.filter((l) =>
      statusIs(l, 'PERDEU [NÃO QUALIFICADO]')
    ).length

    const leadsAceitos = totalEntradas - naoQualificados

    const leadA = consultaBasePeriodo.filter((l) =>
  normalize(l.tag).includes('LEAD A')
).length

const leadB = consultaBasePeriodo.filter((l) =>
  normalize(l.tag).includes('LEAD B')
).length

const leadC = consultaBasePeriodo.filter((l) =>
  normalize(l.tag).includes('LEAD C')
).length

const leadD = consultaBasePeriodo.filter((l) =>
  normalize(l.tag).includes('LEAD D')
).length

    const convertidos = consultaLeads.filter((l) => {
  return (
    inRange(parseDateLocal(l.created_at), range.start, range.end) &&
    (
      statusIs(l, 'AGENDADO') ||
      statusIs(l, 'GANHOU')
    )
  )
}).length

    const agendadosLeadsPeriodo = consultaLeads.filter((l) => {
  return (
    statusIs(l, 'AGENDADO') &&
    inRange(parseDateLocal(l.scheduled_at), range.start, range.end)
  )
})

const agendadosFunil = agendadosLeadsPeriodo.length

   const consultaGanhosLeads = consultaLeads.filter((l) => {
  return (
    statusIs(l, 'GANHOU') &&
    inRange(parseDateLocal(l.closed_at), range.start, range.end)
  )
})

    const quantidadeConsulta = consultaGanhosLeads.length
    const valorTotalConsulta = consultaGanhosLeads.reduce(
      (acc, l) => acc + toNumber(l.faturamento),
      0
    )

    const ticketMedioConsulta =
      quantidadeConsulta > 0 ? valorTotalConsulta / quantidadeConsulta : 0

   const campanhasConsultaMap: Record<
  string,
  {
    qtd: number
    valor: number
    detalhes: {
      medico: string
      atendimento: string
      convenio: string
      valor: number
    }[]
  }
> = {}

consultaGanhosLeads.forEach((lead) => {
  const campanha = normalizeCampaignName(origemField(lead, origemModo))
  const valorConsulta = toNumber(lead.faturamento)

  if (valorConsulta <= 0) return

  if (!campanhasConsultaMap[campanha]) {
    campanhasConsultaMap[campanha] = {
      qtd: 0,
      valor: 0,
      detalhes: [],
    }
  }

  campanhasConsultaMap[campanha].qtd += 1
  campanhasConsultaMap[campanha].valor += valorConsulta

  campanhasConsultaMap[campanha].detalhes.push({
    medico: lead.medico || 'Sem médico',
    atendimento: lead.Atendimento || 'Sem atendimento',
    convenio: lead.Convenio || 'Particular',
    valor: valorConsulta,
  })
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
    detalhes: item.detalhes,
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

    const cicloVendaDiasLista = propostasFechadasLeads
      .map((l) => {
        const inicio = parseDateLocal(l.created_at)
        const fim = parseDateLocal(l.closed_at)

        if (!inicio || !fim) return null

        const dias = (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)

        return dias >= 0 ? dias : null
      })
      .filter((d): d is number => d !== null)

    const cicloVendaDias =
      cicloVendaDiasLista.length > 0
        ? cicloVendaDiasLista.reduce((acc, d) => acc + d, 0) / cicloVendaDiasLista.length
        : 0

    const produtosMap: Record<string, { qtd: number; valor: number }> = {}
    const campanhasMap: Record<
  string,
  {
    qtd: number
    valor: number
    detalhes: {
      medico: string
      produto: string
      valor: number
    }[]
  }
> = {}

    const medicosMap: Record<
  string,
  {
    valor: number
    produtos: Record<string, number>
  }
> = {
  'DR. RODOLPHO REIS': { valor: 0, produtos: {} },
  'DRA. CLAUDIA LAMEIRA': { valor: 0, produtos: {} },
  'DR. BRENO PITANGUI': { valor: 0, produtos: {} },
}

vendasLeads
  .filter((l) =>
    normalize(l.status_id).includes('GANHA') &&
    toNumber(l.venda) > 0 &&
    inRange(parseDateLocal(l.closed_at), range.start, range.end)
  )
  .forEach((lead) => {
  const medicoRaw = (lead.medico || '').trim() || 'Sem médico'
  const medicoNorm = normalize(medicoRaw)
  const medico = medicoNorm.includes('RODOLPHO')
    ? 'DR. RODOLPHO REIS'
    : medicoNorm.includes('CLAUDIA')
    ? 'DRA. CLAUDIA LAMEIRA'
    : medicoNorm.includes('BRENO')
    ? 'DR. BRENO PITANGUI'
    : medicoRaw
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

  const metaGeral = getMetaVendas(periodo, start, end)

  if (nomeNorm.includes('RODOLPHO')) {
    return metaGeral * 0.45
  }

  if (nomeNorm.includes('CLAUDIA')) {
    return metaGeral * 0.10
  }

  if (nomeNorm.includes('BRENO')) {
    return metaGeral * 0.45
  }

  return 0
}

propostasFechadasLeads.forEach((lead) => {
  const valorVenda = toNumber(lead.venda)
  const campanha = normalizeCampaignName(origemField(lead, origemModo))
  const produtosRaw = lead.Produto

  const produtos = Array.isArray(produtosRaw)
    ? produtosRaw
    : String(produtosRaw || '')
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)

  const produtoPrincipal =
    produtos.length > 0 ? produtos.join(', ') : 'Sem produto'
    
    produtos.forEach((produto) => {
  if (!produtosMap[produto]) {
    produtosMap[produto] = {
      qtd: 0,
      valor: 0,
    }
  }

  produtosMap[produto].qtd += 1
  produtosMap[produto].valor += valorVenda / produtos.length
})

  if (valorVenda <= 0) return

  if (!campanhasMap[campanha]) {
    campanhasMap[campanha] = {
      qtd: 0,
      valor: 0,
      detalhes: [],
    }
  }

  campanhasMap[campanha].qtd += 1
  campanhasMap[campanha].valor += valorVenda

  campanhasMap[campanha].detalhes.push({
    medico: lead.medico || 'Sem médico',
    produto: produtoPrincipal,
    valor: valorVenda,
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
    detalhes: item.detalhes,
  }))
  .sort((a, b) => b.valor - a.valor)
    const propostasFechadas = propostasFechadasLeads.length

    const valorTotalVendas = propostasFechadasLeads.reduce(
      (acc, l) => acc + toNumber(l.venda),
      0
    )

    const ticketMedioVendas =
      propostasFechadas > 0 ? valorTotalVendas / propostasFechadas : 0

      const consultaGanhosAnterior = consultaLeads.filter((l) => {
  return (
    statusIs(l, 'GANHOU') &&
    inRange(parseDateLocal(l.closed_at), previousRange.start, previousRange.end)
  )
})

const quantidadeAnterior = consultaGanhosAnterior.length

const valorAnterior = consultaGanhosAnterior.reduce(
  (acc, l) => acc + toNumber(l.faturamento),
  0
)

const ticketAnterior =
  quantidadeAnterior > 0 ? valorAnterior / quantidadeAnterior : 0

const procedimentosGanhosAnterior = vendasLeads.filter((l) => {
  return (
    statusIs(l, 'VENDA GANHA') &&
    toNumber(l.venda) > 0 &&
    inRange(parseDateLocal(l.closed_at), previousRange.start, previousRange.end)
  )
})

const quantidadeAnteriorProcedimentos = procedimentosGanhosAnterior.length

const valorAnteriorProcedimentos = procedimentosGanhosAnterior.reduce(
  (acc, l) => acc + toNumber(l.venda),
  0
)

const ticketAnteriorProcedimentos =
  quantidadeAnteriorProcedimentos > 0
    ? valorAnteriorProcedimentos / quantidadeAnteriorProcedimentos
    : 0

const reabordAnterior = reabordLeads.filter((l) => {
  return (
    statusIs(l, 'FECHADO (GANHO)') &&
    inRange(parseDateLocal(l.closed_at), previousRange.start, previousRange.end)
  )
})

const quantidadeAnteriorReabord = reabordAnterior.length

const valorAnteriorReabord = reabordAnterior.reduce(
  (acc, l) => acc + toNumber(l.faturamento),
  0
)

const ticketAnteriorReabord =
  quantidadeAnteriorReabord > 0
    ? valorAnteriorReabord / quantidadeAnteriorReabord
    : 0

const quantidadeAnteriorConsolidado =
  quantidadeAnterior + quantidadeAnteriorReabord + quantidadeAnteriorProcedimentos

const valorAnteriorConsolidado =
  valorAnterior + valorAnteriorReabord + valorAnteriorProcedimentos

const ticketAnteriorConsolidado =
  quantidadeAnteriorConsolidado > 0
    ? valorAnteriorConsolidado / quantidadeAnteriorConsolidado
    : 0
    const vendasPeriodoAnterior = vendasLeads.filter((l) =>
  inRange(parseDateLocal(l.created_at), previousRange.start, previousRange.end)
)

const orcamentosAnterior = vendasPeriodoAnterior.filter((l) =>
  statusIs(l, 'ORÇAMENTO ENTREGUE')
).length

const negociacaoAnterior =
  vendasPeriodoAnterior.filter((l) =>
    statusIs(l, 'SOLICITAÇÃO DE CIRURGIA')
  ).length +
  vendasPeriodoAnterior.filter((l) =>
    statusIs(l, 'MARCADO')
  ).length

const ganhasAnterior = vendasPeriodoAnterior.filter((l) =>
  statusIs(l, 'VENDA GANHA')
).length

const perdidasAnterior = vendasPeriodoAnterior.filter((l) =>
  statusIs(l, 'VENDA PERDIDA')
).length

const conversaoAnterior = safePercent(
  ganhasAnterior,
  vendasPeriodoAnterior.length
)

const valorAnteriorVendas = vendasLeads
  .filter((l) =>
    statusIs(l, 'VENDA GANHA') &&
    inRange(parseDateLocal(l.closed_at), previousRange.start, previousRange.end)
  )
  .reduce((acc, l) => acc + toNumber(l.venda), 0)

const ticketAnteriorVendas =
  ganhasAnterior > 0
    ? valorAnteriorVendas / ganhasAnterior
    : 0
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

   const reabordTags = reabordCriadasPeriodo.filter(
  (l) => normalize(l.pipeline_id) === 'REABORD'
)

const emConversa = reabordTags.filter((l) => {
  const tag = normalize(l.tag)

  return (
    tag.includes('EM CONVERSA') &&
    !tag.includes('SEM CONVERSA')
  )
}).length

const semConversa = reabordTags.filter((l) => {
  const tag = normalize(l.tag)

  return tag.includes('SEM CONVERSA')
}).length

const reabordFechadoGanho = reabordLeads.filter((l) =>
  statusIs(l, 'FECHADO (GANHO)') &&
  inRange(parseDateLocal(l.closed_at), range.start, range.end)
)

const quantidadeReabord = reabordFechadoGanho.length

const valorTotalReabord = reabordFechadoGanho.reduce(
  (acc, l) => acc + toNumber(l.faturamento),
  0
)

const ticketMedioReabord =
  quantidadeReabord > 0
    ? valorTotalReabord / quantidadeReabord
    : 0
    
    const funilReabord = {
      total: reabordCriadasPeriodo.length,
      contato: reabordCriadasPeriodo.filter((l) => statusIs(l, 'CONTATO')).length,
      oferta: reabordCriadasPeriodo.filter((l) => statusIs(l, 'OFERTA')).length,
      agendado: reabordLeads.filter((l) =>
  statusIs(l, 'AGENDADO') &&
  inRange(parseDateLocal(l.scheduled_at), range.start, range.end)
).length,

      fechadoGanho: reabordCriadasPeriodo.filter((l) =>
        statusIs(l, 'FECHADO (GANHO)')
      ).length,
      fechadoPerdido: reabordCriadasPeriodo.filter((l) =>
        statusIs(l, 'FECHADO (PERDIDO)')
      ).length,
      emConversa,
      semConversa,
    }



    const consolidadoQtdVendas =
  quantidadeConsulta + quantidadeReabord + propostasFechadas

const consolidadoValorVendas =
  valorTotalConsulta + valorTotalReabord + valorTotalVendas

const consolidadoTicketMedio =
  consolidadoQtdVendas > 0
    ? consolidadoValorVendas / consolidadoQtdVendas
    : 0

    const evolucaoDiaria = buildEvolucaoDiaria(
      vendasLeads,
      consultaBasePeriodo,
      range
    )

    const origens = buildOrigens(consultaBasePeriodo, origemModo)

    const leadsEntrada = consultaBasePeriodo

const leadsNaoQualificados = consultaBasePeriodo.filter((l) =>
  statusIs(l, 'PERDEU [NÃO QUALIFICADO]')
)

const leadsQualificados = leadsEntrada.filter((l) =>
  !statusIs(l, 'PERDEU [NÃO QUALIFICADO]')
)
const leadsQualificadosA = leadsQualificados.filter((l) =>
  normalize(l.tag).includes('LEAD A')
)

const leadsQualificadosB = leadsQualificados.filter((l) =>
  normalize(l.tag).includes('LEAD B')
)

const leadsQualificadosC = leadsQualificados.filter((l) =>
  normalize(l.tag).includes('LEAD C')
)

const leadsQualificadosD = leadsQualificados.filter((l) =>
  normalize(l.tag).includes('LEAD D')
)

const origensQualificadosPorTag = {
  todas: buildOrigens(leadsQualificados, origemModo),
  A: buildOrigens(leadsQualificadosA, origemModo),
  B: buildOrigens(leadsQualificadosB, origemModo),
  C: buildOrigens(leadsQualificadosC, origemModo),
  D: buildOrigens(leadsQualificadosD, origemModo),
}

const leadsAgendados = agendadosLeadsPeriodo

const origensVendaConsulta = campanhasConsulta

const origensPropostasFechadas = campanhasVendidas

  const npsResponse = await fetch(
  'https://afxgfgvdmgxcvamginjc.supabase.co/rest/v1/nps?select=*',
  {
    headers: {
  apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
  'Accept-Profile': 'kommo',
},
  }
)

if (!npsResponse.ok) {
  const errorText = await npsResponse.text()
  throw new Error(errorText)
}

const npsData = await npsResponse.json()

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

let noShowData: any[] = []
{
  let from = 0
  const pageSize = 1000

  while (true) {
    const noShowResponse = await fetch(
      `https://afxgfgvdmgxcvamginjc.supabase.co/rest/v1/noshow?select=*&offset=${from}&limit=${pageSize}`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          'Accept-Profile': 'kommo',
        },
      }
    )

    if (!noShowResponse.ok) {
      const errorText = await noShowResponse.text()
      throw new Error(errorText)
    }

    const page = await noShowResponse.json()

    if (!page || page.length === 0) break

    noShowData = noShowData.concat(page)

    if (page.length < pageSize) break

    from += pageSize
  }
}

const noShowFiltrado = (noShowData || []).filter((item: any) => {
  const data = parseDataAmplimed(item['Data e hora Agendada'])

  if (!inRange(data, range.start, range.end)) return false

  if (segmento === 'geral') return true

  const profissional = normalize(item['Profissional'])

  if (segmento === 'vascular') {
    return MEDICOS_VASCULAR.some((m) =>
      profissional.includes(normalize(m).split(' ')[1])
    )
  }

  if (segmento === 'emagrecimento') {
    return MEDICOS_EMAGRECIMENTO.some((m) =>
      profissional.includes(normalize(m).split(' ')[1])
    )
  }

  return true
})

const totalNoShow = noShowFiltrado.filter((item: any) => {
  const status = normalize(item['Status'])

  return (
    status.includes('NAO COMPARECEU') ||
    status.includes('NO SHOW') ||
    status.includes('NCOMPARECEU') ||
    status.includes('N COMPARECEU')
  )
}).length

const totalFinalizados = noShowFiltrado.filter((item: any) =>
  normalize(item['Status']).includes('FINALIZADO')
).length

const totalAtendimentos = totalFinalizados + totalNoShow

const noShowFiltradoAnterior = (noShowData || []).filter((item: any) => {
  const data = parseDataAmplimed(item['Data e hora Agendada'])

  if (!inRange(data, previousRange.start, previousRange.end)) return false

  if (segmento === 'geral') return true

  const profissional = normalize(item['Profissional'])

  if (segmento === 'vascular') {
    return MEDICOS_VASCULAR.some((m) =>
      profissional.includes(normalize(m).split(' ')[1])
    )
  }

  if (segmento === 'emagrecimento') {
    return MEDICOS_EMAGRECIMENTO.some((m) =>
      profissional.includes(normalize(m).split(' ')[1])
    )
  }

  return true
})

const consultasProcedimentosAnterior = [
  'COMBO LIPEDEMA',
  'COMBO VASCULAR',
  'COMBO VASCULAR CLINICA',
  'CONSULTA',
  'CONSULTA - LIPEDEMA',
  'CONSULTA - VASCULAR',
  'CONSULTA DE 1ª VEZ',
  'CONSULTA EM CONSULTÓRIO',
]

const totalPrimeiraVezAnterior = noShowFiltradoAnterior.filter((item: any) => {
  const status = normalize(item['Status'])
  const procedimento = normalize(item['Procedimento'])

  if (!status.includes('FINALIZADO')) return false
  if (!procedimento) return false

  return consultasProcedimentosAnterior.some((consulta) =>
    procedimento.includes(normalize(consulta))
  )
}).length

const totalNoShowAnterior = noShowFiltradoAnterior.filter((item: any) => {
  const status = normalize(item['Status'])

  return (
    status.includes('NAO COMPARECEU') ||
    status.includes('NO SHOW') ||
    status.includes('NCOMPARECEU') ||
    status.includes('N COMPARECEU')
  )
}).length

const totalFinalizadosAnterior = noShowFiltradoAnterior.filter((item: any) =>
  normalize(item['Status']).includes('FINALIZADO')
).length

const noShowPercent = safePercent(totalNoShow, totalAtendimentos)

const metaNoShowPercent = 10

const metaNoShowQuantidade = Math.round(
  totalAtendimentos * 0.1
)

function medicoKey(nome: unknown) {
  const n = normalize(nome)

  if (n.includes('RODOLPHO')) return 'DR. RODOLPHO REIS'
  if (n.includes('CLAUDIA')) return 'DRA. CLAUDIA LAMEIRA'
  if (n.includes('BRENO')) return 'DR. BRENO PITANGUI'

  return n || 'SEM MÉDICO'
}

const medicosPermitidos: string[] =
  segmento === 'vascular'
    ? MEDICOS_VASCULAR
    : segmento === 'emagrecimento'
    ? MEDICOS_EMAGRECIMENTO
    : Array.from(
        new Set<string>([
          ...MEDICOS_VASCULAR,
          ...MEDICOS_EMAGRECIMENTO,
          ...noShowFiltrado.map((item: any) =>
            medicoKey(item['Profissional'] || item.medico)
          ),
          ...consultaGanhosLeads.map((lead) =>
            medicoKey(lead.medico)
          ),
        ])
      )

  
const consultaPorMedico = medicosPermitidos.map((medico) => {
  const med = normalize(medico)
  const medKey = medicoKey(medico)

  const RETORNOS = [
  'RETORNO',
  'RETORNO - COMBO LIPEDEMA',
  'RETORNO - CRIOESCLEROTERAPIA',
  'RETORNO - DOPPLER (COMBO)',
  'RETORNO - ESCLEROTERAPIA AMPLIADA',
  'RETORNO - ESCLEROTERAPIA COM ESPUMA',
  'RETORNO - ESCLEROTERAPIA CONVENCIONAL',
  'RETORNO DE LASER TRANSDERMICO',
  'RETORNO DE LASER TRANSDERMICO - NITROSO',
  'RETORNO LASER TRANSDERMICO - COM NITROSO',
  'RETORNO- LASER TRANSDERMICO',
]

  const atendimentosAgendaMedico = noShowFiltrado.filter((item: any) => {
    const profissional = normalize(item['Profissional'])


    return profissional.includes(med.split(' ')[1] || med)
  })


const canceladosMedico = atendimentosAgendaMedico.filter((item: any) => {
  const status = normalize(item['Status'])

  return status.includes('CANCELADO')
}).length

const reagendadosMedico = atendimentosAgendaMedico.filter((item: any) => {
  const status = normalize(item['Status'])

  return status.includes('REAGENDADO')
}).length

  const atendimentosFinalizadosMedico = atendimentosAgendaMedico.filter((item: any) =>
    normalize(item['Status']).includes('FINALIZADO')
  )

  const atendimentosMedico = atendimentosFinalizadosMedico.length

  const manha = atendimentosFinalizadosMedico.filter((item: any) => {
    const data = parseDataAmplimed(item['Data e hora Agendada'])
    if (!data) return false

    const minutos = data.getHours() * 60 + data.getMinutes()
    return minutos <= 720
  }).length

  const tarde = atendimentosFinalizadosMedico.filter((item: any) => {
    const data = parseDataAmplimed(item['Data e hora Agendada'])
    if (!data) return false

    const minutos = data.getHours() * 60 + data.getMinutes()
    return minutos >= 721 && minutos <= 1200
  }).length

  const retornos = atendimentosAgendaMedico.filter((item: any) => {
  const status = normalize(item['Status'])
  const procedimento = normalize(item['Procedimento'])

  if (!status.includes('FINALIZADO')) return false
  if (!procedimento) return false

  return RETORNOS.some((retorno) =>
    procedimento.includes(normalize(retorno))
  )
}).length


  const consultasProcedimentos = [
  'COMBO LIPEDEMA',
  'COMBO VASCULAR',
  'COMBO VASCULAR CLINICA',
  'CONSULTA',
  'CONSULTA - LIPEDEMA',
  'CONSULTA - VASCULAR',
  'CONSULTA DE 1ª VEZ',
  'CONSULTA EM CONSULTÓRIO',
]

const consultasPrimeiraVezLista = atendimentosAgendaMedico.filter((item: any) => {
  const status = normalize(item['Status'])
  const procedimento = normalize(item['Procedimento'])

  if (!status.includes('FINALIZADO')) return false
  if (!procedimento) return false

  return consultasProcedimentos.some((consulta) =>
    procedimento.includes(normalize(consulta))
  )
})

const consultasPrimeiraVez = consultasPrimeiraVezLista.length

const cirurgiasProcedimentos = [
  'CIRURGIA VARIZES - TRATAMENTO CIRÚRGICO DE DOIS MEMBROS',
  'CIRURGIA VARIZES - TRATAMENTO CIRÚRGICO ENDOLASER',
  'CIRURGIA VARIZES - TRATAMENTO CIRÚRGICO DE UM MEMBRO',
  'MICROCIRURGIA COM NITROSO',
]


const produtosBreno = propostasFechadasLeads.filter((item: any) => {
  const produtos = String(item.Produto || '')
    .split(',')
    .map((p) => normalize(p))

  const possuiProdutoValido = produtos.some((produto) =>
    produto.includes('INJETAVEL') ||
    produto.includes('INJETAVEL CUSTO') ||
    produto.includes('PROTOCOLO RESET METABOLICO MASTER') ||
    produto.includes('PERNAS PLENAS') ||
    produto.includes('RESET METABOLICO BRENO') ||
    produto.includes('EMAGRECIMENTO PLENO') ||
    produto.includes('IMPLANTE') ||
    produto.includes('EMAGRECIMENTO PLENO START') ||
produto.includes('EMAGRECIMENTO PLENO ACELERADOR') ||
produto.includes('EMAGRECIMENTO PLENO SUPREMO') ||
produto.includes('PERNAS PLENAS START') ||
produto.includes('PERNAS PLENAS ACELERADOR') ||
produto.includes('PERNAS PLENAS SUPREMO') ||
produto.includes('PLENO TOTAL 3 MESES') ||
produto.includes('PLENO TOTAL 6 MESES') ||
produto.includes('HERA') ||
    produto.includes('SUBCISION COM BIOESTIMULADOR')
  )

  return (
    med.includes('BRENO') &&
    medicoKey(item.medico) === medicoKey(medico) &&
    statusIs(item, 'VENDA GANHA') &&
    inRange(parseDateLocal(item.closed_at), range.start, range.end) &&
    possuiProdutoValido
  )
})


let qtdInjetaveisVendidos = 0
let valorInjetaveisVendidos = 0

let qtdProtocolosVendidos = 0
let valorProtocolosVendidos = 0

produtosBreno.forEach((item: any) => {
  const produtos = Array.isArray(item.Produto)
    ? item.Produto
    : String(item.Produto || '')
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)

  if (!produtos.length) return

  const venda = toNumber(item.venda)
  const valorPorProduto = venda / produtos.length

  produtos.forEach((p: string) => {
    const produto = normalize(p)

    const ehInjetavel =
      produto.includes('INJETAVEL') ||
      produto.includes('INJETAVEL CUSTO')

    const ehProtocolo =
      produto.includes('PROTOCOLO RESET METABOLICO MASTER') ||
      produto.includes('PERNAS PLENAS') ||
      produto.includes('IMPLANTE') ||
      produto.includes('RESET METABOLICO') ||
produto.includes('EMAGRECIMENTO PLENO START') ||
produto.includes('EMAGRECIMENTO PLENO ACELERADOR') ||
produto.includes('EMAGRECIMENTO PLENO SUPREMO') ||
produto.includes('PERNAS PLENAS START') ||
produto.includes('PERNAS PLENAS ACELERADOR') ||
produto.includes('PERNAS PLENAS SUPREMO') ||
produto.includes('PLENO TOTAL 3 MESES') ||
produto.includes('HERA') ||
produto.includes('PLENO TOTAL 6 MESES') ||
      produto.includes('EMAGRECIMENTO PLENO')

    if (ehInjetavel) {
      qtdInjetaveisVendidos += 1
      valorInjetaveisVendidos += valorPorProduto
    }

    if (ehProtocolo) {
      qtdProtocolosVendidos += 1
      valorProtocolosVendidos += valorPorProduto
    }
  })
})

if (med.includes('BRENO')) {
  console.log('INJETAVEIS', {
    qtd: qtdInjetaveisVendidos,
    valor: valorInjetaveisVendidos,
  })

  console.log('PROTOCOLOS', {
    qtd: qtdProtocolosVendidos,
    valor: valorProtocolosVendidos,
  })
}

const procedimentosMedicoLista = atendimentosAgendaMedico.filter((item: any) => {
  const status = normalize(item['Status'])
  const procedimento = normalize(item['Procedimento'])


  if (!status.includes('FINALIZADO')) return false
  if (!procedimento) return false

  const ehConsulta = consultasProcedimentos.some((consulta) =>
    procedimento.includes(normalize(consulta))
  )

  const ehCirurgia = cirurgiasProcedimentos.some((cirurgia) =>
    procedimento.includes(normalize(cirurgia))
  )

  const ehRetorno = RETORNOS.some((retorno) =>
    procedimento.includes(normalize(retorno))
  )

  return !ehConsulta && !ehCirurgia && !ehRetorno
})

const procedimentosMedico = procedimentosMedicoLista.length

const cirurgiasMedicoLista = atendimentosAgendaMedico.filter((item: any) => {
  const status = normalize(item['Status'])
  const procedimento = normalize(item['Procedimento'])

  const statusValido =
    status.includes('FINALIZADO') ||
    status.includes('CONFIRMADO')

  if (!statusValido) return false
  if (!procedimento) return false

  return cirurgiasProcedimentos.some((cirurgia) =>
    procedimento.includes(normalize(cirurgia))
  )
})

const cirurgiasMedico = cirurgiasMedicoLista.length
  
  const capacidadeSemanal = med.includes('CLAUDIA') ? 28 : 40
const capacidadeDiaria = med.includes('CLAUDIA') ? 6 : 8

const capacidadeCalculada =
  periodo === 'hoje' || periodo === 'ontem'
    ? capacidadeDiaria
    : periodo === 'semana'
    ? capacidadeSemanal
    : periodo === 'mes-atual' || periodo === 'mes-passado'
    ? capacidadeDiaria * 20
    : capacidadeDiaria *
      Math.max(
        1,
        Math.floor(
          (startOfDay(range.end).getTime() -
            startOfDay(range.start).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1
      )

  const noShowMedico = atendimentosAgendaMedico.filter((item: any) => {
    const status = normalize(item['Status'])

    return (
      status.includes('NAO COMPARECEU') ||
      status.includes('NCOMPARECEU') ||
      status.includes('N COMPARECEU')
    )
  }).length

  const vendasConsultaMedico = consultaGanhosLeads.filter(
    (lead) => medicoKey(lead.medico) === medicoKey(medico)
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

    return data && data >= startOfDay(diaData) && data <= endOfDay(diaData)
  }).length
})

const evolucaoProcedimentos = evolucaoDiaria.map((dia) => {
  const diaData = parseLocalDate(dia.data)

  return procedimentosMedicoLista.filter((item: any) => {
    const data = parseDataAmplimed(item['Data e hora Agendada'])

    return data && data >= startOfDay(diaData) && data <= endOfDay(diaData)
  }).length
})

const evolucaoConsultaPrimeiraVez = evolucaoDiaria.map((dia) => {
  const diaData = parseLocalDate(dia.data)

  return consultasPrimeiraVezLista.filter((item: any) => {
    const data = parseDataAmplimed(item['Data e hora Agendada'])

    return data && data >= startOfDay(diaData) && data <= endOfDay(diaData)
  }).length
})

const evolucaoCirurgias = evolucaoDiaria.map((dia) => {
  const diaData = parseLocalDate(dia.data)

  return cirurgiasMedicoLista.filter((item: any) => {
    const data = parseDataAmplimed(item['Data e hora Agendada'])

    return data && data >= startOfDay(diaData) && data <= endOfDay(diaData)
  }).length
})
  
if (med.includes('BRENO')) {
  console.log('BRENO produtosBreno:', produtosBreno.map((x:any) => ({
    produto: x.Produto,
    venda: x.venda,
    status: x.status_id,
    closed_at: x.closed_at,
    medico: x.medico,
  })))
}

  return {
  medico: medKey,

  consultasPrimeiraVez,
  evolucaoConsultaPrimeiraVez,

  atendimentos: atendimentosMedico,
  manha,
  tarde,
  retornos,
  capacidadeAgenda:
    capacidadeCalculada > 0
  ? Math.min(
      Math.round((atendimentosMedico / capacidadeCalculada) * 100),
      100
    )
  : 0,
  noShow: noShowMedico,
  noShowPercent:
  atendimentosAgendaMedico.length > 0
    ? Math.round((noShowMedico / atendimentosAgendaMedico.length) * 100)
    : 0,

  procedimentos:
  med.includes('BRENO')
    ? 1
    : procedimentosMedico,
  cirurgias: cirurgiasMedico,

  injetaveisVendidos: qtdInjetaveisVendidos,
valorInjetaveisVendidos,

protocolosVendidos: qtdProtocolosVendidos,
valorProtocolosVendidos,

  cancelados: canceladosMedico,
reagendados: reagendadosMedico,

  quantidadeConsulta,
  valorConsulta,
  ticketMedio,
  evolucaoConsulta,
  proximosAtendimentos: 0,
  evolucaoProcedimentos:
  med.includes('BRENO')
    ? evolucaoProcedimentos.map((v, i) => {
        const dia = evolucaoDiaria[i]
        const diaData = parseLocalDate(dia.data)

        const subcisionDia = produtosBreno.filter((item: any) => {
          const produto = normalize(item['Produto'])
          const data = parseDateLocal(item.closed_at)

          return (
            produto.includes('SUBCISION COM BIOESTIMULADOR') &&
            data &&
            data >= startOfDay(diaData) &&
            data <= endOfDay(diaData)
          )
        }).length

        return v + subcisionDia
      })
    : evolucaoProcedimentos,
  evolucaoCirurgias,
    
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
    const convenio = String(lead['Convenio'] || '').trim().toUpperCase()

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

const totalReagendados = consultaPorMedico.reduce(
  (acc, medico) => acc + Number(medico.reagendados || 0),
  0
)

const totalCancelados = consultaPorMedico.reduce(
  (acc, medico) => acc + Number(medico.cancelados || 0),
  0
)

const totalReagendadosAnterior = medicosPermitidos.reduce((acc, medico) => {
  const med = normalize(medico)

  const atendimentosAgendaMedicoAnterior = noShowFiltradoAnterior.filter((item: any) => {
    const profissional = normalize(item['Profissional'])
    return profissional.includes(med.split(' ')[1] || med)
  })

  return (
    acc +
    atendimentosAgendaMedicoAnterior.filter((item: any) =>
      normalize(item['Status']).includes('REAGENDADO')
    ).length
  )
}, 0)

const totalCanceladosAnterior = medicosPermitidos.reduce((acc, medico) => {
  const med = normalize(medico)

  const atendimentosAgendaMedicoAnterior = noShowFiltradoAnterior.filter((item: any) => {
    const profissional = normalize(item['Profissional'])
    return profissional.includes(med.split(' ')[1] || med)
  })

  return (
    acc +
    atendimentosAgendaMedicoAnterior.filter((item: any) =>
      normalize(item['Status']).includes('CANCELADO')
    ).length
  )
}, 0)

const totalAgendamentosExperiencia =
  totalAtendimentos + totalReagendados + totalCancelados

const reagendadosPercent = safePercent(
  totalReagendados,
  totalAgendamentosExperiencia
)

const canceladosPercent = safePercent(
  totalCancelados,
  totalAgendamentosExperiencia
)
console.log({
  consultaPorMedico,
  evolucaoDiaria,
  consultaGanhosLeads: consultaGanhosLeads.length,
  leadsAgendados: leadsAgendados.length,
  atendimentoConsulta,
  totalFinalizados,
  totalNoShow,
  totalReagendados,
  totalCancelados,
})

const painelAtendimento = {
  totalPrimeiraVez: consultaPorMedico.reduce(
    (acc, medico) => acc + Number(medico.consultasPrimeiraVez || 0),
    0
  ),

  totalRecebimentoConsulta: consultaPorMedico.reduce(
    (acc, medico) => acc + Number(medico.quantidadeConsulta || 0),
    0
  ),

  faturamentoConsulta: consultaPorMedico.reduce(
    (acc, medico) => acc + Number(medico.valorConsulta || 0),
    0
  ),

  ticketMedioConsulta:
    consultaPorMedico.reduce(
      (acc, medico) => acc + Number(medico.quantidadeConsulta || 0),
      0
    ) > 0
      ? consultaPorMedico.reduce(
          (acc, medico) => acc + Number(medico.valorConsulta || 0),
          0
        ) /
        consultaPorMedico.reduce(
          (acc, medico) => acc + Number(medico.quantidadeConsulta || 0),
          0
        )
      : 0,

  atendimentoPorDia: evolucaoDiaria.map((dia, index) => ({
    data: dia.data,
    label: dia.label,
    quantidade: consultaPorMedico.reduce(
      (acc, medico) =>
        acc + Number(medico.evolucaoConsultaPrimeiraVez?.[index] || 0),
      0
    ),
  })),
  totalAgendamentos: leadsAgendados.length,
  statusAgenda: {
    finalizados: totalFinalizados,
    noShow: totalNoShow,
    reagendados: totalReagendados,
    cancelados: totalCancelados,
  },

  evolucaoFaturamento: evolucaoDiaria.map((dia) => {
    const diaData = parseLocalDate(dia.data)

    const valor = consultaGanhosLeads
      .filter((lead) => {
        const data = parseDateLocal(lead.closed_at)
        return data && data >= startOfDay(diaData) && data <= endOfDay(diaData)
      })
      .reduce((acc, lead) => acc + toNumber(lead.faturamento), 0)

    return {
      data: dia.data,
      label: dia.label,
      valor,
    }
  }),

  agendamentosPorOrigem: buildOrigens(leadsAgendados, origemModo),

  finalizadosParticularConvenio: atendimentoConsulta,
}


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
      convertidos,
      convertidosPercent: safePercent(convertidos, leadsAceitos),
      leadA,
      leadB,
      leadC,
      leadD,
       },
      comercialConsulta: {
      quantidadeConsulta,
      valorTotalConsulta,
      ticketMedioConsulta,
      quantidadeReabord,
      valorTotalReabord,
      ticketMedioReabord,
      quantidadeTotal:
      quantidadeConsulta + quantidadeReabord,
      valorTotal:
      valorTotalConsulta + valorTotalReabord,
      ticketMedioTotal:
      quantidadeConsulta + quantidadeReabord > 0
      ? (
          valorTotalConsulta +
          valorTotalReabord
        ) /
        (
          quantidadeConsulta +
          quantidadeReabord
        )
      : 0,
},
        comercialVendas: {
  propostasEnviadas,
  propostasFechadas,
  propostasFechadasPercent,
  valorTotalVendas,
  ticketMedioVendas,
  leadsParadosVendas,
  cicloVendaDias,
  metaPropostasFechadasPercent: 70,
  metaValorTotalVendas,
  metaTicketMedio: META_TICKET_MEDIO,
},
  experienciaCliente: {
  noShow: totalNoShow,
  noShowPercent,
  metaNoShowPercent,
  metaNoShowQuantidade,

  reagendados: totalReagendados,
  reagendadosPercent,

  cancelados: totalCancelados,
  canceladosPercent,

  npsGoogle,
  npsGooglePercent,
  metaNpsGoogle,
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
painelAtendimento,
      consolidado: {
        qtdVendas: consolidadoQtdVendas,
        valorVendas: consolidadoValorVendas,
        ticketMedio: consolidadoTicketMedio,
        metaValorVendas: metaValorTotalVendas,
        metaTicketMedio: META_TICKET_MEDIO,
    
      },
      comparativo: {
      atendimento: {
      totalPrimeiraVezAnterior,
  },
  marketing: {
    totalEntradasAnterior,
    naoQualificadosAnterior,
    leadsAceitosAnterior,
    leadAAnterior,
    leadBAnterior,
    leadCAnterior,
    leadDAnterior,
    convertidosAnterior,
  },

  comercialConsulta: {
    quantidadeConsultaAnterior: quantidadeAnterior,
    valorTotalConsultaAnterior: valorAnterior,
    ticketMedioConsultaAnterior: ticketAnterior,

    quantidadeReabordAnterior: quantidadeAnteriorReabord,
    valorTotalReabordAnterior: valorAnteriorReabord,
    ticketMedioReabordAnterior: ticketAnteriorReabord,

    quantidadeTotalAnterior:
      quantidadeAnterior + quantidadeAnteriorReabord,

    valorTotalAnterior:
      valorAnterior + valorAnteriorReabord,

    ticketMedioTotalAnterior:
      quantidadeAnterior + quantidadeAnteriorReabord > 0
        ? (valorAnterior + valorAnteriorReabord) /
          (quantidadeAnterior + quantidadeAnteriorReabord)
        : 0,
  },

  comercialVendas: {
    propostasEnviadasAnterior: orcamentosAnterior,
    propostasFechadasAnterior: ganhasAnterior,
    propostasPerdidasAnterior: perdidasAnterior,
    propostasFechadasPercentAnterior: conversaoAnterior,
    valorTotalVendasAnterior: valorAnteriorVendas,
    ticketMedioVendasAnterior: ticketAnteriorVendas,
  },

  experienciaCliente: null,

  consolidado: {
    qtdVendasAnterior: quantidadeAnteriorConsolidado,
    valorVendasAnterior: valorAnteriorConsolidado,
    ticketMedioAnterior: ticketAnteriorConsolidado,
  },

  statusAgenda: {
    finalizadosAnterior: totalFinalizadosAnterior,
    noShowAnterior: totalNoShowAnterior,
    reagendadosAnterior: totalReagendadosAnterior,
    canceladosAnterior: totalCanceladosAnterior,
  },
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
      entrada: buildOrigens(leadsEntrada, origemModo),
      naoQualificado: buildOrigens(leadsNaoQualificados, origemModo),
      qualificado: buildOrigens(leadsQualificados, origemModo),
      agendado: buildOrigens(leadsAgendados, origemModo),
},

origensQualificadosPorTag,
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