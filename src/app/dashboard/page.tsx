'use client'

import { ReactNode, useEffect, useState } from 'react'
import {
  ClipboardList,
  Funnel,
  Star,
  Stethoscope,
  Users,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { AppShell } from '@/components/layout/app-shell'
import { useFilters } from '@/store/use-filters'

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
}
    comercialConsulta: {
  quantidadeConsulta: number
  valorTotalConsulta: number
  ticketMedioConsulta: number

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
      metaPropostasFechadasPercent: number
      metaValorTotalVendas: number
      metaTicketMedio: number
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
  origens?: OrigemItem[]
  consultaPorMedico?: {
  medico: string
  atendimentos: number
  noShow: number
  noShowPercent: number
  quantidadeConsulta: number
  valorConsulta: number
  ticketMedio: number
  proximosAtendimentos: number
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
    barClass: isGood ? 'bg-emerald-400' : 'bg-rose-400',
    textClass: isGood
      ? 'text-emerald-500 dark:text-emerald-400'
      : 'text-rose-500 dark:text-rose-400',
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
  return 'border border-black/5 bg-[var(--card)] shadow-[0_16px_50px_rgba(15,23,42,0.08)] dark:border-white/5 dark:shadow-[0_20px_60px_rgba(0,0,0,0.35)]'
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
  const isMobile = viewMode === 'mobile'

  return (
    <section className={`rounded-[28px] p-6 ${cardBg()}`}>
      <div className="mb-5 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)]/18 text-[var(--accent)]">
          {icon}
        </div>
        <h3
  className={`
    ${isMobile ? 'text-[42px]' : 'text-[24px]'}
    font-black tracking-[-0.05em]
    ${textPrimary()}
  `}
>
  {title}
</h3>
      </div>
      <div className="space-y-7">{children}</div>
    </section>
  )
}

function SimpleMetric({
  label,
  value,
  accent = 'gold',
}: {
  label: string
  value: number | string
  accent?: 'gold' | 'blue' | 'green'
}) {
  const { viewMode } = useFilters()
  const isMobile = viewMode === 'mobile'

  return (
    <div className="space-y-2">
      <h4
        className={`${
          isMobile ? 'text-[26px] font-black' : 'text-[18px] font-semibold'
        } ${textPrimary()}`}
      >
        {label}
      </h4>

      <div
        className={`${
          isMobile ? 'text-[64px]' : 'text-5xl'
        } font-black tracking-[-0.05em] ${textPrimary()}`}
      >
        {value}
      </div>
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
}: {
  label: string
  value: ReactNode
  percent: number
  target: number
  mode: 'max' | 'min'
  metaLabel?: string
}) {
  const { viewMode } = useFilters()
  const s = getMetricStatus(percent, target, mode)

  const isMobile = viewMode === 'mobile'

  return (
    <div className={isMobile ? 'space-y-2' : 'space-y-2'}>
      <h4
        className={`${
          isMobile ? 'text-[28px] font-black' : 'text-[18px] font-semibold'
        } leading-tight ${textPrimary()}`}
      >
        {label}
      </h4>

      <div
        className={`${
          isMobile ? 'text-[64px]' : 'text-5xl'
        } font-black tracking-[-0.05em] ${textPrimary()}`}
      >
        {value}
      </div>

      <div className="flex items-center gap-3">
  <span
    className={`${
      isMobile ? 'text-[28px]' : 'text-lg'
    } font-black ${s.textClass}`}
  >
    {formatPercent(percent)}
  </span>

  <span
    className={`${
      isMobile ? 'text-[28px]' : 'text-lg'
    } font-black ${textSecondary()}`}
  >
    de
  </span>

  <span
    className={`${
      isMobile ? 'text-[28px]' : 'text-lg'
    } font-black ${textSecondary()}`}
  >
    {target}%
  </span>

  {metaLabel && (
    <span
      className={`${
        isMobile ? 'text-[32px]' : 'text-lg'
      } text-slate-400`}
    >
      {metaLabel}
    </span>
  )}
</div>

      <div
        className={`overflow-hidden bg-slate-200 dark:bg-white/10 ${
          isMobile
  ? 'h-8 w-full rounded-xl'
  : 'h-3 w-full rounded-full'
        }`}
      >
        <div
          className={`${isMobile ? 'h-8 rounded-xl' : 'h-3 rounded-full'} ${s.barClass}`}
          style={{ width: `${clampPercent(percent)}%` }}
        />
      </div>
    </div>
  )
}

function ExperiencePlaceholder({ label }: { label: string }) {
  return (
    <div className="space-y-2">
      <h4 className={`text-[18px] font-semibold ${textPrimary()}`}>{label}</h4>
      <div className={`text-5xl font-black tracking-[-0.05em] ${textPrimary()}`}>—</div>
      <p className={`text-sm ${textSecondary()}`}>Em breve com integração Google</p>
      <div className="h-3 rounded-full bg-slate-200 dark:bg-white/10">
        <div className="h-3 w-[32%] rounded-full bg-slate-300 dark:bg-white/15" />
      </div>
    </div>
  )
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  const formatDateWithWeekday = (rawLabel?: string) => {
    if (!rawLabel) return ''

    const [day, month] = rawLabel.split('/')
    const now = new Date()
    const date = new Date(now.getFullYear(), Number(month) - 1, Number(day))

    const weekday = date.toLocaleDateString('pt-BR', {
      weekday: 'long',
    })

    const formattedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1)
    return `${rawLabel} • ${formattedWeekday}`
  }

  const formatName = (key: string) => {
    if (key === 'leads') return 'Entradas'
    if (key === 'vendasValor') return 'Vendas Total'
    if (key === 'desqualificados') return 'Desqualificados'
    return key
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#0a1e3d] px-4 py-3 text-sm shadow-xl">
      <div className="mb-1 font-semibold text-white/70">
        {formatDateWithWeekday(label)}
      </div>

      {payload.map((item: any, index: number) => (
        <div key={index} className="flex justify-between gap-4 text-white text-sm">
          <span>{formatName(item.dataKey)}</span>
          <span>
            {item.dataKey === 'vendasValor'
              ? Number(item.value || 0).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  maximumFractionDigits: 0,
                })
              : Number(item.value || 0).toLocaleString('pt-BR')}
          </span>
        </div>
      ))}
    </div>
  )
}

function OrigensTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null

  const item = payload[0]

  return (
    <div className="rounded-xl border border-white/10 bg-[#0a1e3d] px-4 py-3 text-sm shadow-xl">
      <div className="mb-1 font-semibold text-white/90">{item.payload.nome}</div>
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.fill }} />
        <span className="text-white/60">Leads:</span>
        <span className="font-bold text-white">{item.value}</span>
      </div>
    </div>
  )
}

const ORIGENS_COLORS = [
  '#4f8cff',
  '#34d399',
  '#f59e0b',
  '#f87171',
  '#a78bfa',
  '#fb923c',
  '#38bdf8',
  '#e879f9',
  '#84cc16',
  '#14b8a6',
  '#f472b6',
  '#6366f1',
]

function FunnelChart({
  title,
  stages,
  baseValue,
}: {
  title: string
  stages: { label: string; value: number; color: string }[]
  baseValue: number
}) {
  const base = Math.max(baseValue, 1)

  return (
    <div className={`rounded-[28px] p-6 ${cardBg()}`}>
      <div className="mb-5 flex items-center gap-3">
        <span className="h-8 w-1.5 rounded-full bg-[var(--accent)]" />
        <h3 className={`text-[24px] font-black tracking-[-0.04em] ${textPrimary()}`}>{title}</h3>
      </div>

      <div className="space-y-4">
        {stages.map((item) => {
          const width = Math.max(12, (item.value / base) * 100)

          return (
            <div key={item.label} className="grid grid-cols-[160px_1fr_80px] items-center gap-4">
              <div className={`text-sm font-medium ${textSecondary()}`}>{item.label}</div>
              <div className="h-14 rounded-2xl bg-slate-200 dark:bg-white/8">
                <div
                  className="flex h-14 items-center rounded-2xl px-5 text-lg font-bold text-white"
                  style={{ width: `${width}%`, backgroundColor: item.color }}
                >
                  {item.value}
                </div>
              </div>
              <div className={`text-right text-sm ${textSecondary()}`}>
                {formatPercent((item.value / base) * 100)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { periodo, tipoData, segmento, dataInicio, dataFim, viewMode } = useFilters()

  const [data, setData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [leadsSelecionados, setLeadsSelecionados] = useState<('A' | 'B' | 'C' | 'D')[]>(['A'])



  useEffect(() => {
  async function loadData(showLoading = false) {
    try {
      if (showLoading) setLoading(true)
      setError(null)

      let url = `/api/test?periodo=${periodo}&tipo=${tipoData}&segmento=${segmento}&t=${Date.now()}`

      if (periodo === 'personalizado' && dataInicio && dataFim) {
        url += `&inicio=${dataInicio}&fim=${dataFim}`
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

      setData((prev) => {
        const anterior = JSON.stringify(prev)
        const novo = JSON.stringify(json)

        if (anterior === novo) {
          return prev
        }

        return json
      })
    } catch (err: any) {
      setError(err.message || 'Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  loadData(true)

  const interval = setInterval(() => {
    loadData(false)
  }, 10000)

  return () => clearInterval(interval)
}, [periodo, tipoData, segmento, dataInicio, dataFim])

  const marketing = data?.kpis?.marketing
  const comercialConsulta = data?.kpis?.comercialConsulta
  const comercialVendas = data?.kpis?.comercialVendas
  const consolidado = data?.consolidado
  const funil = data?.funil
  const funilVendas = data?.funilVendas
  const funilReabord = data?.funilReabord
  const evolucaoDiaria = data?.evolucaoDiaria || []
  const origens = data?.origens || []
  const campanhaSite = data?.campanhaSiteRodolpho
  const experienciaCliente = (data as any)?.kpis?.experienciaCliente

  if (loading) {
    return (
      <AppShell title="Visão Geral">
        <div className="grid gap-6 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`h-[440px] animate-pulse rounded-[28px] ${cardBg()}`} />
          ))}
        </div>
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell title="Visão Geral">
        <div className="rounded-[28px] border border-red-500/20 bg-red-500/10 p-6 text-red-300">
          {error}
        </div>
      </AppShell>
    )
  }

  const metaVendas = consolidado?.metaValorVendas || 0
  const metaTicket = consolidado?.metaTicketMedio || 2800
  const consolidadoVendasOk = (consolidado?.valorVendas || 0) >= metaVendas
  const consolidadoTicketOk = (consolidado?.ticketMedio || 0) >= metaTicket
  const vendasPercent = metaVendas > 0 ? ((consolidado?.valorVendas || 0) / metaVendas) * 100 : 0
  const ticketPercent = metaTicket > 0 ? ((consolidado?.ticketMedio || 0) / metaTicket) * 100 : 0

  const funilConsultaStages = [
    { label: 'Entrada', value: funil?.entrada || 0, color: '#94A3B8' },
    { label: 'Primeiro Contato', value: funil?.primeiroContato || 0, color: '#3B82F6' },
    { label: 'Formulário', value: funil?.formulario || 0, color: '#F87171' },
    { label: 'Follow-up', value: funil?.followUp || 0, color: '#FACC15' },
    { label: 'Não Qualificado', value: funil?.naoQualificado || 0, color: '#EF4444' },
    { label: 'Qualificado', value: funil?.qualificado || 0, color: '#34D399' },
    { label: 'Agendado', value: funil?.agendado || 0, color: '#FDE047' },
    { label: 'Ganhou', value: funil?.ganhou || 0, color: '#84CC16' },
    { label: 'Perdeu', value: funil?.perdeu || 0, color: '#6B7280' },
  ]

  const funilVendasStages = [
    { label: 'Criados', value: funilVendas?.total || 0, color: '#94A3B8' },
    { label: 'Orçamento Entregue', value: funilVendas?.orcamentoEntregue || 0, color: '#3B82F6' },
    { label: 'Solicitação de Cirurgia', value: funilVendas?.solicitacaoCirurgia || 0, color: '#FACC15' },
    { label: 'Marcado', value: funilVendas?.marcado || 0, color: '#F59E0B' },
    { label: 'Venda Ganha', value: funilVendas?.vendaGanha || 0, color: '#84CC16' },
    { label: 'Venda Perdida', value: funilVendas?.vendaPerdida || 0, color: '#6B7280' },
  ]

  const funilReabordStages = [
    { label: 'Contato', value: funilReabord?.contato || 0, color: '#C084FC' },
    { label: 'Oferta', value: funilReabord?.oferta || 0, color: '#F87171' },
    { label: 'Agendado', value: funilReabord?.agendado || 0, color: '#FBBF24' },
    { label: 'Fechado (Ganho)', value: funilReabord?.fechadoGanho || 0, color: '#A3E635' },
    { label: 'Fechado (Perdido)', value: funilReabord?.fechadoPerdido || 0, color: '#D1D5DB' },
  ]

  const origensTop = origens.slice(0, 10)
  const origensTotal = origens.reduce((acc, o) => acc + o.quantidade, 0)


const siteStatusColors: Record<string, string> = {
  '1º CONTATO': '#3B82F6',
  'FORMULÁRIO [CAMPANHA]': '#F87171',
  'FOLLOW-UP [S/ RESPOSTA]': '#FACC15',
  'PERDEU [NÃO QUALIFICADO]': '#EF4444',
  'LEAD QUALIFICADO [SAL]': '#34D399',
  AGENDADO: '#FDE047',
  GANHOU: '#84CC16',
  PERDEU: '#6B7280',
}

const siteStatusLabels: Record<string, string> = {
  '1º CONTATO': 'Primeiro Contato',
  'FORMULÁRIO [CAMPANHA]': 'Formulário',
  'FOLLOW-UP [S/ RESPOSTA]': 'Follow-up',
  'PERDEU [NÃO QUALIFICADO]': 'Não Qualificado',
  'LEAD QUALIFICADO [SAL]': 'Qualificado',
  AGENDADO: 'Agendado',
  GANHOU: 'Ganhou',
  PERDEU: 'Perdeu',
}

const siteTotal = campanhaSite?.total || 0
const siteAgendados = campanhaSite?.porStatus?.['AGENDADO'] || 0

const siteAgendadoPercent =
  siteTotal > 0 ? (siteAgendados / siteTotal) * 100 : 0

const siteStatusData = Object.entries(campanhaSite?.porStatus || {})
  .map(([status, qtd]) => ({
    status,
    label: siteStatusLabels[status] || status,
    value: Number(qtd),
    color: siteStatusColors[status] || '#94A3B8',
  }))
  .filter((item) => item.value > 0)

const siteDonutData = siteStatusData.map((item) => ({
  name: item.label,
  value: item.value,
  color: item.color,
}))
const campanhasConsulta = data?.campanhasConsulta || []
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

  const convertidosFiltradoPercent =
  quantidadeLeadSelecionado > 0
    ? (Number(marketing?.convertidos || 0) / quantidadeLeadSelecionado) * 100
    : 0


  return (
    <AppShell title="Visão Geral">
      <div className="space-y-8">
       
    <div
  className={`grid gap-6 ${
    viewMode === 'mobile'
  ? 'grid-cols-1 w-full'
  : 'xl:grid-cols-4'
  }`}
>
          <GroupCard title="Marketing / Topo de Funil" icon={<Funnel size={26} />}>
            <SimpleMetric label="Total de leads recebidos" value={marketing?.totalEntradas || 0} accent="blue" />
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
      viewMode === 'mobile' ? 'text-[28px] font-black' : 'text-[18px] font-semibold'
    } leading-tight ${textPrimary()}`}
  >
    Leads aceitos (SAL - lead aceito)
  </h4>

  <div className="grid grid-cols-4 gap-3">
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
        className={`rounded-xl border py-2 font-black transition ${
          leadsSelecionados.includes(item)
            ? 'border-emerald-400 bg-emerald-50 text-emerald-500'
            : 'border-slate-200 bg-white text-slate-600'
        } ${viewMode === 'mobile' ? 'text-[28px]' : 'text-lg'}`}
      >
        {item}
      </button>
    ))}
  </div>

  <div
    className={`${
      viewMode === 'mobile' ? 'text-[64px]' : 'text-5xl'
    } font-black tracking-[-0.05em] ${textPrimary()}`}
  >
    {quantidadeLeadSelecionado}
  </div>

  
</div>
<div className="space-y-2">
  <div
    className={`flex items-center gap-3 ${
      viewMode === 'mobile'
        ? 'text-[28px]'
        : 'text-base'
    }`}
  >
    <span className="font-black text-emerald-500">
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
    className={`overflow-hidden bg-slate-200 dark:bg-white/10 ${
      viewMode === 'mobile'
        ? 'h-8 rounded-xl'
        : 'h-3 rounded-full'
    }`}
  >
    <div
      className={`bg-emerald-400 ${
        viewMode === 'mobile'
          ? 'h-8 rounded-xl'
          : 'h-3 rounded-full'
      }`}
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
  value={marketing?.convertidos || 0}
  percent={convertidosFiltradoPercent}
  target={30}
  mode="min"
/>
          </GroupCard>

          <GroupCard title="Comercial I e II" icon={<Stethoscope size={26} />}>
  <div className="space-y-4">
    <div className="flex items-center gap-3">
  <span className="h-3 w-3 rounded-full bg-[var(--accent)]" />
  <h4
  className={`${
    viewMode === 'mobile'
      ? 'text-[26px]'
      : 'text-lg'
  } font-black uppercase tracking-wide ${textSecondary()}`}
>
    Consulta
  </h4>
</div>

    <SimpleMetric label="Quantidade" value={comercialConsulta?.quantidadeConsulta || 0} accent="blue" />
    <SimpleMetric label="Faturamento" value={formatMoney(comercialConsulta?.valorTotalConsulta || 0)} accent="gold" />
    <SimpleMetric label="Ticket Médio" value={formatMoney(comercialConsulta?.ticketMedioConsulta || 0)} accent="green" />
  </div>

  <div className="space-y-4 border-t border-black/10 pt-5 dark:border-white/10">
    <div className="flex items-center gap-3">
  <span className="h-3 w-3 rounded-full bg-[var(--accent)]" />
  <h4
  className={`${
    viewMode === 'mobile'
      ? 'text-[26px]'
      : 'text-lg'
  } font-black uppercase tracking-wide ${textSecondary()}`}
>
    Reabordagem
  </h4>
</div>

    <SimpleMetric label="Quantidade" value={comercialConsulta?.quantidadeReabord || 0} accent="blue" />
    <SimpleMetric label="Faturamento" value={formatMoney(comercialConsulta?.valorTotalReabord || 0)} accent="gold" />
    <SimpleMetric label="Ticket Médio" value={formatMoney(comercialConsulta?.ticketMedioReabord || 0)} accent="green" />
  </div>

  <div className="space-y-4 border-t border-black/10 pt-5 dark:border-white/10">
    <div className="flex items-center gap-3">
  <span className="h-3 w-3 rounded-full bg-[var(--accent)]" />
  <h4
  className={`${
    viewMode === 'mobile'
      ? 'text-[26px]'
      : 'text-lg'
  } font-black uppercase tracking-wide ${textSecondary()}`}
>
    Total semanal
  </h4>
</div>

    <SimpleMetric label="Quantidade total" value={comercialConsulta?.quantidadeTotal || 0} accent="blue" />
    <SimpleMetric label="Faturamento total" value={formatMoney(comercialConsulta?.valorTotal || 0)} accent="gold" />
    <SimpleMetric label="Ticket médio total" value={formatMoney(comercialConsulta?.ticketMedioTotal || 0)} accent="green" />
  </div>
</GroupCard>

          <GroupCard title="Comercial III" icon={<Users size={26} />}>
            <SimpleMetric
              label="Propostas enviadas"
              value={comercialVendas?.propostasEnviadas || 0}
              accent="blue"
            />
            <GoalMetric
              label="Propostas fechadas"
              value={comercialVendas?.propostasFechadas || 0}
              percent={comercialVendas?.propostasFechadasPercent || 0}
              target={comercialVendas?.metaPropostasFechadasPercent || 70}
              mode="min"
            />
            <SimpleMetric
              label="Valor total de vendas"
              value={formatMoney(comercialVendas?.valorTotalVendas || 0)}
              accent="gold"
            />
            <SimpleMetric
              label="Ticket Médio"
              value={formatMoney(comercialVendas?.ticketMedioVendas || 0)}
              accent="green"
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
  />

  <GoalMetric
    label="Reagendados"
    value={experienciaCliente?.reagendados ?? 0}
    percent={experienciaCliente?.reagendadosPercent ?? 0}
    target={30}
    mode="max"
  />

  <GoalMetric
    label="Cancelados"
    value={experienciaCliente?.cancelados ?? 0}
    percent={experienciaCliente?.canceladosPercent ?? 0}
    target={10}
    mode="max"
  />

  <div className="border-t border-black/10 pt-5 dark:border-white/10">
    <div className="mb-4 flex items-center gap-3">
  <span className="h-3 w-3 rounded-full bg-[var(--accent)]" />
  <h4
  className={`${
    viewMode === 'mobile'
      ? 'text-[26px]'
      : 'text-lg'
  } font-black uppercase tracking-wide ${textSecondary()}`}
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

        <section className={`rounded-[28px] p-6 ${cardBg()}`}>
          <div className="mb-5 flex items-center gap-3">
            <span className="h-8 w-1.5 rounded-full bg-[var(--accent)]" />
            <h3
  className={`${
    viewMode === 'mobile' ? 'text-[42px]' : 'text-[24px]'
  } font-black tracking-[-0.05em] ${textPrimary()}`}
>
  Consolidado
</h3>
          </div>

           <div
  className={`grid gap-4 ${
    viewMode === 'mobile'
      ? 'grid-cols-1'
      : 'xl:grid-cols-3'
  }`}
>
            <div className="space-y-2 rounded-[22px] border border-black/5 bg-white/80 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:border-white/5 dark:!bg-[#163250] dark:shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
              <div className={`${
  viewMode === 'mobile' ? 'text-[28px] font-black' : 'text-lg font-semibold'
} ${textPrimary()}`}>Quantidade total de vendas</div>
              <div className={`${
  viewMode === 'mobile' ? 'text-[64px]' : 'text-5xl'
} font-black tracking-[-0.04em] ${textPrimary()}`}>
                {consolidado?.qtdVendas || 0}
              </div>

            </div>

            <div className="space-y-2 rounded-[22px] border border-black/5 bg-white/80 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:border-white/5 dark:!bg-[#163250] dark:shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
              <div className={`${
  viewMode === 'mobile' ? 'text-[28px] font-black' : 'text-lg font-semibold'
} ${textPrimary()}`}>Total do valor de venda</div>
              <div className={`${
  viewMode === 'mobile' ? 'text-[64px]' : 'text-5xl'
} font-black tracking-[-0.04em] ${textPrimary()}`}>
                {formatMoney(consolidado?.valorVendas || 0)}
              </div>
     <div
  className={`flex items-center gap-3 ${
    viewMode === 'mobile' ? 'text-[32px]' : 'text-base'
  }`}
>
  <span
    className={
      consolidadoVendasOk
        ? 'font-semibold text-emerald-500 dark:text-emerald-400'
        : 'font-semibold text-rose-500 dark:text-rose-400'
    }
  >
    {formatPercent(vendasPercent)}
  </span>

  <span className={textSecondary()}>
    da meta de {formatMoneyShort(metaVendas)} atingida
  </span>
</div>
              <div
  className={`overflow-hidden bg-slate-200 dark:bg-white/10 ${
    viewMode === 'mobile' ? 'h-8 rounded-xl' : 'h-3 rounded-full'
  }`}
>
                <div
                  className={`${
  viewMode === 'mobile' ? 'h-8 rounded-xl' : 'h-3 rounded-full'
} ${consolidadoVendasOk ? 'bg-emerald-400' : 'bg-rose-400'}`}
                  style={{ width: `${clampPercent(vendasPercent)}%` }}
                />
              </div>
            </div>

            <div className="space-y-2 rounded-[22px] border border-black/5 bg-white/80 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:border-white/5 dark:!bg-[#163250] dark:shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
             <div className={`${
  viewMode === 'mobile' ? 'text-[28px] font-black' : 'text-lg font-semibold'
} ${textPrimary()}`}>
  Ticket médio total
</div>
              <div  className={`${
  viewMode === 'mobile' ? 'text-[64px]' : 'text-5xl'
} font-black tracking-[-0.04em] ${textPrimary()}`}>
                {formatMoney(consolidado?.ticketMedio || 0)}
              </div>
              <div
  className={`flex items-center gap-3 ${
    viewMode === 'mobile' ? 'text-[32px]' : 'text-lg'
  }`}
>
                <span
                  className={
                    consolidadoTicketOk
                      ? 'font-semibold text-emerald-500 dark:text-emerald-400'
                      : 'font-semibold text-rose-500 dark:text-rose-400'
                  }
                >
                  {consolidadoTicketOk ? 'atingido' : 'abaixo'}
                </span>
                <span className={textSecondary()}>mín. {formatMoney(metaTicket)}</span>
              </div>
              <div
  className={`overflow-hidden bg-slate-200 dark:bg-white/10 ${
    viewMode === 'mobile' ? 'h-8 rounded-xl' : 'h-3 rounded-full'
  }`}
>
                <div
                  className={`${
  viewMode === 'mobile' ? 'h-8 rounded-xl' : 'h-3 rounded-full'
} ${consolidadoTicketOk ? 'bg-emerald-400' : 'bg-rose-400'}`}
                  style={{ width: `${clampPercent(ticketPercent)}%` }}
                />
              </div>
            </div>
          </div>
        </section>


        {origensTop.length > 0 && (
          <section className={`rounded-[28px] p-6 ${cardBg()}`}>
            <div className="mb-8 flex items-center justify-between">
  <div>
    <div className="flex items-center gap-4">
      <span className="h-12 w-[8px] rounded-full bg-[#D7B46A]" />

      <div>
        <h3
  className={`${
    viewMode === 'mobile'
      ? 'text-[42px]'
      : 'text-[24px]'
  } font-black tracking-[-0.05em] ${textPrimary()}`}
>
          Origens dos leads
        </h3>

      
      </div>
    </div>
  </div>

  <div className="text-right">
    <p className={`text-[20px] font-bold ${textSecondary()}`}>
      Total de leads
    </p>

    <p
  className={`${
    viewMode === 'mobile'
      ? 'text-[64px]'
      : 'text-5xl'
  } font-black leading-none ${textPrimary()}`}
>
  {origensTotal}
</p>
  </div>
</div>

            <div className="space-y-5">
              <div className="space-y-3">
                {origensTop.map((item, i) => {
                  const maxQtd = origensTop[0]?.quantidade || 1
                  const pct = (item.quantidade / origensTotal) * 100
                  const color = ORIGENS_COLORS[i % ORIGENS_COLORS.length]

                  return (
                    <div key={item.nome}>
                     <div className="mb-3 flex items-start justify-between gap-8">
  <div className="flex-1">
    <span
      className={`${
        viewMode === 'mobile' ? 'text-[26px]' : 'text-[18px]'
      } font-black ${textPrimary()}`}
    >
      {item.nome}
    </span>

    <div className="mt-3 relative">
  <div
    className={`overflow-hidden bg-slate-200 dark:bg-white/8 ${
      viewMode === 'mobile'
        ? 'h-8 rounded-xl'
        : 'h-6 rounded-xl'
    }`}
  >
    <div
      className={`transition-all duration-500 ${
        viewMode === 'mobile'
          ? 'h-8 rounded-xl'
          : 'h-6 rounded-xl'
      }`}
      style={{
        width: `${Math.max(pct, 4)}%`,
        backgroundColor: color,
      }}
    />
  </div>

  <span
  className={`absolute top-1/2 -translate-y-1/2 font-black text-white ${
    viewMode === 'mobile'
      ? 'text-[24px]'
      : 'text-[16px]'
  }`}
  style={{
    left: `calc(${Math.max(pct, 4)}% - 28px)`,
  }}
>
  {formatPercent(pct)}
</span>
</div>
  </div>

  <span
    className={`${
      viewMode === 'mobile' ? 'text-[48px]' : 'text-4xl'
    } min-w-[90px] text-right font-black leading-none ${textPrimary()}`}
  >
    {item.quantidade}
  </span>
</div>
                    </div>
                  )
                })}
              </div>

        
            </div>
          </section>
          )}


      </div>
    </AppShell>
  )
}