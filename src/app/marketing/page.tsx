'use client'

import { useEffect, useState, type ReactNode } from 'react'

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts'

import { AppShell } from '@/components/layout/app-shell'

import { useFilters } from '@/store/use-filters'

import {
  CircleDot,
  UserX,
  UserCheck,
  CalendarCheck,
  BadgeDollarSign,
  BriefcaseMedical,
} from 'lucide-react'

const ORIGENS_COLORS = [
  '#4f8cff',
  '#34d399',
  '#f59e0b',
  '#f87171',
  '#a78bfa',
  '#fb923c',
  '#38bdf8',
  '#e879f9',
]

function formatPercent(v: number) {
  return `${Math.round(v)}%`
}

function OrigensTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null

  const item = payload[0]

  return (
    <div className="rounded-xl border border-white/10 bg-[var(--card)] px-4 py-3 text-sm shadow-xl">
      <div className="mb-1 font-semibold text-white/90">
        {item.payload.nome}
      </div>

      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: item.fill }}
        />

        <span className="text-[var(--muted-foreground)]">Leads:</span>

        <span className="font-bold text-[var(--foreground)]">
          {item.value}
        </span>
      </div>
    </div>
  )
}

function cardBg() {
  return 'border border-black/5 bg-[var(--card)] shadow-[0_16px_50px_rgba(15,23,42,0.08)] dark:border-white/5 dark:shadow-[0_20px_60px_rgba(0,0,0,0.35)]'
}
function MarketingMetricCard({
  title,
  value,
  subtitle,
  icon,
  status,
  percent = 0,
  children,
}: {
  title: string
  value: number
  subtitle: string
  icon: 'entrada' | 'naoQualificado' | 'qualificado' | 'agendado' | 'consulta' | 'procedimento'
  status: 'green' | 'red' | 'blue'
  percent?: number
children?: ReactNode
}) {
  const Icon =
  icon === 'entrada'
    ? CircleDot
    : icon === 'naoQualificado'
      ? UserX
      : icon === 'qualificado'
        ? UserCheck
        : icon === 'agendado'
          ? CalendarCheck
          : icon === 'consulta'
            ? BadgeDollarSign
            : BriefcaseMedical

const bg =
  'bg-transparent'

  const progressColor =
    status === 'green'
      ? 'bg-emerald-500'
      : status === 'red'
        ? 'bg-rose-500'
        : 'bg-[#d4af5f]'

  return (<div className={`h-[720px] rounded-[28px] p-5 flex flex-col overflow-hidden shadow-[0_16px_50px_rgba(15,23,42,0.08)] ${bg}`}>
  
  <div className="mb-2 flex min-h-[48px] items-start gap-3">
  <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[15px] bg-[#F3E7C7]/65 dark:bg-[#F3E7C7]/10">
    <Icon
      size={21}
      strokeWidth={2.2}
      className="text-[#D7B46A]"
    />
  </div>

 <div
  className="
  pt-0
  flex-1
  min-w-0
  whitespace-normal
  break-words
  text-[16px]
  font-black
  uppercase
  leading-[1.12]
  tracking-[0.08em]
  text-[var(--foreground)]
"
>
  {title}
</div>
</div>

<div className="mt-2 min-h-[58px] flex flex-col justify-start">
  <div className="text-5xl font-black tracking-[-0.06em] text-[var(--foreground)]">
    {value}
  </div>

  <div className="mt-2 h-3">
    {icon !== 'entrada' ? (
      <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
        <div
          className={`h-full rounded-full ${progressColor}`}
          style={{ width: `${Math.min(Math.max(percent, 4), 100)}%` }}
        />
      </div>
    ) : (
      <div className="h-3" />
    )}
  </div>

  {icon !== 'entrada' && (
    <div className="mt-2 text-right text-xs font-black text-[var(--muted-foreground)] dark:text-white/70">
      {subtitle}
    </div>
  )}
</div>

<div className="relative mt-6 flex-1 overflow-hidden">
 
  <div
    className="
      h-full
      overflow-y-auto
      pr-1
      scrollbar-thin
      scrollbar-track-transparent
      scrollbar-thumb-[#D7B46A]/40
hover:scrollbar-thumb-[#D7B46A]/70
    "
  >
    {children}
  </div>
</div>
  </div>
)
}

function OrigemStageCard({
  items,
  status,
}: {
 items: { nome: string; quantidade?: number; qtd?: number; valor?: number }[]
  status: 'green' | 'red' | 'blue'
}) {
  const innerBg =
    status === 'green'
      ? 'bg-emerald-700/20 dark:bg-[#063D38]'
      : status === 'red'
        ? 'bg-rose-700/20 dark:bg-[#341024]'
        : 'bg-slate-700/10 dark:bg-[#183047]'

        const miniCardColorsLight = [
  'bg-[#4F83F1]',
  'bg-[#39C98D]',
  'bg-[#F5A524]',
  'bg-[#F36B6B]',
  'bg-[#9B7EED]',
  'bg-[#FB923C]',
  'bg-[#38BDF8]',
  'bg-[#E879F9]',
]

const miniCardColorsDark = [
  'dark:bg-[#214A92]',
  'dark:bg-[#176F52]',
  'dark:bg-[#9A5F08]',
  'dark:bg-[#8F2F35]',
  'dark:bg-[#5B3FA3]',
  'dark:bg-[#9A4E16]',
  'dark:bg-[#176B8A]',
  'dark:bg-[#8A3A92]',
]

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <div
          className={`rounded-[16px] ${innerBg} p-5 text-sm font-bold text-[var(--foreground)]`}
        >
          Sem dados
        </div>
      )}

      {items.map((item, index) => {
        return (
          <div
            key={`${item.nome}-${index}`}
            className={`
  rounded-[16px]
  ${miniCardColorsLight[index % miniCardColorsLight.length]}
  ${miniCardColorsDark[index % miniCardColorsDark.length]}
  px-4 py-3
  min-h-[82px]
  flex flex-col justify-between
  shadow-[0_12px_28px_rgba(0,0,0,0.08)]
  dark:shadow-[0_14px_30px_rgba(0,0,0,0.28)]
`}
          >
            <div>
              <div className="text-[13px] leading-[16px] font-[800] uppercase break-words line-clamp-2 text-white">
                {item.nome}
              </div>
            </div>

            <div className="mt-4">
              <div className="text-[26px] font-black leading-none text-white">
                {item.quantidade ?? item.qtd ?? 0}
                {item.valor !== undefined && (
  <div className="mt-1 text-[12px] font-black text-white/75">
    {item.valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })}
  </div>
)}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function MarketingPage() {

    const { periodo, tipoData, segmento, dataInicio, dataFim } = useFilters()

const [data, setData] = useState<any>(null)
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

      const token = localStorage.getItem('access_token')

const res = await fetch(url, {
  cache: 'no-store',
  headers: {
    Authorization: `Bearer ${token}`,
  },
})

      const json = await res.json()

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
const origens: { nome: string; quantidade: number }[] = data?.origens || []
const origensPorEtapa = data?.origensPorEtapa || {
  entrada: [],
  naoQualificado: [],
  qualificado: [],
  agendado: [],
}
const origensTop = origens.slice(0, 10)
const origensTotal = origens.reduce(
  (acc: number, item: any) => acc + item.quantidade,
  0
)

const origensVendaConsulta: { nome: string; quantidade?: number; qtd?: number; valor?: number }[] =
  data?.origensVendaConsulta || []

const origensVendaConsultaTotal = origensVendaConsulta.reduce(
  (acc: number, item: any) => acc + (item.quantidade ?? item.qtd ?? 0),
  0
)

const origensPropostasFechadas: { nome: string; quantidade?: number; qtd?: number; valor?: number }[] =
  data?.origensPropostasFechadas || []

const origensPropostasFechadasTotal = origensPropostasFechadas.reduce(
  (acc: number, item: any) => acc + (item.quantidade ?? item.qtd ?? 0),
  0
)

const formatMoney = (value: number) =>
  value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

const valorVendaConsulta =
  data?.kpis?.comercialConsulta?.valorTotalConsulta || 0

const valorProcedimentos =
  data?.kpis?.comercialVendas?.valorTotalVendas || 0

return (
  <AppShell title="Marketing">
    <div className="space-y-8">
      <div className="sticky top-[96px] z-20 rounded-[34px] bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] dark:bg-[#112742] dark:shadow-[0_20px_70px_rgba(0,0,0,0.35)]">
  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-6">
        <MarketingMetricCard
          title="Entrada"
          value={marketing?.totalEntradas || 0}
          subtitle=""
          icon="entrada"
          status="blue"
        >
          <OrigemStageCard items={origensPorEtapa.entrada} status="blue" />
        </MarketingMetricCard>

        <MarketingMetricCard
          title="Não qualificados"
          value={marketing?.naoQualificados || 0}
          subtitle={`${Math.round(marketing?.naoQualificadosPercent || 0)}% de 10%`}
          icon="naoQualificado"
          status={(marketing?.naoQualificadosPercent || 0) > 10 ? 'red' : 'green'}
          percent={marketing?.naoQualificadosPercent || 0}
        >
          <OrigemStageCard
            items={origensPorEtapa.naoQualificado}
            status={(marketing?.naoQualificadosPercent || 0) > 10 ? 'red' : 'green'}
          />
        </MarketingMetricCard>

        <MarketingMetricCard
          title="Qualificados"
          value={marketing?.leadsAceitos || 0}
          subtitle={`${Math.round(marketing?.leadsAceitosPercent || 0)}% de 90%`}
          icon="qualificado"
          status={(marketing?.leadsAceitosPercent || 0) >= 90 ? 'green' : 'red'}
          percent={marketing?.leadsAceitosPercent || 0}
        >
          <OrigemStageCard
            items={origensPorEtapa.qualificado}
            status={(marketing?.leadsAceitosPercent || 0) >= 90 ? 'green' : 'red'}
          />
        </MarketingMetricCard>

        <MarketingMetricCard
          title="Agendados"
          value={marketing?.agendados || 0}
          subtitle={`${Math.round(marketing?.agendadosPercent || 0)}% de 30%`}
          icon="agendado"
          status={(marketing?.agendadosPercent || 0) >= 30 ? 'green' : 'red'}
          percent={marketing?.agendadosPercent || 0}
        >
          <OrigemStageCard
            items={origensPorEtapa.agendado}
            status={(marketing?.agendadosPercent || 0) >= 30 ? 'green' : 'red'}
          />
        </MarketingMetricCard>

       <MarketingMetricCard
  title="Consultas Ganhas"
  value={data?.kpis?.comercialConsulta?.quantidadeConsulta || 0}
  subtitle={formatMoney(valorVendaConsulta)}
  icon="consulta"
  status="blue"
>
  <OrigemStageCard items={origensVendaConsulta} status="blue" />
</MarketingMetricCard>

<MarketingMetricCard
  title="Procedimentos"
  value={data?.kpis?.comercialVendas?.propostasFechadas || 0}
  subtitle={formatMoney(valorProcedimentos)}
  icon="procedimento"
  status="blue"
>
  <OrigemStageCard items={origensPropostasFechadas} status="blue" />
</MarketingMetricCard>
            </div>
    </div>
  </div>
</AppShell>
)
}