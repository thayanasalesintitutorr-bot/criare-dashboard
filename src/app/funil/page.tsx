'use client'

import { useEffect, useState } from 'react'
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
} from 'lucide-react'

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
    consulta?: {
      quantidadeAnterior: number
      valorAnterior: number
      ticketAnterior: number
    }
    procedimentos?: {
      quantidadeAnteriorProcedimentos: number
      valorAnteriorProcedimentos: number
      ticketAnteriorProcedimentos: number
    }
    consolidado?: {
      quantidadeAnteriorConsolidado: number
      valorAnteriorConsolidado: number
      ticketAnteriorConsolidado: number
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
    <div className="space-y-5">

    <div className="space-y-5">
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
          className={`px-5 py-2.5 text-sm font-black transition-all ${
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
    <ResumoCard
  icon={ClipboardList}
  label="Quantidade de consulta"
  value={data?.kpis?.comercialConsulta?.quantidadeTotal || 0}
  rawValue={data?.kpis?.comercialConsulta?.quantidadeTotal || 0}
  previousValue={data?.comparativo?.consulta?.quantidadeAnterior || 0}
/>

<ResumoCard
  icon={CircleDollarSign}
  label="Valor de consulta"
  value={formatMoney(data?.kpis?.comercialConsulta?.valorTotal || 0)}
  rawValue={data?.kpis?.comercialConsulta?.valorTotal || 0}
  previousValue={data?.comparativo?.consulta?.valorAnterior || 0}
/>

<ResumoCard
  icon={TrendingUp}
  label="Ticket médio"
  value={formatMoney(data?.kpis?.comercialConsulta?.ticketMedioTotal || 0)}
  rawValue={data?.kpis?.comercialConsulta?.ticketMedioTotal || 0}
  previousValue={data?.comparativo?.consulta?.ticketAnterior || 0}
/>
  </>
)}

{visaoFinanceira === 'procedimentos' && (
  <>
    <ResumoCard
      icon={Stethoscope}
      label="Quantidade de procedimentos"
      value={data?.kpis?.comercialVendas?.propostasFechadas || 0}
      rawValue={data?.kpis?.comercialVendas?.propostasFechadas || 0}
      previousValue={data?.comparativo?.procedimentos?.quantidadeAnteriorProcedimentos || 0}
    />

    <ResumoCard
      icon={CircleDollarSign}
      label="Valor de procedimentos"
      value={formatMoney(data?.kpis?.comercialVendas?.valorTotalVendas || 0)}
      rawValue={data?.kpis?.comercialVendas?.valorTotalVendas || 0}
      previousValue={data?.comparativo?.procedimentos?.valorAnteriorProcedimentos || 0}
    />

    <ResumoCard
      icon={TrendingUp}
      label="Ticket médio"
      value={formatMoney(data?.kpis?.comercialVendas?.ticketMedioVendas || 0)}
      rawValue={data?.kpis?.comercialVendas?.ticketMedioVendas || 0}
      previousValue={data?.comparativo?.procedimentos?.ticketAnteriorProcedimentos || 0}
    />
  </>
)}

  {visaoFinanceira === 'consolidado' && (
    <>
      <ResumoCard
  icon={Handshake}
  label="Quantidade total de vendas"
  value={data?.consolidado?.qtdVendas || 0}
  rawValue={data?.consolidado?.qtdVendas || 0}
  previousValue={data?.comparativo?.consolidado?.quantidadeAnteriorConsolidado || 0}
/>

      <ResumoCardMeta
        dot="gold"
        label="Total do valor de venda"
        value={data?.consolidado?.valorVendas || 0}
        meta={data?.consolidado?.metaValorVendas || 0}
        isMoney
        previousValue={data?.comparativo?.consolidado?.valorAnteriorConsolidado || 0}
      />

      <ResumoCardMeta
        dot="green"
        label="Ticket médio total"
        value={data?.consolidado?.ticketMedio || 0}
        meta={data?.consolidado?.metaTicketMedio || 0}
        isMoney
        previousValue={data?.comparativo?.consolidado?.ticketAnteriorConsolidado || 0}
      />
    </>
  )}
</ResumoSection>
</div>

       <section className={`rounded-[30px] border border-[color:var(--border)] bg-[var(--card)] text-[var(--foreground)] shadow-[var(--card-shadow)] ${isImac ? 'p-4' : 'p-6'}`}>
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
  className={`mx-auto max-w-[1320px] rounded-[24px] border border-[color:var(--border)] bg-[var(--background)] ${
    isImac ? 'p-3' : 'p-5'
  }`}
>
      <div className="mb-4 flex items-center gap-4">
        
          <div
  className={[
    isImac ? 'h-16 w-16' : 'h-28 w-28',
    'shrink-0 overflow-hidden rounded-full border border-[#D7B46A]/40 bg-[#D7B46A]/10',
  ].join(' ')}
>

    {getFotoMedico(medico.medico) ? (
      <img
  src={getFotoMedico(medico.medico)!}
  alt={medico.medico}
  className="h-full w-full object-cover object-center"
/>
   ) : (
  <div className="flex h-full w-full items-center justify-center text-lg font-black text-[#D7B46A]">
    DR
  </div>
)}
  </div>

 <div className="flex-1">
  <div className="flex items-center justify-between gap-4">
    
    <div className="flex flex-1 flex-col justify-center pl-2">
  <div>
  <h3 className={`${isImac ? 'text-[17px]' : 'text-[20px]'} font-black tracking-[-0.04em] text-[var(--foreground)]`}>
    {medico.medico}
  </h3>

  <p className={`mt-2 ${isImac ? 'text-[13px]' : 'text-[20px]'} font-semibold text-[var(--muted-foreground)]`}>
    {infoMedico.crm} • {infoMedico.especialidade}
  </p></div>
</div>

    <div className="min-w-[120px]">
      <p className="text-sm text-[var(--muted-foreground)]">
        Ocupação da agenda
      </p>

      <p className="mt-1 text-[42px] font-black text-emerald-500">
        {medico.capacidadeAgenda || 0}%
      </p>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--progress-bg)]">
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
  <div className={`rounded-[24px] border border-[color:var(--border)] bg-[var(--card)] ${
  isImac ? 'col-span-12 px-3 py-2' : 'px-3 py-2'
}`}>
  <h4 className="mb-3 text-[18px] font-black text-[var(--foreground)]">
    AGENDA
  </h4>

  <div className={isImac ? 'grid grid-cols-5 gap-3' : 'grid grid-cols-5 gap-2'}>
    <MetricMini
      label="Finalizados"
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
</div>
  <div className={isImac ? `col-span-12 grid ${medico.medico?.toUpperCase().includes('BRENO') ? 'grid-cols-4' : 'grid-cols-3'} gap-3` : 'grid grid-cols-3 gap-2'}>
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

  <div className={`rounded-[24px] border border-[color:var(--border)] bg-[var(--card)] ${isImac ? 'col-span-12 px-3 py-2' : 'p-5'}`}>
    <h4 className="mb-4 text-[18px] font-black text-[var(--foreground)]">
FINANCEIRO
</h4>


  <div className={isImac ? 'grid grid-cols-6 gap-3' : 'grid grid-cols-6 gap-2'}>
  <MetricCard icon={TrendingUp} label="Qtd. consultas" value={consultasGanhasMedico} description="" tone="green" />
  <MetricCard icon={CircleDollarSign} label="Venda consultas" value={formatMoney(faturamentoMedico)} description="" tone="green" />
  <MetricCard icon={Ticket} label="Ticket consultas" value={formatMoney(ticketMedioMedico)} description="" tone="green" />
  <MetricCard icon={Stethoscope} label="Qtd. procedimentos" value={quantidadeProcedimentosVendidos} description="" tone="blue" />
  <MetricCard icon={CircleDollarSign} label="Venda procedimentos" value={formatMoney(valorProcedimentosMedico)} description="" tone="blue" />
  <MetricCard icon={Ticket} label="Ticket procedimentos" value={formatMoney(ticketProcedimentosMedico)} description="" tone="blue" />
</div> </div>

<div className={`rounded-[24px] border border-[color:var(--border)] bg-[var(--card)] ${isImac ? 'col-span-12 px-3 py-2' : 'p-5'}`}>
  <h4 className="mb-4 text-[18px] font-black text-[var(--foreground)]">
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
        <p className="text-[30px] font-black text-[var(--foreground)]">
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
          <span className="text-[16px] font-bold text-[var(--muted-foreground)]">
  Meta {formatMoney(metaConsolidada)}
</span>

<span
  className={`text-[22px] font-black ${
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
  <div className="rounded-[26px] border border-[color:var(--border)] bg-[var(--card)] p-5 shadow-[var(--card-shadow)]">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-9 w-[6px] rounded-full bg-[#D7B46A]" />

          <h3 className="text-[23px] font-black text-[var(--foreground)]">
            {title}
          </h3>
        </div>

        {extra}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {children}
      </div>
    </div>
  )
}

function ResumoCard({
  label,
  value,
  rawValue,
  previousValue = 0,
  icon: Icon,
}: any) {
  const atual = Number(rawValue ?? value ?? 0)
  const anterior = Number(previousValue || 0)

  const percentual =
    anterior > 0
      ? Math.round(((atual - anterior) / anterior) * 100)
      : 0

  const positivo = percentual > 0
  const negativo = percentual < 0
  const isMoneyValue = typeof value === 'string' && value.includes('R$')
  const previousLabel = isMoneyValue ? formatMoney(anterior) : anterior

  return (
    <div className="rounded-[16px] border border-[color:var(--border)] bg-[var(--metric-card)] p-4">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[var(--icon-bg)]">
          <Icon className="h-5 w-5 text-[#D7B46A]" />
        </div>

       <p className="text-[15px] font-black leading-tight text-[var(--foreground)]">
          {label}
        </p>
      </div>

      <p className="text-[34px] font-black leading-none text-[var(--foreground)]">
        {value}
      </p>

      <p className="mt-2 text-[13px] font-semibold text-[var(--muted-foreground)]">
  fechamentos no período
</p>

      <div className="mt-3 flex items-center justify-between rounded-[12px] border border-[color:var(--border)] bg-[var(--card)] px-3 py-2">
        <div>
          <p
            className={`text-[18px] font-black ${
              positivo
                ? 'text-emerald-500'
                : negativo
                ? 'text-red-500'
                : 'text-[var(--muted-foreground)]'
            }`}
          >
            {positivo ? '▲' : negativo ? '▼' : '＝'} {Math.abs(percentual)}%
          </p>

          <p className="text-[11px] text-[var(--muted-foreground)]">
            {percentual === 0 ? 'igual ao período anterior' : 'vs. período anterior'}
          </p>
        </div>
<div className="flex items-center">
  <span className="mr-3 text-[15px] font-black text-[var(--muted-foreground)]">
    {previousLabel}
  </span>

  <div
    className={`flex h-8 w-8 items-center justify-center rounded-full ${
            positivo
              ? 'bg-emerald-500/15'
              : negativo
              ? 'bg-red-500/15'
              : 'bg-gray-500/15'
          }`}
        >
          <span
           className={`text-lg ${
              positivo
                ? 'text-emerald-500'
                : negativo
                ? 'text-red-500'
                : 'text-gray-400'
            }`}
          >
            {positivo ? '↗' : negativo ? '↘' : '→'}
           </span>
        </div>
      </div>
    </div>
  </div>
)
}
function ResumoCardMeta({
    label,
    value,
    meta,
    dot,
    isMoney,
    previousValue = 0,
}: any) {
  const percentual = meta > 0 ? Math.round((value / meta) * 100) : 0
  const anterior = Number(previousValue || 0)

const percentualComparativo =
  anterior > 0 ? Math.round(((value - anterior) / anterior) * 100) : 0

const positivoComparativo = percentualComparativo > 0
const negativoComparativo = percentualComparativo < 0

const previousLabel = isMoney ? formatMoney(anterior) : anterior
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
    <div className="rounded-[18px] border border-[color:var(--border)] bg-[var(--metric-card)] p-4">
      <div className="mb-4 flex items-center gap-3">
  <span className={`h-3 w-3 rounded-full ${dots[dot]}`} />

  <p className="text-[15px] font-black text-[var(--foreground)]">
    {label}
  </p>
</div>

<p className="text-[36px] font-black leading-none text-[var(--foreground)]">
  {isMoney ? formatMoney(value) : value}
</p>

   <div className="mt-4 h-4 overflow-hidden rounded-full bg-[var(--progress-bg)]">
        <div
          className={`h-full rounded-full ${cor.split(' ')[0]}`}
          style={{ width: `${Math.min(percentual, 100)}%` }}
        />
      </div>

     <div className="mt-4 flex items-center justify-between">
  <span className="text-[16px] font-bold text-[var(--muted-foreground)]">
    Meta {isMoney ? formatMoney(meta) : meta}
  </span>

  <span
    className={`text-[24px] font-black ${cor.split(' ')[1]}`}
  >
    {percentual}%
  </span>
</div>

<div className="mt-3 flex items-center justify-between rounded-[12px] border border-[color:var(--border)] bg-[var(--card)] px-3 py-2">
  <div>
    <p
      className={`text-[18px] font-black ${
        positivoComparativo
          ? 'text-emerald-500'
          : negativoComparativo
          ? 'text-red-500'
          : 'text-[var(--muted-foreground)]'
      }`}
    >
      {positivoComparativo ? '▲' : negativoComparativo ? '▼' : '＝'} {Math.abs(percentualComparativo)}%
    </p>

    <p className="text-[11px] text-[var(--muted-foreground)]">
      {percentualComparativo === 0 ? 'igual ao período anterior' : 'vs. período anterior'}
    </p>
  </div>

  <div className="flex items-center">
    <span className="mr-3 text-[15px] font-black text-[var(--muted-foreground)]">
      {previousLabel}
    </span>

    <div
      className={`flex h-8 w-8 items-center justify-center rounded-full ${
        positivoComparativo
          ? 'bg-emerald-500/15'
          : negativoComparativo
          ? 'bg-red-500/15'
          : 'bg-gray-500/15'
      }`}
    >
      <span
        className={`text-lg ${
          positivoComparativo
            ? 'text-emerald-500'
            : negativoComparativo
            ? 'text-red-500'
            : 'text-gray-400'
        }`}
      >
        {positivoComparativo ? '↗' : negativoComparativo ? '↘' : '→'}
      </span>
    </div>
  </div>
</div>

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
  <div
    className={`rounded-[16px] text-center shadow-none ${colors[color]} ${
      isImac ? 'px-3.5 py-3.5' : 'p-5'
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
        <Icon className={`${isImac ? 'h-4 w-4' : 'h-6 w-6'}`} />
      )}

      <p
        className={`${
          isImac ? 'text-[10px]' : 'text-[18px]'
        } font-black uppercase tracking-[0.08em] text-[var(--foreground)]`}
      >
        {label}
      </p>
    </div>

    <p
      className={`mt-2 ${
        isImac ? 'text-[20px]' : 'text-[42px]'
      } font-black text-[var(--foreground)]`}
    >
      {value}
    </p>
  </div>
)
}

function MetricCard({
  icon: Icon,
  label,
  value,
  description,
  tone = 'blue',
  
}: {
  icon: any
  label: string
  value: any
  description: string
  tone?: 'blue' | 'green' | 'red' | 'purple'
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
    <div className={`rounded-[16px] shadow-none px-3 py-2 ${tones[tone]}`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 shrink-0 ${iconColors[tone]}`} />
       <p className={`${isImac ? 'text-[15px]' : 'text-[20px]'} font-black text-[var(--foreground)]`}>{label}</p>
      </div>

      <div className="mt-3">
  <div>
    <div className={`flex w-full items-center justify-between ${isImac ? 'text-[20px]' : 'text-[34px]'} font-black leading-none text-[var(--foreground)]`}>
      {value}
    </div>

   <p className={`mt-2 ${isImac ? 'text-[12px]' : 'text-[18px]'} font-medium text-[var(--muted-foreground)]`}>
  {description}
</p>
  </div>

  {/* gráfico removido */}
</div>
    </div>
  )
}