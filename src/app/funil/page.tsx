'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts'
import { AppShell } from '@/components/layout/app-shell'
import { useFilters } from '@/store/use-filters'
import {
  CircleDollarSign,
  TrendingUp,
  Stethoscope,
  UserX,
  UserCheck,
  RotateCcw,
  Ticket,
  Handshake,
  ClipboardList,
  CalendarX2,
  CalendarClock,
  ChartNoAxesCombined,
} from 'lucide-react'

type DashboardResponse = {
  ok: boolean
  painelAtendimento?: any
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
procedimentos?: number
cirurgias?: number
cancelados?: number
reagendados?: number
valorParticular?: number
valorConvenio?: number
valorProtocolosVendidos?: number
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
    <div className="flex items-center gap-2 text-[12px] font-semibold text-[var(--muted-foreground)]">
      <span
        className={`inline-flex h-2 w-2 rounded-full ${
          stale ? 'bg-[var(--warning)]' : 'bg-[var(--success)]'
        }`}
      />
      <span>{label}</span>
    </div>
  )
}

function getFotoMedico(nome: string) {
  const n = nome
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toUpperCase()

  if (n.includes('RODOLPHO')) return '/medicos/rodolpho.png'
  if (n.includes('CLAUDIA')) return '/medicos/claudia.png'
  if (n.includes('BRENO')) return '/medicos/breno.png'

  if (n.includes('JESSICA') || n.includes('FISIOTERAPIA')) {
  return '/medicos/jessica.png'
}

  return null
}

function getInfoMedico(nome: string) {
  const n = nome.normalize('NFD').replace(/\p{Diacritic}/gu, '').toUpperCase()

  if (n.includes('RODOLPHO')) {
    return { crm: 'CRM 13263 RQE 6927 RQE 7689', especialidade: 'Angiologia' }
  }

  if (n.includes('CLAUDIA')) {
    return { crm: 'CRM 19828 | 22678', especialidade: 'Cirurgia Vascular' }
  }

  if (n.includes('BRENO')) {
    return { crm: 'CRM 29284', especialidade: 'Medicina Integrativa' }
  }

  if (
  n.includes('JESSICA') ||
  n.includes('FISIOTERAPIA')
) {
  return {
  crm: 'CREFITO não informado',
  especialidade: 'Fisioterapia',
}
}

  return { crm: 'CRM não informado', especialidade: 'Especialidade não informada' }
}

export default function FunilPage() {
const { periodo, tipoData, segmento, dataInicio, dataFim, viewMode, comparar } = useFilters()
const isImac = viewMode === 'desktop'
const isApresentacao = viewMode === 'apresentacao'

  const [data, setData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [now, setNow] = useState<Date>(new Date())

  const colunaGraficosRef = useRef<HTMLDivElement>(null)
  const [alturaColunaGraficos, setAlturaColunaGraficos] = useState<number | null>(null)

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(tick)
  }, [])

  useEffect(() => {
    function medirAlturaColunaGraficos() {
      const elemento = colunaGraficosRef.current
      if (elemento) setAlturaColunaGraficos(elemento.offsetHeight)
    }

    medirAlturaColunaGraficos()
    window.addEventListener('resize', medirAlturaColunaGraficos)
    return () => window.removeEventListener('resize', medirAlturaColunaGraficos)
  }, [loading, data])

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

      if (!json.ok) {
        throw new Error(json.error || 'Erro ao buscar dados')
      }

      setData((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(json)) {
          return prev
        }

        return json
      })

      setLastUpdated(new Date())
    } catch (err: any) {
      setError(err.message || 'Erro inesperado')
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
}, [periodo, tipoData, segmento, dataInicio, dataFim])

  const vendasPorMedico = data?.vendasPorMedico || []
  const painelAtendimento = data?.painelAtendimento

  const atendimentoPorDiaChart = useMemo(() => {
    return (painelAtendimento?.atendimentoPorDia || []).map((item: any) => {
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
  const consultaPorMedico = Array.from(
  new Map(
    (data?.consultaPorMedico || [])
      .filter((medico: any) => {
        return (
          (medico.atendimentos || 0) > 0 ||
          (medico.quantidadeConsulta || 0) > 0 ||
          (medico.procedimentos || 0) > 0 ||
          (medico.cirurgias || 0) > 0 ||
          (medico.noShow || 0) > 0 ||
          (medico.cancelados || 0) > 0 ||
          (medico.reagendados || 0) > 0
        )
      })
      .map((medico: any) => [
        medico.medico
          ?.normalize('NFD')
          .replace(/\p{Diacritic}/gu, '')
          .toUpperCase()
          .trim(),
        medico,
      ])
  ).values()
)
  if (loading) {
    return (
      <AppShell title="Consulta (Funil)">
        <div className="rounded-[18px] bg-[var(--card)] p-6">
          Carregando consultas...
        </div>
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell title="Consulta (Funil)">
        <div className="rounded-[18px] border border-[var(--danger)]/20 bg-[var(--danger)]/10 p-6 text-[var(--danger)]">
          {error}
        </div>
      </AppShell>
    )
  }

  return (
  <AppShell title="Consulta (Funil)" statusIndicator={<LiveIndicator lastUpdated={lastUpdated} now={now} />}>
    <div className="space-y-5">
<section className={`rounded-[18px] border border-[color:var(--border)] bg-[var(--card)] p-4 text-[var(--foreground)] shadow-[var(--card-shadow)]`}>
  <div className="flex items-center gap-4">
 <div className="flex shrink-0 items-center justify-center">
  <ChartNoAxesCombined className="h-6 w-6 text-[var(--accent)]" />
</div>

  <div>
    <h2 className="text-[24px] font-black text-[var(--foreground)]">
      Visão geral dos atendimentos
    </h2>

    <p className="mt-1 text-sm font-semibold text-[var(--muted-foreground)]">
      Dados consolidados de todos os profissionais no período
    </p>
  </div>
  </div>

  <div className="mt-6 grid gap-3 md:grid-cols-4">
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

  <div className="mt-3 grid gap-3 xl:grid-cols-12">
  <div ref={colunaGraficosRef} className="min-w-0 space-y-3 xl:col-span-8">

    <div className="min-w-0 overflow-hidden rounded-[18px] border border-[color:var(--border)] bg-[var(--metric-card)] p-4">
  <div className="mb-3 flex items-center justify-between">
    <h3 className="text-[18px] font-black text-[var(--foreground)]">
      Atendimento por dia
    </h3>

    <div className="flex items-center gap-3 text-[11px] font-bold text-[var(--muted-foreground)]">
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
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fontWeight: 700, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'var(--metric-card)' }}
            contentStyle={{
              background: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--foreground)',
            }}
            formatter={(value: any) => [value, 'Atendimentos']}
          />
          <Bar dataKey="quantidade" radius={[6, 6, 0, 0]} maxBarSize={18} isAnimationActive={false} label={{ position: 'top', fontSize: 11, fontWeight: 900, fill: 'var(--foreground)' }}>
            {atendimentoPorDiaChart.map((item: any, index: number) => (
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
      <div className="flex h-full items-center justify-center text-[13px] font-semibold text-[var(--muted-foreground)]">
        Sem dados no período
      </div>
    )}
  </div>
</div>

   <div className="min-w-0 overflow-hidden rounded-[18px] border border-[color:var(--border)] bg-[var(--metric-card)] p-4">
  <h3 className="mb-3 text-[18px] font-black text-[var(--foreground)]">
    Evolução de faturamento
  </h3>

  <div className="mt-4 h-[170px] w-full">
    {evolucaoFaturamentoChart.length > 0 ? (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={evolucaoFaturamentoChart}
          margin={{ top: 16, right: 8, left: 8, bottom: 0 }}
        >
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fontWeight: 700, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'var(--metric-card)' }}
            contentStyle={{
              background: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--foreground)',
            }}
            formatter={(value: any) => [formatMoney(Number(value || 0)), 'Faturamento']}
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
              fontWeight: 900,
              fill: 'var(--foreground)',
              formatter: (value: any) => formatMoney(Number(value || 0)),
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    ) : (
      <div className="flex h-full items-center justify-center text-[13px] font-semibold text-[var(--muted-foreground)]">
        Sem dados no período
      </div>
    )}
  </div>
</div>

  </div>

<div className="flex min-h-0 min-w-0 flex-col gap-3 xl:col-span-4">

   <div
     className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[18px] border border-[color:var(--border)] bg-[var(--metric-card)] p-4 xl:max-h-[var(--altura-coluna-graficos)]"
     style={alturaColunaGraficos ? ({ '--altura-coluna-graficos': `${alturaColunaGraficos}px` } as React.CSSProperties) : undefined}
   >
  <h3 className="mb-4 shrink-0 text-[18px] font-black text-[var(--foreground)]">
    Origem dos agendamentos
  </h3>

  <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-2">
    {(painelAtendimento?.agendamentosPorOrigem || []).map((item: any) => {
      const maior = Math.max(
        ...(painelAtendimento?.agendamentosPorOrigem || []).map((x: any) => Number(x.quantidade || 0)),
        1
      )

      return (
        <div key={item.nome}>
          <div className="mb-1 flex items-center justify-between gap-3">
            <span className="truncate text-sm font-bold text-[var(--muted-foreground)]">
              {item.nome}
            </span>

            <span className="text-sm font-black text-[var(--foreground)]">
              {item.quantidade || 0}
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-[var(--progress-bg)]">
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
    <span className="text-sm font-bold text-[var(--muted-foreground)]">
      Total: <span className="font-black text-[var(--foreground)]">{totalAgendamentosOrigem}</span>
    </span>
  </div>
</div>

  </div>
</div>

<div className="mt-3 grid grid-cols-4 gap-3">
  <div className="rounded-[18px] border border-[color:var(--border)] bg-[var(--metric-card)] p-4">
    <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
      Finalizados
    </p>
    <p className="mt-2 text-[26px] font-black text-[var(--foreground)]">
      {painelAtendimento?.statusAgenda?.finalizados || 0}
    </p>
    {comparar && (
      <ComparativoBadge
        atual={painelAtendimento?.statusAgenda?.finalizados || 0}
        anterior={comparativo?.statusAgenda?.finalizadosAnterior}
      />
    )}
  </div>

  <div className="rounded-[18px] border border-[color:var(--border)] bg-[var(--metric-card)] p-4">
    <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
      No Show
    </p>
    <p className="mt-2 text-[26px] font-black text-[var(--foreground)]">
      {painelAtendimento?.statusAgenda?.noShow || 0}
    </p>
    {comparar && (
      <ComparativoBadge
        atual={painelAtendimento?.statusAgenda?.noShow || 0}
        anterior={comparativo?.statusAgenda?.noShowAnterior}
      />
    )}
  </div>

  <div className="rounded-[18px] border border-[color:var(--border)] bg-[var(--metric-card)] p-4">
    <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
      Reagendados
    </p>
    <p className="mt-2 text-[26px] font-black text-[var(--foreground)]">
      {painelAtendimento?.statusAgenda?.reagendados || 0}
    </p>
    {comparar && (
      <ComparativoBadge
        atual={painelAtendimento?.statusAgenda?.reagendados || 0}
        anterior={comparativo?.statusAgenda?.reagendadosAnterior}
      />
    )}
  </div>

  <div className="rounded-[18px] border border-[color:var(--border)] bg-[var(--metric-card)] p-4">
    <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
      Cancelados
    </p>
    <p className="mt-2 text-[26px] font-black text-[var(--foreground)]">
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

       <section className={`rounded-[18px] border border-[color:var(--border)] bg-[var(--card)] text-[var(--foreground)] shadow-[var(--card-shadow)] ${isImac ? 'p-4' : isApresentacao ? 'p-6' : 'p-5'}`}>
  <div className="mb-4 flex items-center gap-3">
    <Stethoscope className="h-6 w-6 text-[var(--accent)]" />
    <h2 className="text-[22px] font-black text-[var(--foreground)]">Consultas por médico</h2>
  </div>

  <div className="grid gap-6">
    {consultaPorMedico.map((medico: any) => {
  const infoMedico = getInfoMedico(medico.medico)

  const consultasGanhasMedico = Number(medico.quantidadeConsulta || 0)

const faturamentoMedico = Number(medico.valorConsulta || 0)

const ticketMedioMedico =
  consultasGanhasMedico > 0
    ? faturamentoMedico / consultasGanhasMedico
    : 0

    const vendaProcedimentoMedico = vendasPorMedico.find((item: any) => {
  const nomeVenda = item.nome
    ?.normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toUpperCase()
    .trim()

  const nomeMedico = medico.medico
    ?.normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toUpperCase()
    .trim()

  return nomeVenda === nomeMedico
})

const valorProcedimentosMedico = Number(vendaProcedimentoMedico?.valor || 0)

const quantidadeProcedimentosVendidos =
  vendaProcedimentoMedico?.produtos?.reduce(
    (acc: number, item: any) => acc + Number(item.qtd || 0),
    0
  ) || 0

const ticketProcedimentosMedico =
  quantidadeProcedimentosVendidos > 0
    ? valorProcedimentosMedico / quantidadeProcedimentosVendidos
    : 0

 const faturamentoConsolidado =
  faturamentoMedico + valorProcedimentosMedico


  return (
      <div
  key={medico.medico}
  className={`w-full rounded-[18px] border border-[color:var(--border)] bg-[var(--card)] ${
  isImac ? 'p-3' : isApresentacao ? 'p-4' : 'p-4'
}`}
>
      <div className="mb-4 flex items-center gap-4 border-b border-[color:var(--border)] pb-4">
          <div
  className={[
    isImac ? 'h-14 w-14' : isApresentacao ? 'h-20 w-20' : 'h-16 w-16',
    'shrink-0 overflow-hidden rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/10',
  ].join(' ')}
>

    {getFotoMedico(medico.medico) ? (
      <img
  src={getFotoMedico(medico.medico)!}
  alt={medico.medico}
  className="h-full w-full object-cover object-center"
/>
   ) : (
  <div className="flex h-full w-full items-center justify-center text-lg font-black text-[var(--accent)]">
    DR
  </div>
)}
  </div>

 <div className={`flex flex-1 gap-4 ${viewMode === 'iphone' ? 'flex-col' : 'items-center justify-between'}`}>
    <div className="flex flex-col justify-center">
  <h3 className={`${isImac ? 'text-[17px]' : isApresentacao ? 'text-[20px]' : 'text-[16px]'} font-black tracking-[-0.04em] text-[var(--foreground)]`}>
    {medico.medico}
  </h3>

  <p className={`mt-1 ${isImac ? 'text-[12px]' : isApresentacao ? 'text-[16px]' : 'text-[13px]'} font-semibold text-[var(--muted-foreground)]`}>
    {infoMedico.crm} • {infoMedico.especialidade}
  </p>
</div>

    <div className={isImac ? 'w-[140px] shrink-0' : isApresentacao ? 'w-[160px] shrink-0' : 'w-full shrink-0'}>
      <p className={`${isImac ? 'text-[10px]' : isApresentacao ? 'text-[12px]' : 'text-[11px]'} font-bold uppercase tracking-[0.06em] text-[var(--muted-foreground)]`}>
        Ocupação da agenda
      </p>

      {(() => {
        const ocupacao = medico.capacidadeAgenda || 0
        const corOcupacao =
          ocupacao >= 80
            ? 'text-[var(--success)]'
            : ocupacao >= 50
              ? 'text-[var(--warning)]'
              : 'text-[var(--danger)]'
        const barraOcupacao =
          ocupacao >= 80
            ? 'bg-[var(--success)]'
            : ocupacao >= 50
              ? 'bg-[var(--warning)]'
              : 'bg-[var(--danger)]'

        return (
          <>
            <p className={`mt-1 ${isImac ? 'text-[24px]' : isApresentacao ? 'text-[30px]' : 'text-[26px]'} font-black leading-none ${corOcupacao}`}>
              {ocupacao}%
            </p>

            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--progress-bg)]">
              <div
                className={`h-full rounded-full ${barraOcupacao}`}
                style={{
                  width: `${ocupacao}%`,
                }}
              />
            </div>
          </>
        )
      })()}
    </div>

  </div>
</div>

<div className={isImac ? 'grid grid-cols-12 gap-3' : isApresentacao ? 'space-y-4' : 'space-y-3'}>
  <div className={isImac ? 'col-span-12' : ''}>
  <h4 className="section-title mb-3">
    AGENDA
  </h4>

  <div className={isImac ? 'grid grid-cols-5 gap-3' : isApresentacao ? 'grid grid-cols-5 gap-2' : 'grid grid-cols-2 gap-2'}>
    <MetricMini
      label="Atendimentos"
      value={medico.atendimentos || 0}
      color="green"
      icon={UserCheck}
    />

    <MetricMini
      label="Retornos"
      value={medico.retornos || 0}
      color="blue"
      icon={RotateCcw}
    />

    <MetricMini
      label="No Show"
      value={medico.noShow || 0}
      color="pink"
      icon={UserX}
    />

    <MetricMini
      label="Cancelados"
      value={medico.cancelados || 0}
      color="red"
      icon={CalendarX2}
    />

    <MetricMini
      label="Reagendados"
      value={medico.reagendados || 0}
      color="darkRed"
      icon={CalendarClock}
    />
  </div>

    <div className={`mt-3 ${isImac ? `grid ${medico.medico?.toUpperCase().includes('BRENO') ? 'grid-cols-4' : 'grid-cols-3'} gap-3` : isApresentacao ? 'grid grid-cols-3 gap-2' : 'grid grid-cols-1 gap-2'}`}>
   <MetricCard
  icon={TrendingUp}
  label="Consultas 1ª vez"
  value={medico.consultasPrimeiraVez || 0}
  description=""
  tone="green"
/>

    <MetricCard
  icon={Stethoscope}
  label="Procedimentos realizados"
  value={medico.procedimentos || 0}
  description=""
  tone="blue"
/>

{!medico.medico?.toUpperCase().includes('BRENO') && (
  <MetricCard
    icon={Handshake}
    label="Cirurgias realizadas"
    value={medico.cirurgias || 0}
    description=""
    tone="purple"

  />
)}

  {medico.medico?.toUpperCase().includes('BRENO') && (
  <>
    <MetricCard
      icon={CircleDollarSign}
      label="Injetáveis vendidos"
      value={
        <>
          <span>{medico.injetaveisVendidos || 0}</span>

          <span className="ml-auto">
            {formatMoney(medico.valorInjetaveisVendidos || 0)}
          </span>
        </>
      }
      description=""
      tone="red"
    />

    <MetricCard
      icon={ClipboardList}
      label="Protocolos vendidos"
      value={
        <>
          <span>{medico.protocolosVendidos || 0}</span>

          <span className="ml-auto">
            {formatMoney(medico.valorProtocolosVendidos || 0)}
          </span>
        </>
      }
      description=""
      tone="purple"
    />
  </>
)}
 </div>
</div>

  <div className={`border-t border-[color:var(--border)] pt-4 mt-4 ${isImac ? 'col-span-12' : ''}`}>
    <h4 className="section-title mb-4">
FINANCEIRO
</h4>


  <div className={isImac ? 'grid grid-cols-2 gap-4' : 'grid grid-cols-1 gap-4'}>
    <div>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--muted-foreground)]">Consultas</p>
      <div className={viewMode === 'iphone' ? 'grid grid-cols-1 gap-2' : 'grid grid-cols-3 gap-2'}>
        <MetricCard icon={TrendingUp} label="Qtd. consultas" value={consultasGanhasMedico} description="" tone="green" />
        <MetricCard icon={CircleDollarSign} label="Venda consultas" value={formatMoney(faturamentoMedico)} description="" tone="green" />
        <MetricCard icon={Ticket} label="Ticket consultas" value={formatMoney(ticketMedioMedico)} description="" tone="green" empty={consultasGanhasMedico === 0} />
      </div>
    </div>

    <div className={isImac ? 'border-l border-[color:var(--border)] pl-4' : 'border-t border-[color:var(--border)] pt-4'}>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--muted-foreground)]">Procedimentos</p>
      <div className={viewMode === 'iphone' ? 'grid grid-cols-1 gap-2' : 'grid grid-cols-3 gap-2'}>
        <MetricCard icon={Stethoscope} label="Qtd. procedimentos" value={quantidadeProcedimentosVendidos} description="" tone="blue" />
        <MetricCard icon={CircleDollarSign} label="Venda procedimentos" value={formatMoney(valorProcedimentosMedico)} description="" tone="blue" />
        <MetricCard icon={Ticket} label="Ticket procedimentos" value={formatMoney(ticketProcedimentosMedico)} description="" tone="blue" empty={quantidadeProcedimentosVendidos === 0} />
      </div>
    </div>
  </div>
</div>

<div className={`border-t border-[color:var(--border)] pt-4 mt-4 ${isImac ? 'col-span-12' : ''}`}>
  <h4 className="section-title mb-4">
CONSOLIDADO
</h4>

  {(() => {
    const metaConsolidada = Number(vendaProcedimentoMedico?.meta || 0)

    const percentualConsolidado =
      metaConsolidada > 0
        ? Math.round((faturamentoConsolidado / metaConsolidada) * 100)
        : 0

    if (metaConsolidada === 0) {
      return (
        <>
          <p className="text-[30px] font-black text-[var(--muted-foreground)]/40">
            —
          </p>
          <p className="mt-2 text-[13px] font-semibold text-[var(--muted-foreground)]">
            Sem meta definida para este médico
          </p>
        </>
      )
    }

    return (
      <>
        <p className="text-[30px] font-black text-[var(--foreground)]">
          {formatMoney(faturamentoConsolidado)}
        </p>

        <div className="mt-3 h-3 overflow-hidden rounded-full bg-[var(--progress-bg)]">
          <div
  className={`h-full rounded-full ${
    percentualConsolidado >= 100
      ? 'bg-[var(--success)]'
      : percentualConsolidado >= 50
      ? 'bg-[var(--warning)]'
      : 'bg-[var(--danger)]'
  }`}
  style={{
    width: `${Math.min(percentualConsolidado, 100)}%`,
  }}
/>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-[16px] font-bold text-[var(--muted-foreground)]">
  Meta {formatMoney(metaConsolidada)}
</span>

<span
  className={`text-[22px] font-black ${
    percentualConsolidado >= 100
      ? 'text-[var(--success)]'
      : percentualConsolidado >= 50
      ? 'text-[var(--warning)]'
      : 'text-[var(--danger)]'
  }`}
>
  {percentualConsolidado}%
</span>
        </div>
      </>
    )
  })()}
</div>
</div>
</div>
)
})}
</div>
</section>
 </div>
    </AppShell>
  )
}
function MetricMini({
  label,
  value,
  color = 'blue',
  icon: Icon,
  bordered = true,
}: {
  label: string
  value: number | string
  color?: 'blue' | 'red' | 'green' | 'orange' | 'pink' | 'darkRed'
  icon?: any
  bordered?: boolean
}) {
  const { viewMode } = useFilters()
  const isImac = viewMode === 'desktop'
  const isApresentacao = viewMode === 'apresentacao'
  const textColors = {
    blue: 'text-[var(--accent)]',
    orange: 'text-[var(--accent)]',
    green: 'text-[var(--success)]',
    pink: 'text-[var(--danger)]',
    red: 'text-[var(--danger)]',
    darkRed: 'text-[var(--danger)]',
  }

  return (
  <div
    className={`rounded-[18px] text-center shadow-none ${textColors[color]} ${
      bordered ? 'border border-[color:var(--border)] bg-[var(--metric-card)]' : ''
    } ${
      isImac ? 'px-3 py-2' : isApresentacao ? 'p-4' : 'p-3'
    }`}
  >
    <div
      className={`${
        isImac
          ? 'flex flex-col items-center justify-center gap-1'
          : 'flex flex-col items-center justify-center gap-2'
      }`}
    >
      {Icon && (
        <Icon className={`${isImac ? 'h-4 w-4' : isApresentacao ? 'h-6 w-6' : 'h-5 w-5'}`} />
      )}

      <p
        className={`w-full break-words ${
          isImac ? 'text-[10px]' : isApresentacao ? 'text-[18px]' : 'text-[12px]'
        } font-black uppercase tracking-[0.08em] text-[var(--foreground)]`}
      >
        {label}
      </p>
    </div>

    <p
      className={`mt-2 ${
        isImac ? 'text-[18px]' : isApresentacao ? 'text-[34px]' : 'text-[24px]'
      } font-black text-[var(--foreground)]`}
    >
      {value}
    </p>
  </div>
)
}

function ComparativoBadge({ atual, anterior }: { atual: number; anterior?: number }) {
  const base = Number(anterior || 0)
  const diff = base > 0 ? Math.round(((atual - base) / base) * 100) : 0
  const positivo = diff > 0
  const negativo = diff < 0

  return (
    <div className="mt-2 flex items-center gap-2 text-[12px] font-black">
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

      <span className="text-[var(--muted-foreground)]">vs anterior</span>
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
  showCompare = false,
  empty = false,
}: {
  icon: any
  label: string
  value: any
  description: string
  tone?: 'blue' | 'green' | 'red' | 'purple'
  previousValue?: number
  showCompare?: boolean
  empty?: boolean
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
  typeof value === 'string'
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
      <div className={`relative z-0 hover:z-10 flex h-full flex-col rounded-[18px] shadow-none px-3 py-2 ${tones[tone]}`}>
        <div className={`flex items-center gap-2 ${labelMinH}`}>
          <Icon className={`h-5 w-5 shrink-0 ${iconColors[tone]}`} />
          <p className={`${isImac ? 'text-[15px]' : isApresentacao ? 'text-[20px]' : 'text-[15px]'} font-black text-[var(--foreground)]`}>{label}</p>
        </div>

        <div className="mt-3">
          <div className={`${isImac ? 'text-[20px]' : isApresentacao ? 'text-[34px]' : 'text-[24px]'} font-black leading-none text-[var(--muted-foreground)]/40`}>
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
    <div className={`relative z-0 hover:z-10 flex h-full flex-col rounded-[18px] shadow-none px-3 py-2 ${tones[tone]}`}>
      <div className={`flex items-center gap-2 ${labelMinH}`}>
        <Icon className={`h-5 w-5 shrink-0 ${iconColors[tone]}`} />
       <p className={`${isImac ? 'text-[15px]' : isApresentacao ? 'text-[20px]' : 'text-[15px]'} font-black text-[var(--foreground)]`}>{label}</p>
      </div>

      <div className="mt-3">
  <div>
    <div className={`flex w-full items-center justify-between ${isImac ? 'text-[20px]' : isApresentacao ? 'text-[34px]' : 'text-[24px]'} font-black leading-none text-[var(--foreground)]`}>
      {value}
    </div>

   {description && (
  <p className={`mt-2 ${isImac ? 'text-[12px]' : isApresentacao ? 'text-[18px]' : 'text-[13px]'} font-medium text-[var(--muted-foreground)]`}>
    {description}
  </p>
)}

{showCompare && (
  <div className="mt-2 flex items-center gap-2 text-[12px] font-black">
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
      vs anterior
    </span>
  </div>
)}
  </div>

  {/* gráfico removido */}
</div>
    </div>
  )
}