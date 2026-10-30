'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts'
import { useFilters } from '@/store/use-filters'
import { useSetPageHeader } from '@/store/use-page-header'
import { deepEqual } from '@/lib/deep-equal'
import { MedicosPremium } from '@/components/dashboard/medicos-premium'
import { montarMedicosSnapshot } from '@/lib/medicos-snapshot'
import {
  CircleDollarSign,
  TrendingUp,
  UserCheck,
  Ticket,
  ChartNoAxesCombined,
  type LucideIcon,
} from 'lucide-react'

type DashboardResponse = {
  ok: boolean
  painelAtendimento?: {
    atendimentoPorDia?: { data: string; label: string; quantidade: number }[]
    evolucaoFaturamento?: { label: string; valor: number }[]
    agendamentosPorOrigem?: { nome: string; quantidade: number }[]
    totalAgendamentos?: number
    totalPrimeiraVez?: number
    statusAgenda?: {
      finalizados?: number
      noShow?: number
      reagendados?: number
      cancelados?: number
    }
  }
  consultaPorMedico?: {
  medico: string
  atendimentos: number
  noShow: number
  noShowPercent: number
  quantidadeConsulta: number
  valorConsulta: number
  ticketMedio: number
  proximosAtendimentos: number
  manha?: number
tarde?: number
capacidadeAgenda?: number
agendaSemDados?: boolean
procedimentos?: number
cirurgias?: number
cancelados?: number
reagendados?: number
valorParticular?: number
valorConvenio?: number
valorProtocolosVendidos?: number
consultasPrimeiraVez?: number
injetaveisVendidos?: number
valorInjetaveisVendidos?: number
protocolosVendidos?: number
retornos?: number
tempoEsperaMedio?: number
tempoAtendimentoMedio?: number

atendimentosAnterior?: number
retornosAnterior?: number
noShowAnterior?: number
canceladosAnterior?: number
reagendadosAnterior?: number
consultasPrimeiraVezAnterior?: number
procedimentosAnterior?: number
cirurgiasAnterior?: number
injetaveisVendidosAnterior?: number
valorInjetaveisVendidosAnterior?: number
protocolosVendidosAnterior?: number
valorProtocolosVendidosAnterior?: number
quantidadeConsultaAnterior?: number
valorConsultaAnterior?: number
ticketMedioAnterior?: number
valorVendasAnterior?: number
faturamentoConsolidadoAnterior?: number
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

  kpis?: {
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
      propostasFechadas: number
      valorTotalVendas: number
      ticketMedioVendas: number
    }
  }

  consolidado?: {
    qtdVendas: number
    valorVendas: number
    ticketMedio: number
    metaValorVendas: number
    metaTicketMedio: number
  }

  comparativo?: {
  atendimento?: {
    totalPrimeiraVezAnterior: number
  }

  comercialConsulta?: {
    quantidadeConsultaAnterior: number
    valorTotalConsultaAnterior: number
    ticketMedioConsultaAnterior: number

    quantidadeReabordAnterior: number
    valorTotalReabordAnterior: number
    ticketMedioReabordAnterior: number

    quantidadeTotalAnterior: number
    valorTotalAnterior: number
    ticketMedioTotalAnterior: number
  }

  comercialVendas?: {
    propostasFechadasAnterior: number
    valorTotalVendasAnterior: number
    ticketMedioVendasAnterior: number
  }

  consolidado?: {
    qtdVendasAnterior: number
    valorVendasAnterior: number
    ticketMedioAnterior: number
  }

  statusAgenda?: {
    finalizadosAnterior: number
    noShowAnterior: number
    reagendadosAnterior: number
    canceladosAnterior: number
  }
}
}

function formatMoney(v: number) {
  return v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })
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
    <div className="flex items-start gap-2 text-[12px] font-semibold text-[var(--muted-foreground)]">
      <span
        className={`mt-1 inline-flex h-2 w-2 shrink-0 rounded-full ${
          stale ? 'bg-[var(--warning)]' : 'bg-[var(--success)]'
        }`}
      />
      <span className="min-w-0">{label}</span>
    </div>
  )
}

export default function FunilPage() {
const { periodo, tipoData, segmento, dataInicio, dataFim, viewMode, comparar, compararInicio, compararFim } = useFilters()
const isApresentacao = viewMode === 'apresentacao'

  const [data, setData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [now, setNow] = useState<Date>(new Date())

  useSetPageHeader('Consulta (Funil)', <LiveIndicator lastUpdated={lastUpdated} now={now} />)

  const colunaGraficosRef = useRef<HTMLDivElement>(null)
  const [alturaColunaGraficos, setAlturaColunaGraficos] = useState<number | null>(null)

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(tick)
  }, [])

  // ResizeObserver acompanha a altura real da coluna de gráficos (Atendimento por dia +
  // Evolução de faturamento) continuamente — inclusive depois que os gráficos terminam de
  // renderizar de forma assíncrona — para que "Origem dos agendamentos" sempre termine
  // alinhado ao fim dela, rolando internamente quando tiver mais origens do que cabe.
  // Depende de `loading`: a div medida só existe no DOM depois que a tela de carregamento
  // sai, então o efeito precisa rodar de novo nesse momento para conseguir anexar o observer.
  useEffect(() => {
    const elemento = colunaGraficosRef.current
    if (!elemento) return

    const observer = new ResizeObserver((entries) => {
      const altura = entries[0]?.contentRect.height
      if (altura) setAlturaColunaGraficos(Math.round(altura))
    })

    observer.observe(elemento)
    return () => observer.disconnect()
  }, [loading])

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

      if (!json.ok) {
        throw new Error(json.error || 'Erro ao buscar dados')
      }

      setData((prev) => (deepEqual(prev, json) ? prev : json))

      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado')
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }

  // Primeira carga
  loadData(true)

  // Atualização automática a cada 10 segundos
 const interval = setInterval(() => {
  loadData(false)
}, 60000)

  return () => clearInterval(interval)
}, [periodo, tipoData, segmento, dataInicio, dataFim, comparar, compararInicio, compararFim])

  const vendasPorMedico = data?.vendasPorMedico || []
  const painelAtendimento = data?.painelAtendimento

  const atendimentoPorDiaChart = useMemo(() => {
    return (painelAtendimento?.atendimentoPorDia || []).map((item) => {
      const dataObj = new Date(`${item.data}T00:00:00`)
      const fimDeSemana = dataObj.getDay() === 0 || dataObj.getDay() === 6
      return { ...item, fimDeSemana }
    })
  }, [painelAtendimento?.atendimentoPorDia])

  const evolucaoFaturamentoChart = useMemo(() => {
    return painelAtendimento?.evolucaoFaturamento || []
  }, [painelAtendimento?.evolucaoFaturamento])

  const totalAgendamentosOrigem =
  painelAtendimento?.totalAgendamentos || 0
  const totalConsultasComReabord =
  Number(data?.kpis?.comercialConsulta?.quantidadeTotal || 0)

const faturamentoConsultaComReabord =
  Number(data?.kpis?.comercialConsulta?.valorTotal || 0)

const ticketMedioConsultaComReabord =
  Number(data?.kpis?.comercialConsulta?.ticketMedioTotal || 0)
  const comparativo = data?.comparativo
  const medicosSnapshot = montarMedicosSnapshot(data?.consultaPorMedico || [], vendasPorMedico)

  if (loading) {
    return (
      <div className="rounded-[24px] bg-[var(--card)] p-6">
        Carregando consultas...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-[24px] border border-[var(--danger)]/20 bg-[var(--danger)]/10 p-6 text-[var(--danger)]">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-5">
<section className={`rounded-[24px] border border-[color:var(--border)] bg-[var(--card)] p-4 text-[var(--foreground)] shadow-[var(--card-shadow)]`}>
  <div className="flex items-start gap-4">
 <div className="flex h-9 shrink-0 items-center justify-center">
  <ChartNoAxesCombined className="h-6 w-6 text-[var(--accent)]" />
</div>

  <div>
    <h2 className={`${isApresentacao ? 'text-[38px]' : 'text-[19px] mobile-h:text-[24px]'} font-black text-[var(--foreground)]`}>
      Visão geral dos atendimentos
    </h2>

    <p className={`mt-1 ${isApresentacao ? 'text-[18px]' : 'text-sm'} font-semibold text-[var(--muted-foreground)]`}>
      Dados consolidados de todos os profissionais no período
    </p>
  </div>
  </div>

  <div className="mt-6 grid gap-3 @md:grid-cols-4">
<MetricCard
  icon={TrendingUp}
  label="Atendimentos 1ª vez"
  value={painelAtendimento?.totalPrimeiraVez || 0}
  description="total no período"
  tone="green"
  previousValue={comparativo?.atendimento?.totalPrimeiraVezAnterior}
  showCompare={comparar}
/>

    <MetricCard
  icon={UserCheck}
  label="Total de consultas"
  value={totalConsultasComReabord}
  description="consultas recebidas"
  tone="blue"
  previousValue={comparativo?.comercialConsulta?.quantidadeTotalAnterior}
  showCompare={comparar}
/>

    <MetricCard
      icon={CircleDollarSign}
      label="Faturamento consultas"
      value={formatMoney(faturamentoConsultaComReabord)}
      description="vendas de consulta"
      tone="green"
      empty={totalConsultasComReabord === 0}
      previousValue={comparativo?.comercialConsulta?.valorTotalAnterior}
      showCompare={comparar}
    />

    <MetricCard
      icon={Ticket}
      label="Ticket médio"
      value={formatMoney(ticketMedioConsultaComReabord)}
      description="média por consulta"
      tone="purple"
      previousValue={comparativo?.comercialConsulta?.ticketMedioTotalAnterior}
      showCompare={comparar}
      empty={totalConsultasComReabord === 0}
    />
  </div>

  <div className="mt-3 grid items-start gap-3 @xl:grid-cols-12">
  <div ref={colunaGraficosRef} className="min-w-0 space-y-3 @xl:col-span-8">

    <div className="min-w-0 overflow-hidden rounded-[24px] border border-[color:var(--border)] bg-[var(--metric-card)] shadow-[var(--card-shadow)] p-4">
  <div className="mb-3 flex items-center justify-between">
    <h3 className={`${isApresentacao ? 'text-[28px]' : 'text-[18px]'} font-black text-[var(--foreground)]`}>
      Atendimento por dia
    </h3>

    <div className={`flex items-center gap-3 ${isApresentacao ? 'text-[16px]' : 'text-[11px]'} font-bold text-[var(--muted-foreground)]`}>
      <span className="flex items-center gap-1">
        <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
        Seg a sex
      </span>

      <span className="flex items-center gap-1">
        <span className="h-2 w-2 rounded-full bg-[var(--muted-foreground)]/40" />
        Sáb e dom
      </span>
    </div>
  </div>

  <div className="h-[150px] w-full">
    {atendimentoPorDiaChart.length > 0 ? (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={atendimentoPorDiaChart}
          margin={{ top: 16, right: 8, left: 8, bottom: 0 }}
        >
          <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.6} strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fontWeight: 700, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'var(--progress-bg)' }}
            contentStyle={{
              background: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--foreground)',
            }}
            formatter={(value) => [value, 'Atendimentos']}
          />
          <Bar dataKey="quantidade" radius={[6, 6, 0, 0]} maxBarSize={18} isAnimationActive={false} label={{ position: 'top', fontSize: 11, fontWeight: 500, fill: 'var(--foreground)' }}>
            {atendimentoPorDiaChart.map((item, index: number) => (
              <Cell
                key={item.data || index}
                fill={item.fimDeSemana ? 'var(--muted-foreground)' : 'var(--accent)'}
                fillOpacity={item.fimDeSemana ? 0.35 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    ) : (
      <div className={`flex h-full items-center justify-center ${isApresentacao ? 'text-[18px]' : 'text-[13px]'} font-semibold text-[var(--muted-foreground)]`}>
        Sem dados no período
      </div>
    )}
  </div>
</div>

   <div className="min-w-0 overflow-hidden rounded-[24px] border border-[color:var(--border)] bg-[var(--metric-card)] shadow-[var(--card-shadow)] p-4">
  <h3 className={`mb-3 ${isApresentacao ? 'text-[28px]' : 'text-[18px]'} font-black text-[var(--foreground)]`}>
    Evolução de faturamento
  </h3>

  <div className="mt-4 h-[170px] w-full">
    {evolucaoFaturamentoChart.length > 0 ? (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={evolucaoFaturamentoChart}
          margin={{ top: 16, right: 8, left: 8, bottom: 0 }}
        >
          <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.6} strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fontWeight: 700, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'var(--progress-bg)' }}
            contentStyle={{
              background: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--foreground)',
            }}
            formatter={(value) => [formatMoney(Number(value || 0)), 'Faturamento']}
          />
          <Bar
            dataKey="valor"
            radius={[6, 6, 0, 0]}
            maxBarSize={22}
            fill="var(--success)"
            isAnimationActive={false}
            label={{
              position: 'top',
              fontSize: 10,
              fontWeight: 500,
              fill: 'var(--foreground)',
              formatter: (value) => formatMoney(Number(value || 0)),
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    ) : (
      <div className={`flex h-full items-center justify-center ${isApresentacao ? 'text-[18px]' : 'text-[13px]'} font-semibold text-[var(--muted-foreground)]`}>
        Sem dados no período
      </div>
    )}
  </div>
</div>

  </div>

<div className="flex min-h-0 min-w-0 flex-col gap-3 @xl:col-span-4">

   <div
     className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[24px] border border-[color:var(--border)] bg-[var(--metric-card)] shadow-[var(--card-shadow)] p-4 xl:h-[var(--altura-coluna-graficos)]"
     style={alturaColunaGraficos ? ({ '--altura-coluna-graficos': `${alturaColunaGraficos}px` } as React.CSSProperties) : undefined}
   >
  <h3 className={`mb-4 shrink-0 ${isApresentacao ? 'text-[28px]' : 'text-[18px]'} font-black text-[var(--foreground)]`}>
    Origem dos agendamentos
  </h3>

  <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-2">
    {(painelAtendimento?.agendamentosPorOrigem || []).map((item) => {
      const maior = Math.max(
        ...(painelAtendimento?.agendamentosPorOrigem || []).map((x) => Number(x.quantidade || 0)),
        1
      )

      return (
        <div key={item.nome}>
          <div className="mb-1 flex items-center justify-between gap-3">
            <span className={`truncate ${isApresentacao ? 'text-[18px]' : 'text-sm'} font-bold text-[var(--muted-foreground)]`}>
              {item.nome}
            </span>

            <span className={`${isApresentacao ? 'text-[18px]' : 'text-sm'} font-medium text-[var(--foreground)]`}>
              {item.quantidade || 0}
            </span>
          </div>

          <div className={`${isApresentacao ? 'h-3' : 'h-2'} overflow-hidden rounded-full bg-[var(--progress-bg)]`}>
            <div
              className="h-full rounded-full bg-[var(--accent)]"
              style={{
                width: `${Math.max((Number(item.quantidade || 0) / maior) * 100, 4)}%`,
              }}
            />
          </div>
        </div>
      )
    })}
  </div>

  <div className="mt-3 shrink-0 border-t border-[color:var(--border)] pt-3 text-right">
    <span className={`${isApresentacao ? 'text-[18px]' : 'text-sm'} font-bold text-[var(--muted-foreground)]`}>
      Total: <span className="font-medium text-[var(--foreground)]">{totalAgendamentosOrigem}</span>
    </span>
  </div>
</div>

  </div>
</div>

<div className="mt-3 grid grid-cols-2 gap-3 @tablet:grid-cols-4">
  <div className="rounded-[22px] border border-[color:var(--border)] bg-[var(--metric-card)] shadow-[var(--card-shadow)] p-4">
    <p className={`${isApresentacao ? 'text-[16px]' : 'text-[11px]'} font-black uppercase tracking-[0.08em] text-[var(--muted-foreground)]`}>
      Finalizados
    </p>
    <p className={`mt-2 ${isApresentacao ? 'text-[42px]' : 'text-[26px]'} font-medium text-[var(--foreground)]`}>
      {painelAtendimento?.statusAgenda?.finalizados || 0}
    </p>
    {comparar && (
      <ComparativoBadge
        atual={painelAtendimento?.statusAgenda?.finalizados || 0}
        anterior={comparativo?.statusAgenda?.finalizadosAnterior}
      />
    )}
  </div>

  <div className="rounded-[22px] border border-[color:var(--border)] bg-[var(--metric-card)] shadow-[var(--card-shadow)] p-4">
    <p className={`${isApresentacao ? 'text-[16px]' : 'text-[11px]'} font-black uppercase tracking-[0.08em] text-[var(--muted-foreground)]`}>
      No Show
    </p>
    <p className={`mt-2 ${isApresentacao ? 'text-[42px]' : 'text-[26px]'} font-medium text-[var(--foreground)]`}>
      {painelAtendimento?.statusAgenda?.noShow || 0}
    </p>
    {comparar && (
      <ComparativoBadge
        atual={painelAtendimento?.statusAgenda?.noShow || 0}
        anterior={comparativo?.statusAgenda?.noShowAnterior}
      />
    )}
  </div>

  <div className="rounded-[22px] border border-[color:var(--border)] bg-[var(--metric-card)] shadow-[var(--card-shadow)] p-4">
    <p className={`${isApresentacao ? 'text-[16px]' : 'text-[11px]'} font-black uppercase tracking-[0.08em] text-[var(--muted-foreground)]`}>
      Reagendados
    </p>
    <p className={`mt-2 ${isApresentacao ? 'text-[42px]' : 'text-[26px]'} font-medium text-[var(--foreground)]`}>
      {painelAtendimento?.statusAgenda?.reagendados || 0}
    </p>
    {comparar && (
      <ComparativoBadge
        atual={painelAtendimento?.statusAgenda?.reagendados || 0}
        anterior={comparativo?.statusAgenda?.reagendadosAnterior}
      />
    )}
  </div>

  <div className="rounded-[22px] border border-[color:var(--border)] bg-[var(--metric-card)] shadow-[var(--card-shadow)] p-4">
    <p className={`${isApresentacao ? 'text-[16px]' : 'text-[11px]'} font-black uppercase tracking-[0.08em] text-[var(--muted-foreground)]`}>
      Cancelados
    </p>
    <p className={`mt-2 ${isApresentacao ? 'text-[42px]' : 'text-[26px]'} font-medium text-[var(--foreground)]`}>
      {painelAtendimento?.statusAgenda?.cancelados || 0}
    </p>
    {comparar && (
      <ComparativoBadge
        atual={painelAtendimento?.statusAgenda?.cancelados || 0}
        anterior={comparativo?.statusAgenda?.canceladosAnterior}
      />
    )}
  </div>
</div>
</section>

       {medicosSnapshot.length > 0 && (
         <MedicosPremium medicos={medicosSnapshot} periodo={periodo} dataInicio={dataInicio} />
       )}
 </div>
  )
}
function ComparativoBadge({
  atual,
  anterior,
  centered = false,
  formatAnterior,
}: {
  atual: number
  anterior?: number
  centered?: boolean
  formatAnterior?: (v: number) => string
}) {
  const { viewMode } = useFilters()
  const isApresentacao = viewMode === 'apresentacao'

  const base = Number(anterior || 0)
  const diff = base > 0 ? Math.round(((atual - base) / base) * 100) : 0
  const positivo = diff > 0
  const negativo = diff < 0

  return (
    <div className={`mt-2 flex items-center gap-2 ${isApresentacao ? 'text-[16px]' : 'text-[12px]'} font-medium ${centered ? 'justify-center' : ''}`}>
      <span
        className={
          positivo
            ? 'text-[var(--success)]'
            : negativo
            ? 'text-[var(--danger)]'
            : 'text-[var(--muted-foreground)]'
        }
      >
        {positivo ? '▲' : negativo ? '▼' : '＝'} {Math.abs(diff)}%
      </span>

      <span className="text-[var(--muted-foreground)]">
        ant. {formatAnterior ? formatAnterior(base) : base}
      </span>
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  description,
  tone = 'blue',
  previousValue,
  currentValue,
  showCompare = false,
  empty = false,
  centered = false,
  centerTitle = false,
}: {
  icon: LucideIcon
  label: string
  value: ReactNode
  description: string
  tone?: 'blue' | 'green' | 'red' | 'purple'
  previousValue?: number
  currentValue?: number
  showCompare?: boolean
  empty?: boolean
  centered?: boolean
  centerTitle?: boolean
}) {



  const { viewMode } = useFilters()
  const isImac = viewMode === 'desktop'
  const isApresentacao = viewMode === 'apresentacao'
  const tones = {
    blue:
'border border-[color:var(--border)] bg-[var(--metric-card)] transition-all duration-300 hover:-translate-y-[2px] hover:border-[var(--accent)]/30',

green:
'border border-[color:var(--border)] bg-[var(--metric-card)] transition-all duration-300 hover:-translate-y-[2px] hover:border-[var(--accent)]/30',

red:
'border border-[color:var(--border)] bg-[var(--metric-card)] transition-all duration-300 hover:-translate-y-[2px] hover:border-[var(--accent)]/30',

purple:
'border border-[color:var(--border)] bg-[var(--metric-card)] transition-all duration-300 hover:-translate-y-[2px] hover:border-[var(--accent)]/30',
  }

  const iconColors = {
  blue: 'text-[var(--accent)]',
  green: 'text-[var(--success)]',
  red: 'text-[var(--danger)]',
  purple: 'text-[var(--accent)]',
}

const atual =
  currentValue !== undefined
    ? currentValue
    : typeof value === 'string'
      ? Number(String(value).replace(/[^\d,-]/g, '').replace(',', '.')) || 0
      : Number(value || 0)

const anterior = Number(previousValue || 0)

const diff =
  anterior > 0 ? Math.round(((atual - anterior) / anterior) * 100) : 0

const positivo = diff > 0
const negativo = diff < 0

  const labelMinH = isApresentacao ? 'min-h-[52px]' : 'min-h-[40px]'

  if (empty) {
    return (
      <div className={`relative z-0 hover:z-10 flex h-full min-w-0 flex-col rounded-[22px] shadow-[var(--card-shadow)] px-3 py-2 ${tones[tone]}`}>
        <div className={`flex min-w-0 items-center gap-2 ${(centered || centerTitle) ? 'justify-center text-center' : ''} ${labelMinH}`}>
          <Icon className={`h-5 w-5 shrink-0 ${iconColors[tone]}`} />
          <p className={`truncate ${isImac ? 'text-[15px]' : isApresentacao ? 'text-[20px]' : 'text-[15px]'} font-black text-[var(--foreground)]`}>{label}</p>
        </div>

        <div className={`mt-3 ${centered ? 'text-center' : ''}`}>
          <div className={`${isImac ? 'text-[20px]' : isApresentacao ? 'text-[34px]' : 'text-[24px]'} font-medium leading-none text-[var(--muted-foreground)]/40`}>
            —
          </div>

          <p className={`mt-2 ${isImac ? 'text-[12px]' : isApresentacao ? 'text-[18px]' : 'text-[13px]'} font-medium text-[var(--muted-foreground)]`}>
            Sem dados no período
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative z-0 hover:z-10 flex h-full min-w-0 flex-col rounded-[22px] shadow-[var(--card-shadow)] px-3 py-2 ${tones[tone]}`}>
      <div className={`flex min-w-0 items-center gap-2 ${(centered || centerTitle) ? 'justify-center text-center' : ''} ${labelMinH}`}>
        <Icon className={`h-5 w-5 shrink-0 ${iconColors[tone]}`} />
       <p className={`truncate ${isImac ? 'text-[15px]' : isApresentacao ? 'text-[20px]' : 'text-[15px]'} font-black text-[var(--foreground)]`}>{label}</p>
      </div>

      <div className={`mt-3 min-w-0 ${centered ? 'text-center' : ''}`}>
  <div className="min-w-0">
    <div className={`flex w-full min-w-0 items-center gap-2 ${centered ? 'justify-center' : 'justify-between'} ${isImac ? 'text-[20px]' : isApresentacao ? 'text-[34px]' : 'text-[24px]'} font-medium leading-none text-[var(--foreground)]`}>
      {value}
    </div>

   {description && (
  <p className={`mt-2 truncate ${isImac ? 'text-[12px]' : isApresentacao ? 'text-[18px]' : 'text-[13px]'} font-medium text-[var(--muted-foreground)]`}>
    {description}
  </p>
)}

{showCompare && (
  <div className={`mt-2 flex items-center gap-2 ${isApresentacao ? 'text-[16px]' : 'text-[12px]'} font-medium ${centered ? 'justify-center' : ''}`}>
    <span
      className={
        positivo
          ? 'text-[var(--success)]'
          : negativo
          ? 'text-[var(--danger)]'
          : 'text-[var(--muted-foreground)]'
      }
    >
      {positivo ? '▲' : negativo ? '▼' : '＝'} {Math.abs(diff)}%
    </span>

    <span className="text-[var(--muted-foreground)]">
      ant. {typeof value === 'string' && value.includes('R$') ? formatMoney(anterior) : anterior}
    </span>
  </div>
)}
  </div>

  {/* gráfico removido */}
</div>
    </div>
  )
}