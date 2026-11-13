'use client'

import { ReactNode, useEffect, useState } from 'react'
import {
  Funnel,
  Star,
  Stethoscope,
  Users,
  ChartNoAxesCombined,
} from 'lucide-react'
import { useFilters } from '@/store/use-filters'
import { useSetPageHeader } from '@/store/use-page-header'
import { PrimeiraMensagemTile } from '@/components/marketing/primeira-mensagem-tile'
import { OrigensPrimeiraMensagemCard } from '@/components/marketing/origens-primeira-mensagem-card'
import { deepEqual } from '@/lib/deep-equal'
import { AnimatedBackdrop } from '@/components/dashboard/animated-backdrop'
import { DesempenhoDiarioCard } from '@/components/dashboard/desempenho-diario-card'
import { Slide, SlideDeck } from '@/components/dashboard/slides'
import { PerspectivaMeta } from '@/components/dashboard/perspectiva-meta'
import { IntegridadeFechamento } from '@/components/dashboard/integridade-fechamento'
import { useModoSlides } from '@/store/use-zoom'

type EvolucaoDiariaItem = {
  data: string
  label: string
  leads: number
  vendasValor: number
  desqualificados: number
}

type OrigemItem = {
  nome: string
  quantidade: number
  detalhes?: { nome: string; quantidade: number }[]
}

type DashboardResponse = {
  ok: boolean
  kpis?: {
    marketing: {
  totalEntradas: number
  naoQualificados: number
  naoQualificadosPercent: number
  leadsAceitos: number
  leadsAceitosPercent: number
  convertidos: number
  convertidosPercent: number
  leadA: number
  leadB: number
  leadC: number
  leadD: number
  convertidoLeadA: number
  convertidoLeadB: number
  convertidoLeadC: number
  convertidoLeadD: number
}
    comercialConsulta: {
  quantidadeConsulta: number
  valorTotalConsulta: number
  ticketMedioConsulta: number
  ritmoConsulta: number
  diasUteisRitmoPeriodo: number

  quantidadeReabord: number
  valorTotalReabord: number
  ticketMedioReabord: number

  quantidadeTotal: number
  valorTotal: number
  ticketMedioTotal: number
}
    comercialVendas: {
      propostasEnviadas: number
      propostasFechadas: number
      propostasFechadasPercent: number
      valorTotalVendas: number
      ticketMedioVendas: number
      ritmoVendas: number
      cicloVendaDias: number
      metaPropostasFechadasPercent: number
      metaValorTotalVendas: number
      metaTicketMedio: number
    }
    experienciaCliente?: {
      noShow: number
      noShowPercent: number
      metaNoShowPercent: number
      metaNoShowQuantidade: number
      reagendados: number
      reagendadosPercent: number
      cancelados: number
      canceladosPercent: number
      npsGoogle: number
      npsGooglePercent: number
      metaNpsGoogle: number
    }
    atendimentoConsulta?: {
  nome: string
  qtd: number
  valor: number
}[]

conveniosConsulta?: {
  nome: string
  qtd: number
  valor: number
}[]

  }
  consolidado?: {
    qtdVendas: number
    valorVendas: number
    ticketMedio: number
    metaValorVendas: number
    metaTicketMedio: number
  }
  campanhaMeta?: {
    metaDiaria: number
    realizado: number
    falta: number
    diasUteisRestantes: number
    diasUteisPassados: number
    totalMeta: number
  }

  comparativo?: {
    marketing?: {
      totalEntradasAnterior?: number
      leadsAceitosAnterior?: number
    }
    comercialConsulta?: {
      quantidadeConsultaAnterior?: number
      valorTotalConsultaAnterior?: number
      ticketMedioConsultaAnterior?: number
      quantidadeReabordAnterior?: number
      valorTotalReabordAnterior?: number
      ticketMedioReabordAnterior?: number
      quantidadeTotalAnterior?: number
      valorTotalAnterior?: number
      ticketMedioTotalAnterior?: number
    }
    comercialVendas?: {
      propostasEnviadasAnterior?: number
      valorTotalVendasAnterior?: number
      ticketMedioVendasAnterior?: number
    }
    consolidado?: {
      qtdVendasAnterior?: number
      valorVendasAnterior?: number
      ticketMedioAnterior?: number
    }
    statusAgenda?: {
      finalizadosAnterior?: number
      noShowAnterior?: number
      reagendadosAnterior?: number
      canceladosAnterior?: number
    }
  }

  funil?: {
    entrada: number
    primeiroContato: number
    formulario: number
    followUp: number
    naoQualificado: number
    qualificado: number
    agendado: number
    ganhou: number
    perdeu: number
  }
  funilVendas?: {
    total: number
    orcamentoEntregue: number
    solicitacaoCirurgia: number
    marcado: number
    vendaGanha: number
    vendaPerdida: number
  }
  funilReabord?: {
    total: number
    contato: number
    oferta: number
    agendado: number
    fechadoGanho: number
    fechadoPerdido: number
    emConversa: number
    semConversa: number
    
    consolidado?: {
  qtdVendas: number
  valorVendas: number
  ticketMedio: number
  metaValorVendas: number
  metaTicketMedio: number
}

  }

  evolucaoDiaria?: EvolucaoDiariaItem[]
  painelAtendimento?: {
    atendimentoPorDia?: { data: string; label: string; quantidade: number }[]
    evolucaoFaturamento?: { data: string; label: string; valor: number }[]
  }
  origens?: OrigemItem[]
  primeiraMensagem?: {
    total: number
    origens: OrigemItem[]
  }
  consultaPorMedico?: {
  medico: string
  atendimentos: number
  noShow: number
  noShowPercent: number
  cancelados: number
  reagendados: number
  consultasPrimeiraVez: number
  retornos: number
  tempoEsperaMedio?: number
  tempoAtendimentoMedio?: number
  quantidadeConsulta: number
  valorConsulta: number
  ticketMedio: number
  proximosAtendimentos: number
  capacidadeAgenda?: number
  agendaSemDados?: boolean
  atendimentosAnterior?: number
  faturamentoConsolidadoAnterior?: number
  consultasPrimeiraVezAnterior?: number
  retornosAnterior?: number
  noShowAnterior?: number
  canceladosAnterior?: number
  reagendadosAnterior?: number
}[]
campanhasConsulta?: {
  nome: string
  qtd: number
  valor: number
  percentual: number
}[]

vendasPorMedico?: {
  nome: string
  valor: number
  meta: number
  percentual: number
  propostasEnviadas?: number
  vendasFechadas?: number
  taxaConversao?: number
  produtos?: {
    produto: string
    qtd: number
  }[]
}[]

  error?: string

campanhaSiteRodolpho?: {
  total: number
  porStatus: Record<string, number>
}
}

function formatMoney(v: number) {
  return v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })
}

function formatMoneyShort(v: number) {
  if (v >= 1000000) {
    const x = v / 1000000
    return `R$ ${x % 1 === 0 ? x.toFixed(0) : x.toFixed(1)} mi`
  }
  if (v >= 1000) {
    const x = v / 1000
    return `R$ ${x % 1 === 0 ? x.toFixed(0) : x.toFixed(1)} mil`
  }
  return formatMoney(v)
}

function formatPercent(v: number) {
  return `${Math.round(v)}%`
}

function getMetricStatus(vp: number, tp: number, mode: 'max' | 'min') {
  const isGood = mode === 'max' ? vp <= tp : vp >= tp
  return {
    isGood,
    barClass: isGood ? 'bg-[var(--success)]' : 'bg-[var(--danger)]',
    textClass: isGood ? 'text-[var(--success)]' : 'text-[var(--danger)]',
  }
}

function clampPercent(v: number) {
  return Math.max(0, Math.min(v, 100))
}

function textPrimary() {
  return 'text-[var(--foreground)]'
}

function textSecondary() {
  return 'text-[var(--muted-foreground)]'
}

function cardBg() {
  // Mesmo padrão de vidro já usado na página /marketing (bg translúcido +
  // blur), aplicado aqui pra Visão Geral ter a mesma cara.
  return 'fx-card rounded-[24px] border border-[color:var(--border)] bg-[var(--card)]/60 backdrop-blur-xl backdrop-saturate-150 shadow-[var(--card-shadow)] transition-colors duration-200'
}

function metricCardBg() {
  return 'fx-card-mini rounded-[22px] border border-[color:var(--border)] bg-[var(--metric-card)]/55 backdrop-blur-lg backdrop-saturate-150 px-4 py-2 transition-colors duration-200'
}

function LiveIndicator({ lastUpdated, now }: { lastUpdated: Date | null; now: Date }) {
  if (!lastUpdated) return null

  const seconds = Math.max(0, Math.floor((now.getTime() - lastUpdated.getTime()) / 1000))
  const label =
    seconds < 5
      ? 'atualizado agora mesmo'
      : seconds < 60
        ? `atualizado há ${seconds}s`
        : `atualizado há ${Math.floor(seconds / 60)}min`

  const stale = seconds > 30

  return (
    <div className={`flex items-start gap-2 text-[12px] font-semibold ${textSecondary()}`}>
      <span
        className={`mt-1 inline-flex h-2 w-2 shrink-0 rounded-full ${
          stale ? 'bg-[var(--warning)]' : 'bg-[var(--success)]'
        }`}
      />
      <span className="min-w-0">{label}</span>
    </div>
  )
}

function GroupCard({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  const { viewMode } = useFilters()
  const isApresentacao = viewMode === 'apresentacao'

  return (
    <Slide>
    <section className={`relative z-0 min-w-0 overflow-hidden hover:z-20 ${isApresentacao ? 'p-6' : viewMode === 'iphone' ? 'p-4' : 'px-4 py-2'} ${cardBg()}`}>
      <div className={`${isApresentacao ? 'mb-5' : viewMode === 'iphone' ? 'mb-3' : 'mb-2'} flex items-center gap-3`}>
  <div className={`flex items-center justify-center rounded-2xl bg-[var(--accent)]/12 text-[var(--accent)] ${isApresentacao ? 'h-14 w-14' : viewMode === 'iphone' ? 'h-10 w-10' : 'h-9 w-9'}`}>
    {icon}
  </div>

  <h3
    className={`
      ${isApresentacao ? 'text-[42px]' : viewMode === 'iphone' ? 'text-[20px]' : 'text-[18px]'}
      font-bold tracking-[-0.02em]
      ${textPrimary()}
    `}
  >
    {title}
  </h3>
      </div>
      <div className={isApresentacao ? 'space-y-7' : viewMode === 'iphone' ? 'space-y-3' : 'space-y-1'}>{children}</div>
    </section>
    </Slide>
  )
}

function SimpleMetric({
  label,
  value,
  previousValue,
  showCompare = false,
  empty = false,
  children,
  iphoneOnValueClick,
}: {
  label: string
  value: number | string
  previousValue?: number
  showCompare?: boolean
  empty?: boolean
  children?: React.ReactNode
  iphoneOnValueClick?: () => void
}) {
  const { viewMode } = useFilters()
  const isApresentacao = viewMode === 'apresentacao'
  const numericValue =
  typeof value === 'number'
    ? value
    : Number(String(value).replace(/[^\d,-]/g, '').replace(',', '.')) || 0

const diff =
  previousValue !== undefined && previousValue > 0
    ? ((numericValue - previousValue) / previousValue) * 100
    : 0

const isUp = diff >= 0

  if (empty) {
    return (
      <div className="min-w-0 space-y-1">
        <h4
          className={`truncate ${
            isApresentacao ? 'text-[26px] font-semibold' : viewMode === 'iphone' ? 'text-[15px] font-semibold' : 'text-[14px] font-medium'
          } ${textSecondary()}`}
        >
          {label}
        </h4>

        <div
          className={`${
            isApresentacao ? 'text-[64px]' : viewMode === 'iphone' ? 'text-[28px]' : 'text-[32px]'
          } font-medium tracking-[-0.02em] leading-none text-[var(--muted-foreground)]/40`}
        >
          —
        </div>

        <p className={`${isApresentacao ? 'text-[22px]' : viewMode === 'iphone' ? 'text-[12px]' : 'text-[11px]'} font-medium ${textSecondary()}`}>
          Sem dados no período
        </p>
      </div>
    )
  }

  return (
    <div className="relative min-w-0 space-y-1">
      <h4
        className={`truncate ${
          isApresentacao ? 'text-[26px] font-semibold' : viewMode === 'iphone' ? 'text-[15px] font-semibold' : 'text-[14px] font-medium'
        } ${textSecondary()}`}
      >
        {label}
      </h4>

      <div className="relative group block w-full min-w-0">
  <div
    onClick={viewMode === 'iphone' ? iphoneOnValueClick : undefined}
    className={`truncate ${
      isApresentacao ? 'text-[64px]' : viewMode === 'iphone' ? 'text-[28px]' : 'text-[32px]'
    } font-medium tracking-[-0.02em] leading-none cursor-pointer ${textPrimary()}`}
  >
    {value}
  </div>

  {children}
</div>

      {showCompare && (
  <div className={`flex items-center gap-2 ${isApresentacao ? 'text-[24px]' : viewMode === 'iphone' ? 'text-[12px]' : 'text-[12px]'}`}>
    <span className={`font-medium ${isUp ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
      {isUp ? '▲' : '▼'} {formatPercent(Math.abs(diff))}
    </span>

    <span className={`font-medium ${textSecondary()}`}>
      ant. {typeof value === 'string' && value.includes('R$') ? formatMoney(previousValue || 0) : previousValue || 0}
    </span>
  </div>
)}
    </div>
  )
}

function GoalMetric({
  label,
  value,
  percent,
  target,
  mode,
  metaLabel,
  empty = false,
  previousValue,
  showCompare = false,
}: {
  label: string
  value: ReactNode
  percent: number
  target: number
  mode: 'max' | 'min'
  metaLabel?: string
  empty?: boolean
  previousValue?: number
  showCompare?: boolean
}) {
  const { viewMode } = useFilters()
  const s = getMetricStatus(percent, target, mode)

  const isApresentacao = viewMode === 'apresentacao'

  const base = Number(previousValue || 0)
  const numericValue = typeof value === 'number' ? value : Number(value) || 0
  const diff = base > 0 ? Math.round(((numericValue - base) / base) * 100) : 0
  const subiu = diff > 0
  const caiu = diff < 0
  // mode="max" é métrica de "quanto menos melhor" (No Show, Reagendados,
  // Cancelados) — nessas, subir é piorar e cair é melhorar; é o inverso de
  // mode="min".
  const melhorou = mode === 'max' ? caiu : subiu
  const piorou = mode === 'max' ? subiu : caiu

  if (empty) {
    return (
      <div className={isApresentacao ? 'space-y-2' : viewMode === 'iphone' ? 'space-y-2' : 'space-y-1'}>
        <h4
          className={`${
            isApresentacao ? 'text-[28px] font-semibold' : viewMode === 'iphone' ? 'text-[15px] font-semibold' : 'text-[14px] font-medium'
          } leading-tight ${textSecondary()}`}
        >
          {label}
        </h4>

        <div
          className={`${
            isApresentacao ? 'text-[64px]' : viewMode === 'iphone' ? 'text-[28px]' : 'text-[32px]'
          } font-medium tracking-[-0.02em] text-[var(--muted-foreground)]/40`}
        >
          —
        </div>

        <p className={`${isApresentacao ? 'text-[22px]' : viewMode === 'iphone' ? 'text-[12px]' : 'text-[11px]'} font-medium ${textSecondary()}`}>
          Sem dados no período
        </p>
      </div>
    )
  }

  return (
    <div className={isApresentacao ? 'space-y-2' : viewMode === 'iphone' ? 'space-y-2' : 'space-y-1'}>
      <h4
        className={`${
         isApresentacao ? 'text-[28px] font-semibold' : viewMode === 'iphone' ? 'text-[15px] font-semibold' : 'text-[14px] font-medium'
        } leading-tight ${textSecondary()}`}
      >
        {label}
      </h4>

      <div
        className={`${
          isApresentacao ? 'text-[64px]' : viewMode === 'iphone' ? 'text-[28px]' : 'text-[32px]'
        } font-medium tracking-[-0.02em] ${textPrimary()}`}
      >
        {value}
      </div>

      {showCompare && (
        <div className={`flex items-center gap-2 ${isApresentacao ? 'text-[22px]' : viewMode === 'iphone' ? 'text-[12px]' : 'text-[12px]'} font-medium`}>
          <span
            className={
              melhorou
                ? 'text-[var(--success)]'
                : piorou
                ? 'text-[var(--danger)]'
                : 'text-[var(--muted-foreground)]'
            }
          >
            {subiu ? '▲' : caiu ? '▼' : '＝'} {Math.abs(diff)}%
            {melhorou ? ' · melhorando' : piorou ? ' · piorando' : ''}
          </span>

          <span className={textSecondary()}>ant. {base}</span>
        </div>
      )}

      <div className="flex items-center gap-2">
  <span
    className={`${
      isApresentacao ? 'text-[28px]' : viewMode === 'iphone' ? 'text-[15px]' : 'text-[14px]'
    } font-medium ${s.textClass}`}
  >
    {formatPercent(percent)}
  </span>

  <span
    className={`${
      isApresentacao ? 'text-[28px]' : viewMode === 'iphone' ? 'text-[15px]' : 'text-[14px]'
    } font-medium ${textSecondary()}`}
  >
    de
  </span>

  <span
    className={`${
      isApresentacao ? 'text-[28px]' : viewMode === 'iphone' ? 'text-[15px]' : 'text-[14px]'
    } font-medium ${textSecondary()}`}
  >
    {target}%
  </span>

  {metaLabel && (
    <span
      className={`${
        isApresentacao ? 'text-[32px]' : viewMode === 'iphone' ? 'text-[13px]' : 'text-[13px]'
      } ${textSecondary()}`}
    >
      {metaLabel}
    </span>
  )}
</div>

      <div
        className={`overflow-hidden rounded-full bg-[var(--progress-bg)] ${
          isApresentacao
  ? 'h-2.5 w-full'
  : viewMode === 'iphone'
  ? 'h-2 w-full'
  : 'h-1.5 w-full'
        }`}
      >
        <div
          className={`h-full rounded-full ${s.barClass}`}
          style={{ width: `${clampPercent(percent)}%` }}
        />
      </div>
    </div>
  )

}

export default function DashboardPage() {
  const { periodo, tipoData, segmento, dataInicio, dataFim, viewMode, comparar, compararInicio, compararFim } = useFilters()
  const modoSlides = useModoSlides()

  const [data, setData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [leadsSelecionados, setLeadsSelecionados] = useState<('A' | 'B' | 'C' | 'D')[]>(['A'])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [now, setNow] = useState<Date>(new Date())

  useSetPageHeader('Visão Geral', <LiveIndicator lastUpdated={lastUpdated} now={now} />)

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(tick)
  }, [])



 useEffect(() => {
  async function loadData(showLoading = false) {
    try {
      if (showLoading) setLoading(true)
      setError(null)

      let url =
        `/api/test?periodo=${periodo}` +
        `&tipo=${tipoData}` +
        `&segmento=${segmento}` +
        `&t=${Date.now()}`

      if (periodo === 'personalizado' && dataInicio && dataFim) {
        url += `&inicio=${dataInicio}&fim=${dataFim}`
      }

      if (comparar && compararInicio && compararFim) {
        url += `&compararInicio=${compararInicio}&compararFim=${compararFim}`
      }

      const token = localStorage.getItem('access_token')

      const res = await fetch(url, {
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const json: DashboardResponse = await res.json()

      if (!json.ok) throw new Error(json.error || 'Erro ao buscar dados')

      setData((prev) => (deepEqual(prev, json) ? prev : json))

      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  loadData(true)

  const interval = setInterval(() => {
    loadData(false)
  }, 60000)

  return () => clearInterval(interval)
}, [periodo, tipoData, segmento, dataInicio, dataFim, comparar, compararInicio, compararFim])

  const marketing = data?.kpis?.marketing
  const comercialConsulta = data?.kpis?.comercialConsulta
  const comercialVendas = data?.kpis?.comercialVendas
  const consolidado = data?.consolidado
  const origens = data?.origens || []
  const primeiraMensagemTotal = data?.primeiraMensagem?.total || 0
  const primeiraMensagemOrigens = data?.primeiraMensagem?.origens || []
  const experienciaCliente = data?.kpis?.experienciaCliente
  const comparativo = data?.comparativo

  // Mês (YYYY-MM) alvo do card de integridade do fechamento — só faz sentido
  // pra um mês fechado inteiro (atual, passado, ou um "personalizado" que
  // bate exatamente com o 1º e o último dia de um mês), não pra semana ou um
  // intervalo personalizado qualquer.
  const mesIntegridadeFechamento = (() => {
    const hoje = new Date()
    if (periodo === 'mes-atual') {
      return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
    }
    if (periodo === 'mes-passado') {
      const passado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
      return `${passado.getFullYear()}-${String(passado.getMonth() + 1).padStart(2, '0')}`
    }
    if (periodo === 'personalizado' && dataInicio && dataFim) {
      const inicio = new Date(`${dataInicio}T00:00:00`)
      const ultimoDiaMes = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0)
      const ehMesInteiro = dataInicio === `${inicio.getFullYear()}-${String(inicio.getMonth() + 1).padStart(2, '0')}-01` && dataFim === `${ultimoDiaMes.getFullYear()}-${String(ultimoDiaMes.getMonth() + 1).padStart(2, '0')}-${String(ultimoDiaMes.getDate()).padStart(2, '0')}`

      if (ehMesInteiro) {
        return `${inicio.getFullYear()}-${String(inicio.getMonth() + 1).padStart(2, '0')}`
      }
    }
    return null
  })()

  // Atendimento por dia + faturamento de consultas + vendas, no mesmo eixo de
  // dias — só faz sentido pra períodos com mais de um dia (semana/mês/personalizado).
  const mostrarDesempenho =
    periodo === 'semana' ||
    periodo === 'mes-atual' ||
    periodo === 'mes-passado' ||
    (periodo === 'personalizado' && !!dataInicio && !!dataFim && dataInicio !== dataFim)

  const diasDesempenho = (data?.evolucaoDiaria || []).map((dia, i) => ({
    data: dia.data,
    label: dia.label,
    atendimentos: data?.painelAtendimento?.atendimentoPorDia?.[i]?.quantidade ?? 0,
    faturamento: data?.painelAtendimento?.evolucaoFaturamento?.[i]?.valor ?? 0,
    vendas: dia.vendasValor || 0,
  }))
  if (loading) {
    return (
      <div className="grid gap-6 @xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`h-[440px] animate-pulse ${cardBg()}`} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-[18px] border border-[color:var(--danger)]/20 bg-[var(--danger)]/10 p-6 text-[var(--danger)]">
        {error}
      </div>
    )
  }

  const metaVendas = consolidado?.metaValorVendas || 0
  const metaTicket = consolidado?.metaTicketMedio || 2800
  const consolidadoVendasOk = (consolidado?.valorVendas || 0) >= metaVendas
  const consolidadoTicketOk = (consolidado?.ticketMedio || 0) >= metaTicket
  const vendasPercent = metaVendas > 0 ? ((consolidado?.valorVendas || 0) / metaVendas) * 100 : 0
  const ticketPercent = metaTicket > 0 ? ((consolidado?.ticketMedio || 0) / metaTicket) * 100 : 0
  const origensTotal = origens.reduce((acc, o) => acc + o.quantidade, 0)
  const leadsPorTipo = {
  A: marketing?.leadA || 0,
  B: marketing?.leadB || 0,
  C: marketing?.leadC || 0,
  D: marketing?.leadD || 0,
}

const quantidadeLeadSelecionado = leadsSelecionados.reduce(
    (total, item) => total + leadsPorTipo[item],
    0
  )

  // Convertido filtrado pelas mesmas tags (A/B/C/D) selecionadas em "Leads
  // aceitos (SAL)" — só conta convertidos que têm a tag selecionada. O
  // "Convertido geral" (sem filtro de tag) usa marketing.convertidos direto.
  const convertidoPorTag = {
    A: marketing?.convertidoLeadA || 0,
    B: marketing?.convertidoLeadB || 0,
    C: marketing?.convertidoLeadC || 0,
    D: marketing?.convertidoLeadD || 0,
  }

  const convertidoFiltrado = leadsSelecionados.reduce(
    (total, item) => total + convertidoPorTag[item],
    0
  )

  const convertidosFiltradoPercent =
  quantidadeLeadSelecionado > 0
    ? (convertidoFiltrado / quantidadeLeadSelecionado) * 100
    : 0


  // Reabord só aparece quando tem valor; sem ele o card fica só com Consulta
  // (o "Total semanal" seria idêntico, então some junto).
  const temReabord =
    (comercialConsulta?.quantidadeReabord || 0) > 0 ||
    (comercialConsulta?.valorTotalReabord || 0) > 0

  const fatosFundo = [
    { label: 'Leads recebidos', valor: String(marketing?.totalEntradas ?? 0) },
    { label: 'Convertidos', valor: String(marketing?.convertidos ?? 0) },
    { label: 'Faturamento', valor: formatMoneyShort(consolidado?.valorVendas ?? 0) },
    { label: 'Vendas', valor: String(consolidado?.qtdVendas ?? 0) },
    { label: 'Ticket médio', valor: formatMoneyShort(consolidado?.ticketMedio ?? 0) },
    { label: 'Parados na 1ª msg', valor: String(primeiraMensagemTotal) },
    { label: 'Origens ativas', valor: String(origens.length) },
    { label: 'Conversão', valor: `${Math.round(marketing?.convertidosPercent ?? 0)}%` },
  ]

  return (
    <div className="relative isolate">
      {/* Fundo vivo, mesma pegada da entrada/login (decorativo). */}
      <AnimatedBackdrop fatos={fatosFundo} />

     <SlideDeck>
     <div className="relative space-y-3">

    <div
  className={`grid gap-3 ${
    modoSlides
  ? 'grid-cols-1'
  : viewMode === 'apresentacao' || viewMode === 'iphone'
  ? 'grid-cols-1'
  : 'grid-cols-1 @md:grid-cols-2 @xl:grid-cols-4'
  }`}
>
          <GroupCard title="Marketing / Topo de Funil" icon={<Funnel size={26} />}>
           <SimpleMetric
  label="Total de leads recebidos"
  value={marketing?.totalEntradas || 0}
  previousValue={comparativo?.marketing?.totalEntradasAnterior}
  showCompare={comparar}
/>
            <GoalMetric
              label="Leads não qualificados"
              value={marketing?.naoQualificados || 0}
              percent={marketing?.naoQualificadosPercent || 0}
              target={10}
              mode="max"
            />
            <div className="space-y-3">
  <h4
    className={`${
      viewMode === 'apresentacao' ? 'text-[28px] font-semibold' : viewMode === 'iphone' ? 'text-[15px] font-semibold' : 'text-[14px] font-medium'
    } leading-tight ${textSecondary()}`}
  >
    Leads aceitos (SAL)
  </h4>

  <div className="grid grid-cols-5 gap-3">
    {(['A', 'B', 'C', 'D'] as const).map((item) => (
      <button
        key={item}
        type="button"
        onClick={() =>
  setLeadsSelecionados((atual) =>
    atual.includes(item)
      ? atual.filter((lead) => lead !== item)
      : [...atual, item]
  )
}
        className={`rounded-lg border py-1.5 font-bold transition-colors duration-200 ${
          leadsSelecionados.includes(item)
            ? 'border-[color:var(--success)] bg-[var(--success)]/10 text-[var(--success)]'
            : 'border-[color:var(--border)] bg-[var(--metric-card)] text-[var(--muted-foreground)] hover:border-[var(--accent)]/40 hover:text-[var(--foreground)]'
        } ${viewMode === 'apresentacao' ? 'text-[28px]' : viewMode === 'iphone' ? 'text-[15px]' : 'text-[14px]'}`}
      >
        {item}
      </button>
    ))}

    <PrimeiraMensagemTile total={primeiraMensagemTotal} origens={primeiraMensagemOrigens} />
  </div>
    <SimpleMetric
   label=""
   value={quantidadeLeadSelecionado}
   previousValue={comparativo?.marketing?.leadsAceitosAnterior}
   showCompare={comparar}
/>

  
</div>
<div className="space-y-2">
  <div
    className={`flex items-center gap-3 ${
      viewMode === 'apresentacao'
        ? 'text-[28px]'
        : viewMode === 'iphone'
          ? 'text-[15px]'
          : 'text-[14px]'
    }`}
  >
    <span className="font-medium text-[var(--success)]">
      {formatPercent(
        marketing?.totalEntradas
          ? (quantidadeLeadSelecionado / marketing.totalEntradas) * 100
          : 0
      )}
    </span>

    <span className={textSecondary()}>
      dos leads recebidos
    </span>
  </div>

  <div
    className={`overflow-hidden rounded-full bg-[var(--progress-bg)] ${
      viewMode === 'apresentacao'
        ? 'h-2.5'
        : viewMode === 'iphone'
          ? 'h-2'
          : 'h-1.5'
    }`}
  >
    <div
      className="h-full rounded-full bg-[var(--success)]"
      style={{
        width: `${
          marketing?.totalEntradas
            ? (quantidadeLeadSelecionado /
                marketing.totalEntradas) *
              100
            : 0
        }%`,
      }}
    />
  </div>
</div>
            <GoalMetric
  label="Convertido"
  value={convertidoFiltrado}
  percent={convertidosFiltradoPercent}
  target={30}
  mode="min"
  empty={quantidadeLeadSelecionado === 0}
/>
            <GoalMetric
  label="Convertido geral"
  value={marketing?.convertidos || 0}
  percent={marketing?.convertidosPercent || 0}
  target={30}
  mode="min"
/>
          </GroupCard>

          <GroupCard title="Comercial I e II" icon={<Stethoscope size={26} />}>
  <div className={temReabord ? 'grid grid-cols-2 gap-4 md:gap-7' : ''}>
    <div className="min-w-0 space-y-2">
      <div className="flex items-center gap-3">
        <span className="h-3 w-3 shrink-0 rounded-full bg-[var(--accent)]" />
        <h4 className={`truncate ${viewMode === 'apresentacao' ? 'text-[26px]' : viewMode === 'iphone' ? 'text-[13px]' : 'text-[14px]'} font-bold uppercase tracking-wide ${textSecondary()}`}>
          Consulta
        </h4>
      </div>
      <SimpleMetric
  label="Quantidade"
  value={comercialConsulta?.quantidadeConsulta || 0}
  previousValue={comparativo?.comercialConsulta?.quantidadeConsultaAnterior}
  showCompare={comparar}
/>

<SimpleMetric
  label="Recebimento"
  value={formatMoney(comercialConsulta?.valorTotalConsulta || 0)}
  previousValue={comparativo?.comercialConsulta?.valorTotalConsultaAnterior}
  showCompare={comparar}
/>

<SimpleMetric
  label="Ticket M."
  value={formatMoney(comercialConsulta?.ticketMedioConsulta || 0)}
  previousValue={comparativo?.comercialConsulta?.ticketMedioConsultaAnterior}
  showCompare={comparar}
  empty={!comercialConsulta?.quantidadeConsulta}
/>

<SimpleMetric
  label="Ritmo"
  value={`${formatMoney(comercialConsulta?.ritmoConsulta || 0)}/dia útil`}
  empty={!comercialConsulta?.quantidadeConsulta}
/>
    </div>

    {temReabord && (
    <div className="min-w-0 space-y-2">
      <div className="flex items-center gap-3">
        <span className="h-3 w-3 shrink-0 rounded-full bg-[var(--accent)]" />
        <h4 className={`truncate ${viewMode === 'apresentacao' ? 'text-[26px]' : viewMode === 'iphone' ? 'text-[13px]' : 'text-[14px]'} font-bold uppercase tracking-wide ${textSecondary()}`}>
          Reabord
        </h4>
      </div>

      <SimpleMetric
  label="Quantidade"
  value={comercialConsulta?.quantidadeReabord || 0}
  previousValue={comparativo?.comercialConsulta?.quantidadeReabordAnterior}
  showCompare={comparar}
/>

<SimpleMetric
  label="Recebimento"
  value={formatMoney(comercialConsulta?.valorTotalReabord || 0)}
  previousValue={comparativo?.comercialConsulta?.valorTotalReabordAnterior}
  showCompare={comparar}
/>

<SimpleMetric
  label="Ticket M."
  value={formatMoney(comercialConsulta?.ticketMedioReabord || 0)}
  previousValue={comparativo?.comercialConsulta?.ticketMedioReabordAnterior}
  showCompare={comparar}
  empty={!comercialConsulta?.quantidadeReabord}
/>
    </div>
    )}
  </div>

  {temReabord && (
  <div className="border-t border-[color:var(--border)] pt-1">
    <div className="mb-1 flex items-center gap-3">
      <span className="h-3 w-3 rounded-full bg-[var(--accent)]" />
      <h4 className={`${viewMode === 'apresentacao' ? 'text-[26px]' : viewMode === 'iphone' ? 'text-[13px]' : 'text-[14px]'} font-bold uppercase tracking-wide ${textSecondary()}`}>
        Total semanal
      </h4>
    </div>

    <div className="space-y-0.5">
      <SimpleMetric
  label="Quantidade"
  value={comercialConsulta?.quantidadeTotal || 0}
  previousValue={comparativo?.comercialConsulta?.quantidadeTotalAnterior}
  showCompare={comparar}
/>

<SimpleMetric
  label="Recebimento"
  value={formatMoney(comercialConsulta?.valorTotal || 0)}
  previousValue={comparativo?.comercialConsulta?.valorTotalAnterior}
  showCompare={comparar}
/>

<SimpleMetric
  label="Ticket M."
  value={formatMoney(comercialConsulta?.ticketMedioTotal || 0)}
  previousValue={comparativo?.comercialConsulta?.ticketMedioTotalAnterior}
  showCompare={comparar}
  empty={!comercialConsulta?.quantidadeTotal}
/>
    </div>
  </div>
  )}
</GroupCard>

          <GroupCard title="Comercial III" icon={<Users size={26} />}>
           <SimpleMetric
  label="Propostas enviadas"
  value={comercialVendas?.propostasEnviadas || 0}
  previousValue={comparativo?.comercialVendas?.propostasEnviadasAnterior}
  showCompare={comparar}
/>

<GoalMetric
  label="Propostas fechadas"
  value={comercialVendas?.propostasFechadas || 0}
  percent={comercialVendas?.propostasFechadasPercent || 0}
  target={comercialVendas?.metaPropostasFechadasPercent || 70}
  mode="min"
  empty={!comercialVendas?.propostasEnviadas}
/>

<SimpleMetric
  label="Valor total de vendas"
  value={formatMoney(comercialVendas?.valorTotalVendas || 0)}
  previousValue={comparativo?.comercialVendas?.valorTotalVendasAnterior}
  showCompare={comparar}
/>

<SimpleMetric
  label="Ticket Médio"
  value={formatMoney(comercialVendas?.ticketMedioVendas || 0)}
  previousValue={comparativo?.comercialVendas?.ticketMedioVendasAnterior}
  showCompare={comparar}
  empty={!comercialVendas?.propostasFechadas}
/>

<SimpleMetric
  label="Ritmo"
  value={`${formatMoney(comercialVendas?.ritmoVendas || 0)}/dia útil`}
  empty={!comercialVendas?.propostasFechadas}
/>

<SimpleMetric
  label="Ciclo de venda"
  value={`${(comercialVendas?.cicloVendaDias || 0).toFixed(1)} dias`}
  empty={!comercialVendas?.propostasFechadas}
/>
          </GroupCard>

         <GroupCard title="Comparecimento" icon={<Star size={26} />}>
  <GoalMetric
    label="No Show"
    value={experienciaCliente?.noShow ?? 0}
    percent={experienciaCliente?.noShowPercent ?? 0}
    target={experienciaCliente?.metaNoShowPercent ?? 10}
    metaLabel={`ideal até ${experienciaCliente?.metaNoShowQuantidade ?? 0}`}
    mode="max"
    previousValue={comparativo?.statusAgenda?.noShowAnterior}
    showCompare={comparar}
  />

  <GoalMetric
    label="Reagendados"
    value={experienciaCliente?.reagendados ?? 0}
    percent={experienciaCliente?.reagendadosPercent ?? 0}
    target={30}
    mode="max"
    previousValue={comparativo?.statusAgenda?.reagendadosAnterior}
    showCompare={comparar}
  />

  <GoalMetric
    label="Cancelados"
    value={experienciaCliente?.cancelados ?? 0}
    percent={experienciaCliente?.canceladosPercent ?? 0}
    target={10}
    mode="max"
    previousValue={comparativo?.statusAgenda?.canceladosAnterior}
    showCompare={comparar}
  />

 <div className="border-t border-[color:var(--border)] pt-2">
    <div className="mb-2 flex items-center gap-3">
  <span className="h-3 w-3 rounded-full bg-[var(--accent)]" />
  <h4
  className={`${
    viewMode === 'apresentacao'
      ? 'text-[26px]'
      : viewMode === 'iphone'
      ? 'text-[13px]'
      : 'text-[14px]'
  } font-bold uppercase tracking-wide ${textSecondary()}`}
>
    Experiência do Cliente
  </h4>
</div>

    <GoalMetric
      label="NPS (Google)"
      value={experienciaCliente?.npsGoogle ?? 0}
      percent={experienciaCliente?.npsGooglePercent ?? 0}
      target={experienciaCliente?.metaNpsGoogle ?? 25}
      mode="min"
    />
  </div>
</GroupCard>
        </div>

        <Slide>
        <section className={`px-4 py-2 ${cardBg()}`}>
          <div className="mb-3 flex items-center gap-3">
  <div
  className={`${
    viewMode === 'apresentacao'
      ? 'h-12 w-12'
      : viewMode === 'iphone'
      ? 'h-8 w-8'
      : 'h-6 w-6'
  } flex shrink-0 items-center justify-center text-[var(--accent)]`}
>
  <ChartNoAxesCombined size={26} />
</div>
  <h3
    className={`${
      viewMode === 'apresentacao'
        ? 'text-[42px]'
        : viewMode === 'iphone'
        ? 'text-[20px]'
        : 'text-[20px]'
    } font-bold tracking-[-0.02em] ${textPrimary()}`}
  >
    Consolidado
  </h3>
</div>

           <div className="grid grid-cols-1 gap-2 @3xl:grid-cols-3">
            <div className={`space-y-1 ${metricCardBg()}`}>
  <SimpleMetric
    label="Quantidade total de vendas"
    value={consolidado?.qtdVendas || 0}
    previousValue={comparativo?.consolidado?.qtdVendasAnterior}
    showCompare={comparar}
  />
</div>

<div className={`space-y-1 ${metricCardBg()}`}>
  <SimpleMetric
    label="Total do valor de venda"
    value={formatMoney(consolidado?.valorVendas || 0)}
    previousValue={comparativo?.consolidado?.valorVendasAnterior}
    showCompare={comparar}
  />

  <div
    className={`flex items-center gap-3 ${
      viewMode === 'apresentacao' ? 'text-[32px]' : viewMode === 'iphone' ? 'text-[15px]' : 'text-[14px]'
    }`}
  >
    <span
      className={
        consolidadoVendasOk
          ? 'font-semibold text-[var(--success)]'
          : 'font-semibold text-[var(--danger)]'
      }
    >
      {formatPercent(vendasPercent)}
    </span>

    <span className={textSecondary()}>
      da meta de {formatMoneyShort(metaVendas)} atingida
    </span>
  </div>

  <div
    className={`overflow-hidden rounded-full bg-[var(--progress-bg)] ${
      viewMode === 'apresentacao'
        ? 'h-2.5'
        : viewMode === 'iphone'
        ? 'h-2'
        : 'h-1.5'
    }`}
  >
    <div
      className={`h-full rounded-full ${
        consolidadoVendasOk
          ? 'bg-[var(--success)]'
          : 'bg-[var(--danger)]'
      }`}
      style={{ width: `${clampPercent(vendasPercent)}%` }}
    />
  </div>
</div>

<div className={`space-y-1 ${metricCardBg()}`}>
  <SimpleMetric
    label="Ticket médio total"
    value={formatMoney(consolidado?.ticketMedio || 0)}
    previousValue={comparativo?.consolidado?.ticketMedioAnterior}
    showCompare={comparar}
    empty={!consolidado?.qtdVendas}
  />

  <div
    className={`flex items-center gap-3 ${
      viewMode === 'apresentacao' ? 'text-[32px]' : viewMode === 'iphone' ? 'text-[15px]' : 'text-[14px]'
    }`}
  >
    <span
      className={
        consolidadoTicketOk
          ? 'font-semibold text-[var(--success)]'
          : 'font-semibold text-[var(--danger)]'
      }
    >
      {consolidadoTicketOk ? 'atingido' : 'abaixo'}
    </span>

    <span className={textSecondary()}>
      mín. {formatMoney(metaTicket)}
    </span>
  </div>

  <div
    className={`overflow-hidden rounded-full bg-[var(--progress-bg)] ${
      viewMode === 'apresentacao'
        ? 'h-2.5'
        : viewMode === 'iphone'
        ? 'h-2'
        : 'h-1.5'
    }`}
  >
    <div
      className={`h-full rounded-full ${
        consolidadoTicketOk
          ? 'bg-[var(--success)]'
          : 'bg-[var(--danger)]'
      }`}
      style={{ width: `${clampPercent(ticketPercent)}%` }}
    />
  </div>
</div>
          </div>

          {periodo === 'mes-atual' && (
            <div className="mt-2 pb-2">
              <PerspectivaMeta
                meta={data?.campanhaMeta?.totalMeta || metaVendas}
                realizado={data?.campanhaMeta?.realizado ?? consolidado?.valorVendas ?? 0}
                ticketMedio={consolidado?.ticketMedio || 0}
              />
            </div>
          )}

          <IntegridadeFechamento mes={mesIntegridadeFechamento} />
        </section>
        </Slide>

        {mostrarDesempenho && (
          <Slide>
            <DesempenhoDiarioCard dias={diasDesempenho} />
          </Slide>
        )}

        <Slide>
        <OrigensPrimeiraMensagemCard
          origens={origens}
          origensTotal={origensTotal}
          primeiraMensagemOrigens={primeiraMensagemOrigens}
          primeiraMensagemTotal={primeiraMensagemTotal}
        />
        </Slide>

      </div>
     </SlideDeck>
    </div>
  )
}