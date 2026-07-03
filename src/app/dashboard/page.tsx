'use client'

import { ReactNode, useEffect, useState } from 'react'
import {
  Funnel,
  Star,
  Stethoscope,
  Users,
  ChartNoAxesCombined,
  UserRound,
} from 'lucide-react'
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
      cicloVendaDias: number
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

  comparativo?: any

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
  return 'border border-black/5 bg-[var(--card)] shadow-[0_16px_50px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-[2px] hover:border-[var(--accent)]/25 hover:shadow-[0_20px_60px_rgba(217,182,107,0.12)] dark:border-white/5 dark:shadow-[0_20px_60px_rgba(0,0,0,0.35)]'
}

function metricCardBg() {
  return `
    rounded-[22px]
    border
    border-black/5
    bg-[var(--metric-card)]
    px-4 py-2
    shadow-[0_10px_30px_rgba(15,23,42,0.08)]
    transition-all
    duration-300
    hover:border-[var(--accent)]/20
    dark:border-white/5
    dark:shadow-[0_10px_30px_rgba(0,0,0,0.30)]
  `
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
    <div className={`flex items-center gap-2 text-[12px] font-semibold ${textSecondary()}`}>
      <span
        className={`inline-flex h-2 w-2 rounded-full ${
          stale ? 'bg-amber-400' : 'bg-emerald-400'
        }`}
      />
      <span>{label}</span>
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
  const isMobile = viewMode === 'mobile'

  return (
    <section className={`relative z-0 hover:z-20 rounded-[24px] ${isMobile ? 'p-6' : 'px-4 py-2'} ${cardBg()}`}>
      <div className={`${isMobile ? 'mb-5' : 'mb-2'} flex items-center gap-3`}>
  <div className={`flex items-center justify-center rounded-2xl bg-[var(--accent)]/12 text-[var(--accent)] ${isMobile ? 'h-14 w-14' : 'h-9 w-9'}`}>
    {icon}
  </div>

  <h3
    className={`
      ${isMobile ? 'text-[42px]' : 'text-[18px]'}
      font-black tracking-[-0.05em]
      ${textPrimary()}
    `}
  >
    {title}
  </h3>
      </div>
      <div className={isMobile ? 'space-y-7' : 'space-y-1'}>{children}</div>
    </section>
  )
}

function SimpleMetric({
  label,
  value,
  previousValue,
  showCompare = false,
  empty = false,
  children,
}: {
  label: string
  value: number | string
  previousValue?: number
  showCompare?: boolean
  empty?: boolean
  children?: React.ReactNode
}) {
  const { viewMode } = useFilters()
  const isMobile = viewMode === 'mobile'
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
      <div className="space-y-1">
        <h4
          className={`${
            isMobile ? 'text-[26px] font-black' : 'text-[14px] font-semibold'
          } ${textPrimary()}`}
        >
          {label}
        </h4>

        <div
          className={`${
            isMobile ? 'text-[64px]' : 'text-[32px]'
          } font-black tracking-[-0.04em] leading-none text-[var(--muted-foreground)]/40`}
        >
          —
        </div>

        <p className={`${isMobile ? 'text-[22px]' : 'text-[11px]'} font-semibold ${textSecondary()}`}>
          Sem dados no período
        </p>
      </div>
    )
  }

  return (
    <div className="relative space-y-1">
      <h4
        className={`${
          isMobile ? 'text-[26px] font-black' : 'text-[14px] font-semibold'
        } ${textPrimary()}`}
      >
        {label}
      </h4>

      <div className="relative inline-block group">
  <div
    className={`${
      isMobile ? 'text-[64px]' : 'text-[32px]'
    } font-black tracking-[-0.04em] leading-none cursor-pointer ${textPrimary()}`}
  >
    {value}
  </div>

  {children}
</div>

      {showCompare && (
  <div className={`flex items-center gap-2 ${isMobile ? 'text-[24px]' : 'text-[12px]'}`}>
    <span className={`font-black ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
      {isUp ? '▲' : '▼'} {formatPercent(Math.abs(diff))}
    </span>

    <span className="font-semibold text-slate-400">
      ant. {typeof value === 'string' && value.includes('R$') ? formatMoney(previousValue || 0) : previousValue || 0}
    </span>
  </div>
)}
 {children}
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
}: {
  label: string
  value: ReactNode
  percent: number
  target: number
  mode: 'max' | 'min'
  metaLabel?: string
  empty?: boolean
}) {
  const { viewMode } = useFilters()
  const s = getMetricStatus(percent, target, mode)

  const isMobile = viewMode === 'mobile'

  if (empty) {
    return (
      <div className={isMobile ? 'space-y-2' : 'space-y-1'}>
        <h4
          className={`${
            isMobile ? 'text-[28px] font-black' : 'text-[14px] font-semibold'
          } leading-tight ${textPrimary()}`}
        >
          {label}
        </h4>

        <div
          className={`${
            isMobile ? 'text-[64px]' : 'text-[32px]'
          } font-black tracking-[-0.05em] text-[var(--muted-foreground)]/40`}
        >
          —
        </div>

        <p className={`${isMobile ? 'text-[22px]' : 'text-[11px]'} font-semibold ${textSecondary()}`}>
          Sem dados no período
        </p>
      </div>
    )
  }

  return (
    <div className={isMobile ? 'space-y-2' : 'space-y-1'}>
      <h4
        className={`${
         isMobile ? 'text-[28px] font-black' : 'text-[14px] font-semibold'
        } leading-tight ${textPrimary()}`}
      >
        {label}
      </h4>

      <div
        className={`${
          isMobile ? 'text-[64px]' : 'text-[32px]'
        } font-black tracking-[-0.05em] ${textPrimary()}`}
      >
        {value}
      </div>

      <div className="flex items-center gap-2">
  <span
    className={`${
      isMobile ? 'text-[28px]' : 'text-[14px]'
    } font-black ${s.textClass}`}
  >
    {formatPercent(percent)}
  </span>

  <span
    className={`${
      isMobile ? 'text-[28px]' : 'text-[14px]'
    } font-black ${textSecondary()}`}
  >
    de
  </span>

  <span
    className={`${
      isMobile ? 'text-[28px]' : 'text-[14px]'
    } font-black ${textSecondary()}`}
  >
    {target}%
  </span>

  {metaLabel && (
    <span
      className={`${
        isMobile ? 'text-[32px]' : 'text-[13px]'
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
  : 'h-2 w-full rounded-full'
        }`}
      >
        <div
          className={`${isMobile ? 'h-8 rounded-xl' : 'h-2 rounded-full'} ${s.barClass}`}
          style={{ width: `${clampPercent(percent)}%` }}
        />
      </div>
    </div>
  )

}

function getAvatarMedico(nome: string) {
  const n = nome.toUpperCase()

  if (n.includes('RODOLPHO')) return '/medicos/rodolpho.png'
  if (n.includes('BRENO')) return '/medicos/breno.png'
  if (n.includes('CLAUDIA')) return '/medicos/claudia.png'
  if (n.includes('JESSICA')) return '/medicos/jessica.png'

  return null
}

function MedicoSnapshotCard({
  nome,
  atendimentos,
  ticketConsulta,
  valorVendas,
  percentualMeta,
}: {
  nome: string
  atendimentos?: number
  ticketConsulta?: number
  valorVendas?: number
  percentualMeta?: number
}) {
  const { viewMode } = useFilters()
  const isMobile = viewMode === 'mobile'
  const avatar = getAvatarMedico(nome)
  const metaOk = (percentualMeta || 0) >= 100

  return (
    <div className={`flex items-center gap-4 ${isMobile ? 'p-6' : 'p-3'} ${metricCardBg()}`}>
      <div className={`shrink-0 overflow-hidden rounded-full bg-[var(--accent)]/15 ${isMobile ? 'h-20 w-20' : 'h-12 w-12'}`}>
        {avatar ? (
          <img src={avatar} alt={nome} className="h-full w-full object-cover" />
        ) : (
          <div className={`flex h-full w-full items-center justify-center font-black text-[var(--accent)] ${isMobile ? 'text-[28px]' : 'text-[16px]'}`}>
            {nome.charAt(0)}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className={`truncate font-black ${textPrimary()} ${isMobile ? 'text-[24px]' : 'text-[14px]'}`}>
          {nome}
        </p>

        <div className={`mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 ${textSecondary()} ${isMobile ? 'text-[18px]' : 'text-[12px]'} font-semibold`}>
          <span>{atendimentos ?? 0} atend.</span>
          <span>{formatMoney(ticketConsulta || 0)} ticket</span>
          {valorVendas !== undefined && (
            <span
              className={
                metaOk
                  ? 'font-bold text-emerald-500 dark:text-emerald-400'
                  : 'font-bold text-rose-500 dark:text-rose-400'
              }
            >
              {formatMoneyShort(valorVendas)} · {formatPercent(percentualMeta || 0)} da meta
            </span>
          )}
        </div>
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

export default function DashboardPage() {
  const { periodo, tipoData, segmento, dataInicio, dataFim, viewMode, comparar } = useFilters()

  const [data, setData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [leadsSelecionados, setLeadsSelecionados] = useState<('A' | 'B' | 'C' | 'D')[]>(['A'])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [now, setNow] = useState<Date>(new Date())

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

      setLastUpdated(new Date())
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
  const origens = data?.origens || []
  const experienciaCliente = (data as any)?.kpis?.experienciaCliente
  const comparativo = data?.comparativo
  const consultaPorMedico = data?.consultaPorMedico || []
  const vendasPorMedico = data?.vendasPorMedico || []

  const medicosSnapshotMap = new Map<
    string,
    {
      nome: string
      atendimentos?: number
      ticketConsulta?: number
      valorVendas?: number
      percentualMeta?: number
    }
  >()

  consultaPorMedico.forEach((m) => {
    medicosSnapshotMap.set(m.medico, {
      ...medicosSnapshotMap.get(m.medico),
      nome: m.medico,
      atendimentos: m.atendimentos,
      ticketConsulta: m.ticketMedio,
    })
  })

  vendasPorMedico.forEach((m) => {
    medicosSnapshotMap.set(m.nome, {
      ...medicosSnapshotMap.get(m.nome),
      nome: m.nome,
      valorVendas: m.valor,
      percentualMeta: (m.percentual || 0) * 100,
    })
  })

  const medicosSnapshot = Array.from(medicosSnapshotMap.values())
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
  const origensTop = origens.slice(0, 10)
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

  const convertidosFiltradoPercent =
  quantidadeLeadSelecionado > 0
    ? (Number(marketing?.convertidos || 0) / quantidadeLeadSelecionado) * 100
    : 0


  return (
    <AppShell title="Visão Geral">
     <div className="space-y-3">
       <div className="flex justify-end">
         <LiveIndicator lastUpdated={lastUpdated} now={now} />
       </div>

    <div
  className={`grid gap-3 ${
    viewMode === 'mobile'
  ? 'grid-cols-1'
  : 'grid-cols-4'
  }`}
>
          <GroupCard title="Marketing / Topo de Funil" icon={<Funnel size={26} />}>
           <SimpleMetric
  label="Total de leads recebidos"
  value={marketing?.totalEntradas || 0}
  previousValue={comparativo?.marketing?.totalEntradasAnterior}
  showCompare={comparar}
>
  <div
  className="
    absolute
    left-0
    top-full
    z-50
    mt-3
    w-[900px]
    rounded-[28px]
    border
    border-black/10
    bg-[var(--card)]
    p-5
    shadow-2xl

    opacity-0
    invisible

    group-hover:opacity-100
    group-hover:visible

    transition-all
    duration-200
  "
>
      <div className="mb-4 flex items-center justify-between">
  <h3 className={`${viewMode === 'mobile' ? 'text-[34px]' : 'text-[18px]'} font-black text-[var(--foreground)]`}>
    Origens dos leads
  </h3>

  <span className={`${viewMode === 'mobile' ? 'text-[54px]' : 'text-[24px]'} font-black text-[var(--foreground)]`}>
    {origensTotal}
  </span>
</div>

<div className={`${viewMode === 'mobile' ? 'max-h-[680px] space-y-6' : 'max-h-[360px] space-y-3'} overflow-y-auto pr-2`}>
  {origensTop.map((item, i) => {
    const pct = (item.quantidade / origensTotal) * 100
    const color = ORIGENS_COLORS[i % ORIGENS_COLORS.length]

    return (
      <div key={item.nome}>
        <div className="mb-1 flex items-center justify-between gap-4">
          <span className={`${viewMode === 'mobile' ? 'text-[26px]' : 'text-[13px]'} truncate font-black text-[var(--muted-foreground)]`}>
            {item.nome}
          </span>

          <span className={`${viewMode === 'mobile' ? 'text-[30px]' : 'text-[14px]'} font-black text-[var(--foreground)]`}>
            {item.quantidade}
          </span>
        </div>

        <div className={`${viewMode === 'mobile' ? 'h-6' : 'h-3'} relative overflow-hidden rounded-full bg-slate-200 dark:bg-white/10`}>
          <div
            className={`${viewMode === 'mobile' ? 'h-6' : 'h-3'} rounded-full`}
            style={{
              width: `${Math.max(pct, 4)}%`,
              backgroundColor: color,
            }}
          />
        </div>
      </div>
    )
  })}
</div>
  </div>
</SimpleMetric>
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
      viewMode === 'mobile' ? 'text-[28px] font-black' : 'text-[14px] font-semibold'
    } leading-tight ${textPrimary()}`}
  >
    Leads aceitos (SAL)
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
        className={`rounded-lg border py-1.5 font-black transition-all duration-200 ${
          leadsSelecionados.includes(item)
            ? 'border-emerald-400 bg-emerald-400/10 text-emerald-500'
            : 'border-black/10 bg-[var(--metric-card)] text-[var(--muted-foreground)] hover:border-[var(--accent)]/40 hover:text-[var(--foreground)] dark:border-white/10'
        } ${viewMode === 'mobile' ? 'text-[28px]' : 'text-[14px]'}`}
      >
        {item}
      </button>
    ))}
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
      viewMode === 'mobile'
        ? 'text-[28px]'
          : 'text-[14px]'
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
        : 'h-2 rounded-full'
    }`}
  >
    <div
      className={`bg-emerald-400 ${
        viewMode === 'mobile'
          ? 'h-8 rounded-xl'
          : 'h-2 rounded-full'
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
  empty={quantidadeLeadSelecionado === 0}
/>
          </GroupCard>

          <GroupCard title="Comercial I e II" icon={<Stethoscope size={26} />}>
  <div className="grid grid-cols-2 gap-7">
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <span className="h-3 w-3 rounded-full bg-[var(--accent)]" />
        <h4 className={`${viewMode === 'mobile' ? 'text-[26px]' : 'text-[14px]'} font-black uppercase tracking-wide ${textSecondary()}`}>
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
    </div>

    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <span className="h-3 w-3 rounded-full bg-[var(--accent)]" />
        <h4 className={`${viewMode === 'mobile' ? 'text-[26px]' : 'text-[14px]'} font-black uppercase tracking-wide ${textSecondary()}`}>
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
  </div>

  <div className="border-t border-black/10 pt-1 dark:border-white/10">
    <div className="mb-1 flex items-center gap-3">
      <span className="h-3 w-3 rounded-full bg-[var(--accent)]" />
      <h4 className={`${viewMode === 'mobile' ? 'text-[26px]' : 'text-[14px]'} font-black uppercase tracking-wide ${textSecondary()}`}>
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

 <div className="border-t border-black/10 pt-2 dark:border-white/10">
    <div className="mb-2 flex items-center gap-3">
  <span className="h-3 w-3 rounded-full bg-[var(--accent)]" />
  <h4
  className={`${
    viewMode === 'mobile'
      ? 'text-[26px]'
      : 'text-[14px]'
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

        <section className={`rounded-[24px] px-4 py-2 ${cardBg()}`}>
          <div className="mb-3 flex items-center gap-3">
  <div
  className={`${
    viewMode === 'mobile'
      ? 'h-12 w-12'
      : 'h-6 w-6'
  } flex shrink-0 items-center justify-center text-[var(--accent)]`}
>
  <ChartNoAxesCombined size={26} />
</div>
  <h3
    className={`${
      viewMode === 'mobile'
        ? 'text-[42px]'
        : 'text-[20px]'
    } font-black tracking-[-0.05em] ${textPrimary()}`}
  >
    Consolidado
  </h3>
</div>

           <div
  className={`grid gap-2 ${
    viewMode === 'mobile'
  ? 'grid-cols-1'
  : 'grid-cols-3'
  }`}
>
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
      viewMode === 'mobile' ? 'text-[32px]' : 'text-[14px]'
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
      viewMode === 'mobile'
        ? 'h-8 rounded-xl'
        : 'h-2 rounded-full'
    }`}
  >
    <div
      className={`${
        viewMode === 'mobile'
          ? 'h-8 rounded-xl'
          : 'h-2 rounded-full'
      } ${
        consolidadoVendasOk
          ? 'bg-emerald-400'
          : 'bg-rose-400'
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
      viewMode === 'mobile' ? 'text-[32px]' : 'text-[14px]'
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

    <span className={textSecondary()}>
      mín. {formatMoney(metaTicket)}
    </span>
  </div>

  <div
    className={`overflow-hidden bg-slate-200 dark:bg-white/10 ${
      viewMode === 'mobile'
        ? 'h-8 rounded-xl'
        : 'h-2 rounded-full'
    }`}
  >
    <div
      className={`${
        viewMode === 'mobile'
          ? 'h-8 rounded-xl'
          : 'h-2 rounded-full'
      } ${
        consolidadoTicketOk
          ? 'bg-emerald-400'
          : 'bg-rose-400'
      }`}
      style={{ width: `${clampPercent(ticketPercent)}%` }}
    />
  </div>
</div>
          </div>
        </section>

        {medicosSnapshot.length > 0 && (
          <section className={`rounded-[24px] px-4 py-2 ${cardBg()}`}>
            <div className="mb-3 flex items-center gap-3">
              <div
                className={`${
                  viewMode === 'mobile' ? 'h-12 w-12' : 'h-6 w-6'
                } flex shrink-0 items-center justify-center text-[var(--accent)]`}
              >
                <UserRound size={26} />
              </div>
              <h3
                className={`${
                  viewMode === 'mobile' ? 'text-[42px]' : 'text-[20px]'
                } font-black tracking-[-0.05em] ${textPrimary()}`}
              >
                Médicos
              </h3>
            </div>

            <div
              className={`grid gap-2 ${
                viewMode === 'mobile' ? 'grid-cols-1' : 'grid-cols-2 xl:grid-cols-4'
              }`}
            >
              {medicosSnapshot.map((m) => (
                <MedicoSnapshotCard
                  key={m.nome}
                  nome={m.nome}
                  atendimentos={m.atendimentos}
                  ticketConsulta={m.ticketConsulta}
                  valorVendas={m.valorVendas}
                  percentualMeta={m.percentualMeta}
                />
              ))}
            </div>
          </section>
        )}

      </div>
    </AppShell>
  )
}