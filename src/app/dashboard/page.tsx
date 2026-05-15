'use client'

import { ReactNode, useEffect, useState } from 'react'
import { ClipboardList, Funnel, Star, Stethoscope, Users } from 'lucide-react'
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
      agendados: number
      agendadosPercent: number
    }
    comercialConsulta: {
      quantidadeConsulta: number
      valorTotalConsulta: number
      ticketMedioConsulta: number
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
}[]
  vendasPorMedico?: {
  nome: string
  valor: number
  produtos: {
    produto: string
    qtd: number
  }[]
}[]
campanhasConsulta?: {
  nome: string
  qtd: number
  valor: number
  percentual: number
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
  return (
    <section className={`rounded-[28px] p-6 ${cardBg()}`}>
      <div className="mb-5 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)]/18 text-[var(--accent)]">
          {icon}
        </div>
        <h3 className={`text-[22px] font-black leading-[1.05] tracking-[-0.04em] ${textPrimary()}`}>
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
  const dot =
    accent === 'blue'
      ? 'bg-sky-400'
      : accent === 'green'
        ? 'bg-emerald-400'
        : 'bg-[var(--accent)]'

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className={`h-3 w-3 rounded-full ${dot}`} />
        <h4 className={`text-[15px] font-semibold ${textPrimary()}`}>{label}</h4>
      </div>
      <div className={`text-4xl font-black tracking-[-0.05em] ${textPrimary()}`}>{value}</div>
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
  const s = getMetricStatus(percent, target, mode)

  return (
    <div className="space-y-2">
      <h4 className={`text-[15px] font-semibold leading-tight ${textPrimary()}`}>{label}</h4>
      <div className={`text-4xl font-black tracking-[-0.05em] ${textPrimary()}`}>{value}</div>
      <div className="flex items-center gap-2 text-sm">
  <span className={`font-semibold ${s.textClass}`}>
    {formatPercent(percent)}
  </span>

  <span className={textSecondary()}>de</span>

  <span className={textSecondary()}>
    {target}%
  </span>

  {metaLabel && (
    <span className="text-xs text-slate-400">
      {metaLabel}
    </span>
  )}
</div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
        <div className={`h-3 rounded-full ${s.barClass}`} style={{ width: `${clampPercent(percent)}%` }} />
      </div>
    </div>
  )
}

function ExperiencePlaceholder({ label }: { label: string }) {
  return (
    <div className="space-y-2">
      <h4 className={`text-[15px] font-semibold ${textPrimary()}`}>{label}</h4>
      <div className={`text-4xl font-black tracking-[-0.05em] ${textPrimary()}`}>—</div>
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
  const { periodo, tipoData, segmento, dataInicio, dataFim } = useFilters()

  const [data, setData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)

        let url = `/api/test?periodo=${periodo}&tipo=${tipoData}&segmento=${segmento}`

        if (periodo === 'personalizado' && dataInicio && dataFim) {
          url += `&inicio=${dataInicio}&fim=${dataFim}`
        }

        const res = await fetch(url, { cache: 'no-store' })
        const json: DashboardResponse = await res.json()

        if (!json.ok) throw new Error(json.error || 'Erro ao buscar dados')
        setData(json)
      } catch (err: any) {
        setError(err.message || 'Erro inesperado')
      } finally {
        setLoading(false)
      }
    }

    loadData()
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
  return (
    <AppShell title="Visão Geral">
      <div className="space-y-8">
        <div className="grid gap-6 xl:grid-cols-4">
          <GroupCard title="Marketing / Topo de Funil" icon={<Funnel size={26} />}>
            <SimpleMetric label="Total de leads recebidos" value={marketing?.totalEntradas || 0} accent="blue" />
            <GoalMetric
              label="Leads não qualificados"
              value={marketing?.naoQualificados || 0}
              percent={marketing?.naoQualificadosPercent || 0}
              target={10}
              mode="max"
            />
            <GoalMetric
              label="Leads aceitos (SAL - lead aceito)"
              value={marketing?.leadsAceitos || 0}
              percent={marketing?.leadsAceitosPercent || 0}
              target={90}
              mode="min"
            />
            <GoalMetric
              label="Lead SQL (Agendado)"
              value={marketing?.agendados || 0}
              percent={marketing?.agendadosPercent || 0}
              target={30}
              mode="min"
            />
          </GroupCard>

          <GroupCard title="Comercial I e II" icon={<Stethoscope size={26} />}>
            <SimpleMetric
              label="Quantidade de consulta"
              value={comercialConsulta?.quantidadeConsulta || 0}
              accent="blue"
            />
            <SimpleMetric
              label="Valor de consulta"
              value={formatMoney(comercialConsulta?.valorTotalConsulta || 0)}
              accent="gold"
            />
            <SimpleMetric
              label="Ticket Médio"
              value={formatMoney(comercialConsulta?.ticketMedioConsulta || 0)}
              accent="green"
            />
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

         <GroupCard title="Experiência do Cliente" icon={<Star size={26} />}>
  <GoalMetric
  label="No Show"
  value={experienciaCliente?.noShow ?? 0}
  percent={experienciaCliente?.noShowPercent ?? 0}
  target={experienciaCliente?.metaNoShowPercent ?? 10}
metaLabel={`ideal até ${experienciaCliente?.metaNoShowQuantidade ?? 0}`}
  mode="max"
/>

  <GoalMetric
  label="NPS (Google)"
  value={experienciaCliente?.npsGoogle ?? 0}
  percent={experienciaCliente?.npsGooglePercent ?? 0}
  target={experienciaCliente?.metaNpsGoogle ?? 0}
  mode="min"
/>

</GroupCard>
        </div>

        <section className={`rounded-[28px] p-6 ${cardBg()}`}>
          <div className="mb-5 flex items-center gap-3">
            <span className="h-8 w-1.5 rounded-full bg-[var(--accent)]" />
            <h3 className={`text-[24px] font-black tracking-[-0.04em] ${textPrimary()}`}>Consolidado</h3>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="space-y-2 rounded-[22px] border border-black/5 bg-white/80 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:border-white/5 dark:!bg-[#163250] dark:shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
              <div className={`text-sm font-semibold ${textPrimary()}`}>Quantidade total de vendas</div>
              <div className={`text-4xl font-black tracking-[-0.04em] ${textPrimary()}`}>
                {consolidado?.qtdVendas || 0}
              </div>
              <div className={`text-sm ${textSecondary()}`}>fechamentos no período</div>
            </div>

            <div className="space-y-2 rounded-[22px] border border-black/5 bg-white/80 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:border-white/5 dark:!bg-[#163250] dark:shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
              <div className={`text-sm font-semibold ${textPrimary()}`}>Total do valor de venda</div>
              <div className={`text-4xl font-black tracking-[-0.04em] ${textPrimary()}`}>
                {formatMoney(consolidado?.valorVendas || 0)}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span
                  className={
                    consolidadoVendasOk
                      ? 'font-semibold text-emerald-500 dark:text-emerald-400'
                      : 'font-semibold text-rose-500 dark:text-rose-400'
                  }
                >
                  {consolidadoVendasOk ? 'atingido' : 'abaixo'}
                </span>
                <span className={textSecondary()}>mín. {formatMoneyShort(metaVendas)}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                <div
                  className={`h-3 rounded-full ${consolidadoVendasOk ? 'bg-emerald-400' : 'bg-rose-400'}`}
                  style={{ width: `${clampPercent(vendasPercent)}%` }}
                />
              </div>
            </div>

            <div className="space-y-2 rounded-[22px] border border-black/5 bg-white/80 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:border-white/5 dark:!bg-[#163250] dark:shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
              <div className={`text-sm font-semibold ${textPrimary()}`}>Ticket médio total</div>
              <div className={`text-4xl font-black tracking-[-0.04em] ${textPrimary()}`}>
                {formatMoney(consolidado?.ticketMedio || 0)}
              </div>
              <div className="flex items-center gap-2 text-sm">
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
              <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                <div
                  className={`h-3 rounded-full ${consolidadoTicketOk ? 'bg-emerald-400' : 'bg-rose-400'}`}
                  style={{ width: `${clampPercent(ticketPercent)}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <FunnelChart
            title="Etapas Funil de Consulta"
            stages={funilConsultaStages}
            baseValue={funil?.entrada || 0}
          />

          <FunnelChart
            title="Etapas Funil de Vendas"
            stages={funilVendasStages}
            baseValue={funilVendas?.total || 0}
          />

          <div className={`rounded-[28px] p-6 ${cardBg()}`}>
            <div className="mb-5 flex items-center gap-3">
              <span className="h-8 w-1.5 rounded-full bg-[var(--accent)]" />
              <h3 className={`text-[24px] font-black tracking-[-0.04em] ${textPrimary()}`}>
                Etapas Funil de Reabord
              </h3>
            </div>

            <div className="space-y-4">
              {funilReabordStages.map((item) => {
                const base = Math.max(funilReabord?.total || 1, 1)
                const width = Math.max(12, (item.value / base) * 100)

                return (
                  <div key={item.label} className="grid grid-cols-[170px_1fr_70px] items-center gap-4">
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

            <div className="mt-6 flex items-center justify-between rounded-2xl p-4 bg-white/80 dark:!bg-[#102742] dark:border dark:border-white/5">
              <div className="text-sm">
                <span className={`font-semibold ${textPrimary()}`}>{funilReabord?.emConversa || 0}</span>
                <span className={`ml-2 ${textSecondary()}`}>Em conversa</span>
              </div>

              <div className="text-sm">
                <span className={`font-semibold ${textPrimary()}`}>{funilReabord?.semConversa || 0}</span>
                <span className={`ml-2 ${textSecondary()}`}>Sem conversa</span>
              </div>
            </div>
          </div>
        </section>

        {evolucaoDiaria.length > 0 && (
          <section className={`rounded-[28px] p-6 ${cardBg()}`}>
            <div className="mb-6 flex items-center gap-3">
              <span className="h-8 w-1.5 rounded-full bg-[var(--accent)]" />
              <h3 className={`text-[24px] font-black tracking-[-0.04em] ${textPrimary()}`}>Evolução Diária</h3>
            </div>

            <div style={{ width: '100%', height: 320, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={evolucaoDiaria} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f8cff" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#4f8cff" stopOpacity={0.02} />
                    </linearGradient>

                    <linearGradient id="gradVendas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0.02} />
                    </linearGradient>

                    <linearGradient id="gradDesqualificados" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />

                  <XAxis
                    dataKey="label"
                    tick={{ fill: 'rgba(148,163,184,0.7)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    yAxisId="left"
                    tick={{ fill: 'rgba(148,163,184,0.7)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />

                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: 'rgba(52,211,153,0.7)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) =>
                      Number(value).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        maximumFractionDigits: 0,
                      })
                    }
                  />

                  <Tooltip content={<ChartTooltip />} />

                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="leads"
                    name="leads"
                    stroke="#4f8cff"
                    strokeWidth={2.5}
                    fill="url(#gradLeads)"
                    dot={false}
                    activeDot={{ r: 5 }}
                  />

                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="vendasValor"
                    name="vendasValor"
                    stroke="#34d399"
                    strokeWidth={2.5}
                    fill="url(#gradVendas)"
                    dot={false}
                    activeDot={{ r: 5 }}
                  />

                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="desqualificados"
                    name="desqualificados"
                    stroke="#ef4444"
                    strokeWidth={3}
                    fill="url(#gradDesqualificados)"
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm">
                <span className="h-3 w-3 rounded-full bg-[#4f8cff]" />
                <span className={textSecondary()}>Entradas</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="h-3 w-3 rounded-full bg-[#34d399]" />
                <span className={textSecondary()}>Vendas Total</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="h-3 w-3 rounded-full bg-[#ef4444]" />
                <span className={textSecondary()}>Desqualificados</span>
              </div>
            </div>
          </section>
        )}

        {origensTop.length > 0 && (
          <section className={`rounded-[28px] p-6 ${cardBg()}`}>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="h-8 w-1.5 rounded-full bg-[var(--accent)]" />
                <h3 className={`text-[24px] font-black tracking-[-0.04em] ${textPrimary()}`}>Origens dos leads</h3>
              </div>
            
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
              <div className="space-y-3">
                {origensTop.map((item, i) => {
                  const maxQtd = origensTop[0]?.quantidade || 1
                  const pct = (item.quantidade / maxQtd) * 100
                  const color = ORIGENS_COLORS[i % ORIGENS_COLORS.length]

                  return (
                    <div key={item.nome}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className={`font-medium ${textPrimary()}`}>{item.nome}</span>
                        <div className="flex items-center gap-3">
                          <span className={`font-bold ${textPrimary()}`}>{item.quantidade}</span>
                          <span className={`min-w-[48px] text-right ${textSecondary()}`}>
                            {formatPercent((item.quantidade / origensTotal) * 100)}
                          </span>
                        </div>
                      </div>

                      <div className="h-8 overflow-hidden rounded-xl bg-slate-200 dark:bg-white/8">
                        <div
                          className="h-8 rounded-xl transition-all duration-500"
                          style={{ width: `${Math.max(pct, 4)}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex flex-col items-center justify-center">
                <div style={{ width: 360, height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={origensTop}
                        dataKey="quantidade"
                        nameKey="nome"
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={115}
                        paddingAngle={2}
                        strokeWidth={0}
                      >
                        {origensTop.map((_, i) => (
                          <Cell key={i} fill={ORIGENS_COLORS[i % ORIGENS_COLORS.length]} />
                        ))}
                      </Pie>
                     <Pie
  data={origensTop}
  dataKey="quantidade"
  nameKey="nome"
  cx="50%"
  cy="50%"
  innerRadius={70}
  outerRadius={115}
  paddingAngle={2}
  strokeWidth={0}
  labelLine
  label={({ cx, cy, midAngle, innerRadius, outerRadius, index }: any) => {
    const RADIAN = Math.PI / 180
    const item = origensTop[index]
    const pequeno = item.quantidade < 10

    const radius = pequeno
      ? outerRadius + 18
      : innerRadius + (outerRadius - innerRadius) * 0.55

    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill={pequeno ? ORIGENS_COLORS[index % ORIGENS_COLORS.length] : 'white'}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: 13, fontWeight: 700 }}
      >
        {item.quantidade}
      </text>
    )
  }}
>
  {origensTop.map((_, i) => (
    <Cell
      key={i}
      fill={ORIGENS_COLORS[i % ORIGENS_COLORS.length]}
    />
  ))}
</Pie>
<text
  x="50%"
  y="48%"
  textAnchor="middle"
  dominantBaseline="middle"
  className="fill-[var(--foreground)] text-3xl font-black"
>
  {origensTotal}
</text>

<text
  x="50%"
  y="58%"
  textAnchor="middle"
  dominantBaseline="middle"
  className="fill-[var(--muted-foreground)] text-sm"
>
  Leads
</text>
                      <Tooltip content={<OrigensTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className={`mt-2 text-center text-sm font-semibold ${textSecondary()}`}>
                  Distribuição por campanha
                </div>
              </div>
            </div>
          </section>
          )}

{campanhaSite && (
  <section className={`rounded-[28px] p-6 ${cardBg()}`}>
    <div className="mb-6 flex items-center justify-between">
      <div>
        <div className="flex items-center gap-3">
  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/20 text-[var(--accent)]">
    <ClipboardList size={20} />
  </div>

  <h3 className={`text-[24px] font-black tracking-[-0.04em] ${textPrimary()}`}>
    Formulário Dr. Rodolpho Reis
  </h3>
</div>
        
      </div>

    </div>

    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <div className="rounded-[22px] p-5 bg-white/80 dark:!bg-[#102742] dark:border dark:border-white/5">
          <div className={`text-sm font-semibold ${textSecondary()}`}>
  Entradas
</div>

<div className={`mt-2 text-5xl font-black tracking-[-0.05em] ${textPrimary()}`}>
  {siteTotal}
</div>

<div className={`mt-1 text-sm ${textSecondary()}`}>
  total de leads da campanha
</div>
        </div>

        {siteStatusData.map((item) => {
  const percentual = siteTotal > 0 ? (item.value / siteTotal) * 100 : 0

  return (
    <div key={item.status}>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className={`font-medium ${textPrimary()}`}>{item.label}</span>

        <div className="flex items-center gap-4">
          <span className={`font-bold ${textPrimary()}`}>{item.value}</span>
          <span className={`min-w-[48px] text-right ${textSecondary()}`}>
            {Math.round(percentual)}%
          </span>
        </div>
      </div>

      <div className="h-8 overflow-hidden rounded-xl bg-slate-200 dark:bg-white/8">
        <div
          className="h-8 rounded-xl"
          style={{
            width: `${Math.max(percentual, 4)}%`,
            backgroundColor: item.color,
          }}
        />
      </div>
    </div>
  )
})}
      </div>

      <div className="flex flex-col items-center justify-center">
        <div className="relative h-[260px] w-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={siteDonutData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                startAngle={90}
                endAngle={-270}
                strokeWidth={0}
              >
                {siteDonutData.map((item, index) => (
  <Cell key={index} fill={item.color} />
))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-5xl font-black tracking-[-0.06em] ${textPrimary()}`}>
              {Math.round(siteAgendadoPercent)}%
            </div>
            <div className={`mt-1 text-lg font-semibold ${textSecondary()}`}>
              Agendado
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-5 text-sm">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-[#FDE047]" />
            <span className={textSecondary()}>Agendado</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-[#3B82F6]" />
            <span className={textSecondary()}>Restante</span>
          </div>
        </div>
      </div>
    </div>
  </section>
)}
      </div>
    </AppShell>
  )
}