'use client'

import { useEffect, useState, type ReactNode } from 'react'


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

  const progressColor =
    status === 'green'
      ? 'bg-emerald-500'
      : status === 'red'
        ? 'bg-rose-500'
        : 'bg-[#d4af5f]'

 return (
  <div className={`min-h-[350px] rounded-[28px] border border-black/5 bg-white p-5 flex flex-col shadow-[0_16px_50px_rgba(15,23,42,0.08)] dark:border-white/5 dark:bg-[#112742]`}>
  
  <div className="mb-1 flex min-h-[40px] items-start gap-3">
  <div className="flex shrink-0 items-center justify-center">
    <Icon
      size={26}
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

<div className="mt-1 min-h-[48px] flex flex-col justify-start">
  <div className="text-4xl font-black tracking-[-0.06em] text-[var(--foreground)]">
    {value}
  </div>

  <div className="mt-2 h-2">
    {icon !== 'entrada' ? (
      <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
        <div
          className={`h-full rounded-full ${progressColor}`}
          style={{ width: `${Math.min(Math.max(percent, 4), 100)}%` }}
        />
      </div>
    ) : (
      <div className="h-2" />
    )}
  </div>

  {icon !== 'entrada' && (
    <div className="mt-2 text-right text-xs font-black text-[var(--muted-foreground)] dark:text-white/70">
      {subtitle}
    </div>
  )}
</div>

<div className="relative mt-3 flex-1">
 
  <div className="space-y-3">

    {children}
  </div>
</div>
  </div>
)
}
function OrigemStageCard({
  items,
  status,
  tooltipType = 'origem',
}: {
  items: {
    nome: string
    quantidade?: number
    qtd?: number
    valor?: number
    detalhes?: {
      nome?: string
      quantidade?: number
      medico?: string
      atendimento?: string
      convenio?: string
      produto?: string
      valor?: number
    }[]
  }[]
  status: 'green' | 'red' | 'blue'
  tooltipType?: 'origem' | 'consulta' | 'procedimento'
}) {
  const formatMoney = (value?: number) =>
    (value || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })

  return (
    <div className="space-y-3 border-t border-slate-200 pt-4 dark:border-white/10">
      {items.length === 0 && (
        <div className="flex h-[42px] items-center rounded-2xl border border-slate-200 bg-transparent px-5 text-sm font-semibold text-slate-400 dark:border-white/10 dark:text-white/40">
          Sem dados
        </div>
      )}

      {items.slice(0, 3).map((item, index) => (
        <div
          key={`${item.nome}-${index}`}
          className="group relative flex cursor-pointer items-center justify-between gap-3"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{
                backgroundColor:
                  ORIGENS_COLORS[index % ORIGENS_COLORS.length],
              }}
            />

            <span className="truncate text-sm font-semibold text-slate-700 dark:text-white/75">
              {item.nome}
            </span>
          </div>

          <div className="ml-auto shrink-0 text-right">
            <div className="text-base font-black text-slate-900 dark:text-white">
              {item.quantidade ?? item.qtd ?? 0}
            </div>

            {item.valor !== undefined && (
              <div className="text-xs font-bold text-slate-500 dark:text-white/50">
                {formatMoney(item.valor)}
              </div>
            )}
          </div>

          {item.detalhes && item.detalhes.length > 0 && (
            <div className="absolute left-0 top-full z-50 mt-2 hidden w-[460px] rounded-2xl border border-black/10 bg-white p-4 shadow-2xl group-hover:block dark:border-white/10 dark:bg-[#112742]">
              <div className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                {tooltipType === 'consulta'
                  ? 'Detalhes da consulta'
                  : tooltipType === 'procedimento'
                    ? 'Detalhes do procedimento'
                    : 'Detalhes'}
              </div>

              <div className="space-y-3">
                {item.detalhes.slice(0, 8).map((detalhe, detalheIndex) => {
                  if (tooltipType === 'consulta') {
                    return (
                      <div
                        key={`${detalhe.medico}-${detalheIndex}`}
                        className="grid grid-cols-[1fr_120px_90px] gap-3 rounded-xl bg-slate-50 p-3 text-xs dark:bg-white/5"
                      >
                        <div className="truncate font-black text-slate-900 dark:text-white">
                          {detalhe.medico || 'Sem médico'}
                        </div>

                        <div className="truncate font-bold text-slate-500 dark:text-white/60">
                          {detalhe.atendimento || detalhe.convenio || 'Sem atendimento'}
                        </div>

                        <div className="text-right font-black text-slate-900 dark:text-white">
                          {formatMoney(detalhe.valor)}
                        </div>
                      </div>
                    )
                  }

                  if (tooltipType === 'procedimento') {
                    return (
                      <div
                        key={`${detalhe.medico}-${detalheIndex}`}
                        className="grid grid-cols-[1fr_140px_90px] gap-3 rounded-xl bg-slate-50 p-3 text-xs dark:bg-white/5"
                      >
                        <div className="truncate font-black text-slate-900 dark:text-white">
                          {detalhe.medico || 'Sem médico'}
                        </div>

                        <div className="truncate font-bold text-slate-500 dark:text-white/60">
                          {detalhe.produto || 'Sem produto'}
                        </div>

                        <div className="text-right font-black text-slate-900 dark:text-white">
                          {formatMoney(detalhe.valor)}
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div
                      key={detalhe.nome || detalheIndex}
                      className="flex items-center justify-between gap-3 text-xs"
                    >
                      <span className="truncate font-bold text-slate-700 dark:text-white/80">
                        {detalhe.nome}
                      </span>

                      <span className="font-black text-slate-900 dark:text-white">
                        {detalhe.quantidade}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function MarketingPage() {

    const { periodo, tipoData, segmento, dataInicio, dataFim } = useFilters()

const [data, setData] = useState<any>(null)
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)
const [tagsSelecionadas, setTagsSelecionadas] = useState<('A' | 'B' | 'C' | 'D')[]>([])
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

const interval = setInterval(() => {
  loadData()
}, 5000)

return () => clearInterval(interval)
}, [periodo, tipoData, segmento, dataInicio, dataFim])

const marketing = data?.kpis?.marketing
const origensPorEtapa = data?.origensPorEtapa || {
  entrada: [],
  naoQualificado: [],
  qualificado: [],
  agendado: [],
}
const origensQualificadosPorTag =
  data?.origensQualificadosPorTag || {
    todas: [],
    A: [],
    B: [],
    C: [],
    D: [],
  }

const totalQualificadosSelecionados =
  tagsSelecionadas.length === 0
    ? marketing?.leadsAceitos || 0
    : tagsSelecionadas.reduce((total, tag) => {
        if (tag === 'A') return total + (marketing?.leadA || 0)
        if (tag === 'B') return total + (marketing?.leadB || 0)
        if (tag === 'C') return total + (marketing?.leadC || 0)
        return total + (marketing?.leadD || 0)
      }, 0)

const conversaoAgendados =
  totalQualificadosSelecionados > 0
    ? ((marketing?.agendados || 0) / totalQualificadosSelecionados) * 100
    : 0

const qualificadosFiltrados =
  tagsSelecionadas.length === 0
    ? origensQualificadosPorTag.todas
    : tagsSelecionadas.flatMap((tag) => origensQualificadosPorTag[tag])

const origensVendaConsulta: { nome: string; quantidade?: number; qtd?: number; valor?: number }[] =
  data?.origensVendaConsulta || []


const origensPropostasFechadas: { nome: string; quantidade?: number; qtd?: number; valor?: number }[] =
  data?.origensPropostasFechadas || []


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
  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
          value={
  tagsSelecionadas.length === 0
    ? marketing?.leadsAceitos || 0
    : tagsSelecionadas.reduce((total, tag) => {
        if (tag === 'A') return total + (marketing?.leadA || 0)
        if (tag === 'B') return total + (marketing?.leadB || 0)
        if (tag === 'C') return total + (marketing?.leadC || 0)
        return total + (marketing?.leadD || 0)
      }, 0)
}
          subtitle={`${Math.round(marketing?.leadsAceitosPercent || 0)}% de 90%`}
          icon="qualificado"
          status={(marketing?.leadsAceitosPercent || 0) >= 90 ? 'green' : 'red'}
          percent={marketing?.leadsAceitosPercent || 0}
        >
          <div className="mb-3 grid grid-cols-4 gap-2">
  {(['A', 'B', 'C', 'D'] as const).map((tag) => {
    const ativo = tagsSelecionadas.includes(tag)

    const quantidade =
      tag === 'A'
        ? marketing?.leadA || 0
        : tag === 'B'
          ? marketing?.leadB || 0
          : tag === 'C'
            ? marketing?.leadC || 0
            : marketing?.leadD || 0

    return (
      <button
        key={tag}
        type="button"
        onClick={() =>
          setTagsSelecionadas((atual) =>
            atual.includes(tag)
              ? atual.filter((item) => item !== tag)
              : [...atual, tag]
          )
        }
       className={`rounded-xl border px-2 py-2 text-center font-black transition ${
          ativo
            ? 'border-emerald-400 bg-emerald-50/80 text-emerald-500'
            : 'border-slate-200 bg-white/40 text-slate-600 hover:bg-white/70'
        }`}
      >
       <div className="text-base">{tag}</div>
        <div className="text-xs opacity-80">{quantidade}</div>
      </button>
    )
  })}
</div>
          <OrigemStageCard
            items={qualificadosFiltrados}
            status={(marketing?.leadsAceitosPercent || 0) >= 90 ? 'green' : 'red'}
          />
        </MarketingMetricCard>

        <MarketingMetricCard
          title="Agendados"
          value={marketing?.agendados || 0}
          subtitle={`${Math.round(conversaoAgendados)}% de conversão`}
          icon="agendado"
          status={conversaoAgendados >= 30 ? 'green' : 'red'}
          percent={conversaoAgendados}
        >
          <OrigemStageCard
            items={origensPorEtapa.agendado}
            status={conversaoAgendados >= 30 ? 'green' : 'red'}
          />
        </MarketingMetricCard>

       <MarketingMetricCard
  title="Consultas Ganhas"
  value={data?.kpis?.comercialConsulta?.quantidadeConsulta || 0}
  subtitle={formatMoney(valorVendaConsulta)}
  icon="consulta"
  status="blue"
>
  <OrigemStageCard
  items={origensVendaConsulta}
  status="blue"
  tooltipType="consulta"
/>
</MarketingMetricCard>

<MarketingMetricCard
  title="Procedimentos"
  value={data?.kpis?.comercialVendas?.propostasFechadas || 0}
  subtitle={formatMoney(valorProcedimentos)}
  icon="procedimento"
  status="blue"
>
  <OrigemStageCard
  items={origensPropostasFechadas}
  status="blue"
  tooltipType="procedimento"
/>
</MarketingMetricCard>
            </div>
    </div>
  </div>
</AppShell>
)
}