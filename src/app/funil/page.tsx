'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { useFilters } from '@/store/use-filters'
import {
  CircleDollarSign,
  TrendingUp,
  Target,
  Megaphone,
  Stethoscope,
  CalendarDays,
  UserX,
  UserCheck,
  RotateCcw,
  Ticket,
  Handshake,
  ClipboardList,
  Sun,
  CalendarCheck2,
CalendarX2,
CalendarClock,
} from 'lucide-react'

import { Cell, Pie, PieChart, ResponsiveContainer, LineChart, Line } from 'recharts'

type DashboardResponse = {
  ok: boolean
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
evolucaoConsulta?: number[]
evolucaoProcedimentos?: number[]
evolucaoCirurgias?: number[]
injetaveisVendidos?: number
valorInjetaveisVendidos?: number
protocolosVendidos?: number
valorProtocolosVendidos?: number
evolucaoInjetaveis?: number[]
evolucaoProtocolos?: number[]
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

  campanhasConsulta?: {
    nome: string
    qtd: number
    valor: number
    percentual: number
  }[]

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

function formatMoney(v: number) {
  return v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })
}
const fotosMedicos: Record<string, string> = {
  'DR. RODOLPHO REIS': '/medicos/rodolpho.png',
  'DRA. CLAUDIA LAMEIRA': '/medicos/claudia.png',
  'DR. BRENO PITANGUI': '/medicos/breno.png',
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
    nome: 'Jéssica Maria',
    especialidade: 'Fisioterapia',
    imagem: '/jessica.png',
  }
}

  return { crm: 'CRM não informado', especialidade: 'Especialidade não informada' }
}

export default function FunilPage() {
  const { periodo, tipoData, segmento, dataInicio, dataFim, viewMode } = useFilters()
const isImac = viewMode === 'desktop'

  const [data, setData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [visaoFinanceira, setVisaoFinanceira] = useState<
  'consulta' | 'procedimentos' | 'consolidado'
>('consulta')

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)

        let url = `/api/test?periodo=${periodo}&tipo=${tipoData}&segmento=${segmento}`

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

        setData(json)
      } catch (err: any) {
        setError(err.message || 'Erro inesperado')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [periodo, tipoData, segmento, dataInicio, dataFim])

  const consulta = data?.kpis?.comercialConsulta
  const campanhasConsulta = data?.campanhasConsulta || []
  const vendasPorMedico = data?.vendasPorMedico || []
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
  const atendimentoConsulta = data?.atendimentoConsulta || []
  const conveniosConsulta = data?.conveniosConsulta || []

  if (loading) {
    return (
      <AppShell title="Consulta (Funil)">
        <div className="rounded-[28px] bg-[var(--card)] p-6">
          Carregando consultas...
        </div>
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell title="Consulta (Funil)">
        <div className="rounded-[28px] border border-red-500/20 bg-red-500/10 p-6 text-red-300">
          {error}
        </div>
      </AppShell>
    )
  }

  return (
  <AppShell title="Consulta (Funil)">
    <div className="space-y-8">

      <div className="space-y-6">
  <ResumoSection
  title="Fechamentos"
  extra={
    <div className="flex overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[var(--card)]">
      {[
        ['consulta', 'Consultas'],
        ['procedimentos', 'Procedimentos'],
        ['consolidado', 'Consolidado'],
      ].map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => setVisaoFinanceira(key as any)}
          className={`px-6 py-3 text-sm font-black transition-all ${
            visaoFinanceira === key
              ? 'bg-[#D7B46A] text-white'
              : 'text-[var(--muted-foreground)]'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  }
>
  {visaoFinanceira === 'consulta' && (
    <>
     <ResumoCard icon={ClipboardList} label="Quantidade de consulta" value={data?.kpis?.comercialConsulta?.quantidadeConsulta || 0} />
<ResumoCard icon={CircleDollarSign} label="Valor de consulta" value={formatMoney(data?.kpis?.comercialConsulta?.valorTotalConsulta || 0)} />
<ResumoCard icon={TrendingUp} label="Ticket médio" value={formatMoney(data?.kpis?.comercialConsulta?.ticketMedioConsulta || 0)} />
    </>
  )}

  {visaoFinanceira === 'procedimentos' && (
    <>
      <ResumoCard icon={Stethoscope} label="Quantidade de procedimentos" value={data?.kpis?.comercialVendas?.propostasFechadas || 0} />
<ResumoCard icon={CircleDollarSign} label="Valor de procedimentos" value={formatMoney(data?.kpis?.comercialVendas?.valorTotalVendas || 0)} />
<ResumoCard icon={TrendingUp} label="Ticket médio" value={formatMoney(data?.kpis?.comercialVendas?.ticketMedioVendas || 0)} />
    </>
  )}

  {visaoFinanceira === 'consolidado' && (
    <>
      <ResumoCard
  icon={Handshake}
  label="Quantidade total de vendas"
  value={(data?.kpis?.comercialConsulta?.quantidadeConsulta || 0) + (data?.kpis?.comercialVendas?.propostasFechadas || 0)}
/>

      <ResumoCardMeta
        dot="gold"
        label="Total do valor de venda"
        value={(data?.kpis?.comercialConsulta?.valorTotalConsulta || 0) + (data?.kpis?.comercialVendas?.valorTotalVendas || 0)}
        meta={data?.consolidado?.metaValorVendas || 0}
        isMoney
      />

      <ResumoCardMeta
        dot="green"
        label="Ticket médio total"
        value={
          ((data?.kpis?.comercialConsulta?.valorTotalConsulta || 0) + (data?.kpis?.comercialVendas?.valorTotalVendas || 0)) /
          Math.max((data?.kpis?.comercialConsulta?.quantidadeConsulta || 0) + (data?.kpis?.comercialVendas?.propostasFechadas || 0), 1)
        }
        meta={data?.consolidado?.metaTicketMedio || 0}
        isMoney
      />
    </>
  )}
</ResumoSection>
</div>

       <section className={`rounded-[30px] border border-[color:var(--border)] bg-[var(--card)] text-[var(--foreground)] shadow-[var(--card-shadow)] ${isImac ? 'p-4' : 'p-6'}`}>
  <div className="mb-6 flex items-center gap-3">
    <Stethoscope className="h-6 w-6 text-[var(--accent)]" />
    <h2 className="text-[26px] font-black text-[var(--foreground)]">Consultas por médico</h2>
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

  const movimentacoesAgenda = [
  { nome: 'Finalizados', valor: medico.atendimentos || 0, cor: '#10B981' },
  { nome: 'No Show', valor: medico.noShow || 0, cor: '#EC4899' },
  { nome: 'Cancelados', valor: medico.cancelados || 0, cor: '#E00000' },
  { nome: 'Reagendados', valor: medico.reagendados || 0, cor: '#8B0000' },
]

const faturamentoConsolidado =
  faturamentoMedico + valorProcedimentosMedico

const totalMovimentacoes = movimentacoesAgenda.reduce(
  (acc, item) => acc + item.valor,
  0
)


  return (
      <div
        key={medico.medico}
        className={`rounded-[28px] border border-[color:var(--border)] bg-[var(--background)] ${isImac ? 'p-4' : 'p-6'}`}
      >
        <div className="mb-4 flex items-center gap-4">
  <div className={`${isImac ? 'h-24 w-24' : 'h-28 w-28'} shrink-0 overflow-hidden rounded-full border border-[#D7B46A]/40 bg-[#D7B46A]/10`}>
    {getFotoMedico(medico.medico) ? (
      <img
        src={getFotoMedico(medico.medico) || ''}
        alt=""
        className="block h-full w-full object-cover"
      />
   ) : (
  <div className="flex h-full w-full items-center justify-center text-lg font-black text-[#D7B46A]">
    DR
  </div>
)}
  </div>

 <div className="flex-1">
  <div className="flex items-start justify-between gap-4">
    
    <div>
      <h3 className={`${isImac ? 'text-[22px]' : 'text-[25px]'} font-black tracking-[-0.04em] text-[var(--foreground)]`}>
        {medico.medico}
      </h3>

      <p className={`mt-1 ${isImac ? 'text-[16px]' : 'text-[20px]'} font-semibold text-[var(--muted-foreground)]`}>
  {infoMedico.crm} • {infoMedico.especialidade}
</p>

      <div className={`mt-4 flex flex-wrap items-center ${isImac ? 'gap-4 text-[18px]' : 'gap-6 text-[22px]'} font-semibold`}>
        <span className="flex items-center gap-1 text-blue-500">
  <CalendarDays className="h-6 w-6" />
  {medico.atendimentos || 0} atendimentos finalizados
</span>

        <span className="flex items-center gap-1 text-emerald-500">
          <UserCheck className="h-6 w-6" />
          {medico.quantidadeConsulta} consultas ganhas
        </span>

      {medico.medico?.toUpperCase().includes('RODOLPHO') ||
medico.medico?.toUpperCase().includes('CLAUDIA') ? (
  <span className="flex items-center gap-1 text-violet-500">
    <Handshake className="h-6 w-6" />
    {medico.cirurgias || 0} cirurgias
  </span>
) : (
  <span className="flex items-center gap-1 text-violet-500">
    <Stethoscope className="h-6 w-6" />
    {medico.procedimentos || 0} procedimentos
  </span>
)}
      </div>
    </div>

    <div className="min-w-[150px]">
      <p className="text-sm text-[var(--muted-foreground)]">
        Ocupação da agenda
      </p>

      <p className="mt-1 text-5xl font-black text-emerald-500">
        {medico.capacidadeAgenda || 0}%
      </p>

      <div className="mt-3 h-3 overflow-hidden rounded-full bg-[var(--progress-bg)]">
        <div
          className="h-full rounded-full bg-emerald-500"
          style={{
            width: `${medico.capacidadeAgenda || 0}%`,
          }}
        />
      </div>
    </div>

  </div>
</div>
</div>

<div className={isImac ? 'grid grid-cols-12 gap-3' : 'space-y-4'}>
  <div className={`rounded-[24px] border border-[color:var(--border)] bg-[var(--card)] ${isImac ? 'col-span-4 p-4' : 'px-4 py-3'}`}>
    <h4 className="mb-3 text-[22px] font-black text-[var(--foreground)]">
  AGENDA
</h4>

    <div className={isImac ? 'grid grid-cols-4 gap-3' : 'grid gap-3 md:grid-cols-4'}>
  <MetricMini
    label="Manhã"
    value={medico.manha || 0}
    color="blue"
    icon={Sun}
  />

  <MetricMini
    label="Tarde"
    value={medico.tarde || 0}
    color="orange"
    icon={Sun}
  />

  <MetricMini
    label="Ocupação"
    value={`${medico.capacidadeAgenda || 0}%`}
    color="green"
    icon={CalendarCheck2}
  />


  <MetricMini
    label="Retornos"
    value={medico.retornos || 0}
    color="blue"
    icon={RotateCcw}
  />
</div>
  </div>

  {isImac && (
  <div className="col-span-8 rounded-[24px] border border-[color:var(--border)] bg-[var(--card)] px-4 py-3">
    <h4 className="mb-3 text-[20px] font-black text-[var(--foreground)]">
      MOVIMENTAÇÕES DA AGENDA
    </h4>

    <div className="grid grid-cols-4 gap-3">
      <MetricMini label="No Show" value={medico.noShow || 0} color="pink" icon={UserX} />
      <MetricMini label="Cancelados" value={medico.cancelados || 0} color="red" icon={CalendarX2} />
      <MetricMini label="Reagendados" value={medico.reagendados || 0} color="darkRed" icon={CalendarClock} />
      <MetricMini label="Finalizados" value={medico.atendimentos || 0} color="green" icon={UserCheck} />
    </div>
  </div>
)}

  <div className={isImac ? 'col-span-12 grid grid-cols-4 gap-3' : 'grid gap-3 md:grid-cols-2'}>
   <MetricCard
  icon={TrendingUp}
  label="Consultas 1ª vez"
  value={medico.consultasPrimeiraVez || 0}
  description="Consultas finalizadas"
  tone="green"
  chart={medico.evolucaoConsultaPrimeiraVez}
  chartColor="var(--chart-green)"
/>

    <MetricCard
  icon={Stethoscope}
  label="Procedimentos realizados"
  value={medico.procedimentos || 0}
  description=""
  tone="blue"
  chart={medico.evolucaoProcedimentos}
  chartColor="var(--chart-blue)"
/>

{!medico.medico?.toUpperCase().includes('BRENO') && (
  <MetricCard
    icon={Handshake}
    label="Cirurgias realizadas"
    value={medico.cirurgias || 0}
    description=""
    tone="purple"
    chart={medico.evolucaoCirurgias}
    chartColor="var(--chart-red)"
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
      chart={medico.evolucaoInjetaveis}
      chartColor="var(--chart-green)"
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
      chart={medico.evolucaoProtocolos}
      chartColor="var(--chart-orange)"
    />
  </>
)}


 </div>

  <div className={`rounded-[24px] border border-[color:var(--border)] bg-[var(--card)] ${isImac ? 'col-span-6 p-4' : 'p-5'}`}>
    <h4 className="mb-4 text-[22px] font-black text-[var(--foreground)]">
  FINANCEIRO
</h4>


  {/* CONSULTAS */}

<div className="grid gap-3 md:grid-cols-3">
  <MetricCard
    icon={TrendingUp}
    label="Qtd. consultas"
    value={consultasGanhasMedico}
    description=""
    tone="green"
  />

  <MetricCard
    icon={CircleDollarSign}
    label="Venda consultas"
    value={formatMoney(faturamentoMedico)}
    description=""
    tone="green"
  />

  <MetricCard
    icon={Ticket}
    label="Ticket consultas"
    value={formatMoney(ticketMedioMedico)}
    description=""
    tone="green"
  />
</div>

{/* PROCEDIMENTOS */}

<div className="mt-2 grid gap-3 md:grid-cols-3">
  <MetricCard
    icon={Stethoscope}
    label="Qtd. procedimentos"
    value={quantidadeProcedimentosVendidos}
    description=""
    tone="blue"
  />

  <MetricCard
    icon={CircleDollarSign}
    label="Venda procedimentos"
    value={formatMoney(valorProcedimentosMedico)}
    description=""
    tone="blue"
  />

  <MetricCard
    icon={Ticket}
    label="Ticket procedimentos"
    value={formatMoney(ticketProcedimentosMedico)}
    description=""
    tone="blue"
  />

</div>
</div>

<div className={`rounded-[24px] border border-[color:var(--border)] bg-[var(--card)] ${isImac ? 'col-span-6 px-4 py-3' : 'p-5'}`}>
  <h4 className="mb-4 text-[22px] font-black text-[var(--foreground)]">
  CONSOLIDADO
</h4>

  {(() => {
    const metaConsolidada = Number(vendaProcedimentoMedico?.meta || 0)

    const percentualConsolidado =
      metaConsolidada > 0
        ? Math.round((faturamentoConsolidado / metaConsolidada) * 100)
        : 0

    return (
      <>
        <p className="text-[36px] font-black text-[var(--foreground)]">
          {formatMoney(faturamentoConsolidado)}
        </p>

        <div className="mt-3 h-3 overflow-hidden rounded-full bg-[var(--progress-bg)]">
          <div
  className={`h-full rounded-full ${
    percentualConsolidado >= 100
      ? 'bg-emerald-500'
      : percentualConsolidado >= 50
      ? 'bg-yellow-400'
      : 'bg-red-500'
  }`}
  style={{
    width: `${Math.min(percentualConsolidado, 100)}%`,
  }}
/>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-xl font-bold text-[var(--muted-foreground)]">
  Meta {formatMoney(metaConsolidada)}
</span>

<span
  className={`text-2xl font-black ${
    percentualConsolidado >= 100
      ? 'text-emerald-500'
      : percentualConsolidado >= 50
      ? 'text-yellow-500'
      : 'text-red-500'
  }`}
>
  {percentualConsolidado}%
</span>
        </div>
      </>
    )
  })()}
</div>
   {!isImac && (
   <div className={`rounded-[24px] border border-[color:var(--border)] bg-[var(--card)] ${isImac ? 'col-span-12 p-4' : 'p-5'}`}>
   <h4 className="mb-4 text-[22px] font-black text-[var(--foreground)]">
  MOVIMENTAÇÕES DA AGENDA
</h4>

    <div className={isImac ? 'grid grid-cols-[1fr_360px] items-center gap-4' : 'grid items-center gap-6 lg:grid-cols-[1fr_360px]'}>
      <div className="grid gap-3 md:grid-cols-3">
        <MetricMini label="No Show" value={medico.noShow || 0} color="pink" icon={UserX} />
        <MetricMini label="Cancelados" value={medico.cancelados || 0} color="red" icon={CalendarX2} />
        <MetricMini label="Reagendados" value={medico.reagendados || 0} color="darkRed" icon={CalendarClock} />
      </div>

      <div className="ml-auto flex items-center gap-6">
        <div className={isImac ? 'h-[130px] w-[130px]' : 'h-[160px] w-[160px]'}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={totalMovimentacoes > 0 ? movimentacoesAgenda : [{ nome: 'Sem dados', valor: 1, cor: '#E5E7EB' }]}
                dataKey="valor"
                nameKey="nome"
                innerRadius={42}
                outerRadius={68}
                paddingAngle={3}
                stroke="transparent"
              >
                {(totalMovimentacoes > 0 ? movimentacoesAgenda : [{ nome: 'Sem dados', valor: 1, cor: '#E5E7EB' }]).map((item) => (
                  <Cell key={item.nome} fill={item.cor} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col gap-3">
          {movimentacoesAgenda.map((item) => (
            <div key={item.nome} className="flex items-center gap-3">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: item.cor }}
              />

              <span className="text-sm font-semibold text-[var(--muted-foreground)]">
  {item.nome}
</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>)}
</div>
</div>
)
})}
</div>
</section>

  

<section className="grid gap-6 xl:grid-cols-2">

  

  </section>
 </div>
    </AppShell>
  )
}
function ResumoSection({
  title,
  children,
  extra,
}: any) {
  return (
  <div className="rounded-[30px] border border-[color:var(--border)] bg-[var(--card)] p-8 shadow-[var(--card-shadow)]">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-[8px] rounded-full bg-[#D7B46A]" />

          <h3 className="text-[28px] font-black text-[var(--foreground)]">
            {title}
          </h3>
        </div>

        {extra}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {children}
      </div>
    </div>
  )
}

function ResumoCard({ label, value, icon: Icon }: any) {
  return (
   <div className="rounded-[24px] border border-[color:var(--border)] bg-[var(--metric-card)] p-6">
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[var(--icon-bg)]">
          <Icon className="h-7 w-7 text-[#D7B46A]" />
        </div>

        <p className="text-[20px] font-black leading-tight text-[var(--foreground)]">
          {label}
        </p>
      </div>

      <p className="text-[48px] font-black leading-none text-[var(--foreground)]">
  {value}
</p>

<p className="mt-4 text-[24px] font-semibold text-[var(--muted-foreground)]">
  fechamentos no período
</p>
    </div>
  )
}

function ResumoCardMeta({ label, value, meta, dot, isMoney }: any) {
  const percentual = meta > 0 ? Math.round((value / meta) * 100) : 0

  const dots: any = {
  blue: 'bg-[#0EA5E9]',
  gold: 'bg-[#D7B46A]',
  green: 'bg-[#10B981]',
}

  const cor =
    percentual >= 100
      ? 'bg-emerald-500 text-emerald-500'
      : percentual >= 50
      ? 'bg-yellow-400 text-yellow-500'
      : 'bg-red-500 text-red-500'

  return (
    <div className="rounded-[24px] border border-[color:var(--border)] bg-[var(--metric-card)] p-6">
      <div className="mb-6 flex items-center gap-3">
  <span className={`h-3 w-3 rounded-full ${dots[dot]}`} />

  <p className="text-[18px] font-black text-[var(--foreground)]">
    {label}
  </p>
</div>

<p className="text-[48px] font-black leading-none text-[var(--foreground)]">
  {isMoney ? formatMoney(value) : value}
</p>

   <div className="mt-6 h-6 overflow-hidden rounded-full bg-[var(--progress-bg)]">
        <div
          className={`h-full rounded-full ${cor.split(' ')[0]}`}
          style={{ width: `${Math.min(percentual, 100)}%` }}
        />
      </div>

     <div className="mt-4 flex items-center justify-between">
  <span className="text-[24px] font-bold text-[var(--muted-foreground)]">
    Meta {isMoney ? formatMoney(meta) : meta}
  </span>

  <span
    className={`text-[34px] font-black ${cor.split(' ')[1]}`}
  >
    {percentual}%
  </span>
</div>
    </div>
  )
}

function MiniLine({ data, color = '#2563EB' }: { data?: number[]; color?: string }) {
  const chartData = (data || []).map((value, index) => ({
    name: index,
    value,
  }))

  if (!chartData.length) return null

  return (
    <div className="h-[54px] w-full px-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function CardMini({
  icon: Icon,
  title,
  value,
  subtitle,
  statusClass,
}: any) {
  return (
    <div
      className={`rounded-[24px] border border-[color:var(--border)] p-5 shadow-[var(--card-shadow)] ${
        statusClass || 'bg-[var(--metric-card)]'
      }`}
    >
      <div className="mb-3 flex items-center gap-2">
        <Icon size={14} className="text-[var(--accent)]" />

        <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
          {title}
        </p>
      </div>

      <h3 className={`text-4xl font-black tracking-[-0.05em] text-[var(--foreground)]`}>
        {value}
      </h3>

      {subtitle && (
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          {subtitle}
        </p>
      )}
    </div>
  )
}
function MetricMini({
  label,
  value,
  color = 'blue',
  icon: Icon,
}: {
  label: string
  value: number | string
  color?: 'blue' | 'red' | 'green' | 'orange' | 'pink' | 'darkRed'
  icon?: any
}) {
  const { viewMode } = useFilters()
  const isImac = viewMode === 'desktop'
  const colors = {
   blue: 'border border-[color:var(--border)] bg-[var(--metric-card)] text-[var(--chart-blue)]',
orange: 'border border-[color:var(--border)] bg-[var(--metric-card)] text-[var(--chart-orange)]',
green: 'border border-[color:var(--border)] bg-[var(--metric-card)] text-[var(--chart-green)]',
pink: 'border border-[color:var(--border)] bg-[var(--metric-card)] text-[var(--chart-pink)]',
red: 'border border-[color:var(--border)] bg-[var(--metric-card)] text-[var(--chart-red)]',
darkRed: 'border border-[color:var(--border)] bg-[var(--metric-card)] text-[var(--chart-darkRed)]',
  }

  return (
    <div className={`rounded-[16px] text-center shadow-none ${isImac ? 'px-2 py-2' : 'px-4 py-5'} ${colors[color]}`}>
      <div className="flex items-center justify-center gap-2">
        {Icon && <Icon className="h-4 w-4" />}
       <p className={`${isImac ? 'text-[13px]' : 'text-[20px]'} font-black uppercase tracking-[0.08em] text-[var(--foreground)]`}>
  {label}
</p>
      </div>

      <p className={`mt-2 ${isImac ? 'text-[26px]' : 'text-[42px]'} font-black text-[var(--foreground)]`}>{value}</p>
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  chart,
chartColor,
  description,
  tone = 'blue',
  
}: {
  icon: any
  label: string
  value: any
  description: string
  tone?: 'blue' | 'green' | 'red' | 'purple'
  chart?: number[]
  chartColor?: string
}) {

  const { viewMode } = useFilters()
  const isImac = viewMode === 'desktop'
  const tones = {
    blue:
'border border-[color:var(--border)] bg-[var(--metric-card)]',

green:
'border border-[color:var(--border)] bg-[var(--metric-card)]',

red:
'border border-[color:var(--border)] bg-[var(--metric-card)]',

purple:
'border border-[color:var(--border)] bg-[var(--metric-card)]',
  }

  const iconColors = {
  blue: 'text-[var(--chart-blue)]',
  green: 'text-[var(--chart-green)]',
  red: 'text-[var(--chart-red)]',
  purple: 'text-[var(--chart-purple)]',
}


  return (
    <div className={`rounded-[16px] shadow-none ${isImac ? 'px-3 py-2' : 'p-5'} ${tones[tone]}`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-6 w-5 ${iconColors[tone]}`} />
       <p className={`${isImac ? 'text-[16px]' : 'text-[20px]'} font-black text-[var(--foreground)]`}>{label}</p>
      </div>

      <div className="mt-3">
  <div>
    <div className={`flex w-full items-center justify-between ${isImac ? 'text-[24px]' : 'text-[34px]'} font-black leading-none text-[var(--foreground)]`}>
      {value}
    </div>

   <p className={`mt-2 ${isImac ? 'text-[14px]' : 'text-[19px]'} font-medium text-[var(--muted-foreground)]`}>
  {description}
</p>
  </div>

  {chart && (
    <div className="w-full">
      <MiniLine data={chart} color={chartColor} />
    </div>
  )}
</div>
    </div>
  )
}