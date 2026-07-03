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
  BarChart3,
  Wallet,
  TrendingUp,
  Target,
  Receipt,
  MousePointerClick,
} from 'lucide-react'

const INVESTIMENTO_STORAGE_KEY = 'criare-marketing-investimentos-por-origem'

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

function formatMoneyBR(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function parseMoney(value: string) {
  return Number(
    value
      .replace(/\D/g, '')
      .replace(/^0+/, '')
  ) / 100 || 0
}

function formatMoneyInput(value: string) {
  const number = parseMoney(value)

  return number.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function getInvestimentosSalvos() {
  if (typeof window === 'undefined') return {}

  try {
    return JSON.parse(localStorage.getItem(INVESTIMENTO_STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function sumQtd(items: any[]) {
  return items.reduce(
    (total, item) => total + (item.quantidade ?? item.qtd ?? 0),
    0
  )
}

function sumValor(items: any[]) {
  return items.reduce((total, item) => total + (item.valor ?? 0), 0)
}

function metaLabel(
  atual: number,
  meta: number,
  tipo: 'minimo' | 'maximo' = 'minimo'
) {
  const diferenca = atual - meta
  const abs = Math.abs(Math.round(diferenca))

  if (tipo === 'maximo') {
    if (atual <= meta) return `Dentro do limite de ${meta}%`
    return `+${abs}% acima do limite`
  }

  if (atual >= meta) return `+${abs}% acima da meta`
  return `-${abs}% abaixo da meta`
}

function MarketingMetricCard({
  title,
  value,
  subtitle,
  icon,
  status,
  percent = 0,
  children,
  extra,
}: {
  title: string
  value: number
  subtitle: string
  icon: 'entrada' | 'naoQualificado' | 'qualificado' | 'agendado' | 'consulta' | 'procedimento'
  status: 'green' | 'red' | 'blue'
  percent?: number
children?: ReactNode
extra?: ReactNode
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
  <div className="h-[230px] rounded-[22px] border border-black/5 bg-white p-3 flex flex-col overflow-hidden shadow-[0_8px_28px_rgba(15,23,42,0.05)] dark:border-white/5 dark:bg-[#112742]">
  <div className="mb-1 flex min-h-[40px] items-start gap-3">
  <div className="flex shrink-0 items-center justify-center">
    <Icon
      size={22}
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
  text-[14px]
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

<div className="mt-1 min-h-[70px] flex items-start justify-between gap-3">
  <div className="text-2xl font-black tracking-[-0.06em] text-[var(--foreground)]">
    {value}
  </div>

  {extra && (
    <div className="w-[125px] shrink-0">
      {extra}
    </div>
  )}

  <div className="mt-2 h-2">
  {icon !== 'entrada' && icon !== 'consulta' && icon !== 'procedimento' ? (
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

 {icon !== 'entrada' && icon !== 'consulta' && icon !== 'procedimento' && (
  <div className="mt-2 text-right text-xs font-black text-[var(--muted-foreground)] dark:text-white/70">
    {subtitle}
  </div>
)}

</div>

<div className="relative mt-3 flex-1">
 <div className="max-h-[92px] space-y-2 overflow-y-auto pr-1">

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
                        className="grid grid-cols-[1fr_120px_90px] gap-3 rounded-xl bg-slate-50 p-2 text-xs dark:bg-white/5"
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

function RoiPorOrigemCard({
  items,
}: {
  items: {
    origem: string
    retorno: number
    investimento: number
    roi: number
  }[]
}) {
  const maiorRoi = Math.max(...items.map((item) => item.roi), 1)

  return (
    <div className="h-[230px] rounded-[22px] border border-black/5 bg-white p-3 overflow-hidden shadow-[0_8px_28px_rgba(15,23,42,0.05)] dark:border-white/5 dark:bg-[#112742] xl:col-span-2">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="text-[16px] font-black uppercase leading-[1.12] tracking-[0.08em] text-[var(--foreground)]">
            ROI por origem
          </div>
          <div className="mt-1 text-xs font-bold text-slate-400">
            Retorno sobre investimento
          </div>
        </div>

        <div className="rounded-xl bg-violet-50 px-3 py-2 text-xs font-black text-violet-600">
          ROI
        </div>
      </div>

      <div className="max-h-[150px] space-y-3 overflow-y-auto pr-1">
        {items.slice(0, 5).map((item, index) => {
          const largura = item.roi > 0 ? (item.roi / maiorRoi) * 100 : 4

          return (
            <div key={item.origem} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor:
                        ORIGENS_COLORS[index % ORIGENS_COLORS.length],
                    }}
                  />

                  <span className="truncate text-sm font-black text-slate-700">
                    {item.origem}
                  </span>
                </div>

                <div className="text-sm font-black text-slate-900">
                  {item.roi.toFixed(2)}x
                </div>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-violet-500"
                  style={{ width: `${Math.min(Math.max(largura, 4), 100)}%` }}
                />
              </div>

             <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-500">
  <div>
    <div className="uppercase text-slate-400">Retorno</div>
    <div className="text-slate-700">{formatMoneyBR(item.retorno)}</div>
  </div>

  <div className="text-right">
    <div className="uppercase text-slate-400">Investimento</div>
    <div className="text-slate-700">{formatMoneyBR(item.investimento)}</div>
  </div>
</div>
            </div>
          )
        })}

        {items.length === 0 && (
          <div className="flex h-[42px] items-center rounded-2xl border border-slate-200 bg-transparent px-5 text-sm font-semibold text-slate-400">
            Sem dados de ROI
          </div>
        )}
      </div>
    </div>
  )
}

export default function MarketingPage() {

    const { periodo, tipoData, segmento, dataInicio, dataFim } = useFilters()

const [data, setData] = useState<any>(null)
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)
const [tagsSelecionadas, setTagsSelecionadas] = useState<('A' | 'B' | 'C' | 'D')[]>([])
const [origensSelecionadas, setOrigensSelecionadas] = useState<string[]>([])
const [investimentosPorOrigem, setInvestimentosPorOrigem] = useState<Record<string, string>>(
  () => getInvestimentosSalvos()
)
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
useEffect(() => {
  localStorage.setItem(
    INVESTIMENTO_STORAGE_KEY,
    JSON.stringify(investimentosPorOrigem)
  )
}, [investimentosPorOrigem])

function atualizarInvestimentoOrigem(origem: string, valor: string) {
  setInvestimentosPorOrigem((atual) => ({
    ...atual,
    [origem]: formatMoneyInput(valor),
  }))
}

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

  const todasOrigens = Array.from(
  new Set([
    ...origensPorEtapa.entrada.map((item: any) => item.nome),
    ...origensPorEtapa.naoQualificado.map((item: any) => item.nome),
    ...origensPorEtapa.agendado.map((item: any) => item.nome),
    ...origensVendaConsulta.map((item: any) => item.nome),
    ...origensPropostasFechadas.map((item: any) => item.nome),
  ])
).filter(Boolean)

const origemAtiva = (nome: string) => {
  if (origensSelecionadas.length === 0) return true
  return origensSelecionadas.includes(nome)
}

const filtrarOrigem = (items: any[]) =>
  items.filter((item) => origemAtiva(item.nome))
const qualificadosFiltradosPorOrigem =
  filtrarOrigem(qualificadosFiltrados)
const entradaFiltrada = filtrarOrigem(origensPorEtapa.entrada)
const naoQualificadosFiltrado = filtrarOrigem(origensPorEtapa.naoQualificado)
const agendadosFiltrado = filtrarOrigem(origensPorEtapa.agendado)
const consultasFiltrado = filtrarOrigem(origensVendaConsulta)
const procedimentosFiltrado = filtrarOrigem(origensPropostasFechadas)

const totalEntradaFiltrada = sumQtd(entradaFiltrada)
const totalNaoQualificadosFiltrado = sumQtd(naoQualificadosFiltrado)
const totalAgendadosFiltrado = sumQtd(agendadosFiltrado)
const conversaoAgendados =
  totalQualificadosSelecionados > 0
    ? (totalAgendadosFiltrado / totalQualificadosSelecionados) * 100
    : 0
const valorConsultasFiltrado = sumValor(consultasFiltrado)
const valorProcedimentosFiltrado = sumValor(procedimentosFiltrado)
const retornoMarketing = valorConsultasFiltrado + valorProcedimentosFiltrado

const origensRoi =
  origensSelecionadas.length === 0 ? todasOrigens : origensSelecionadas
const retornoPorOrigem = origensRoi
  .map((origem) => {
    const consulta = origensVendaConsulta.find(
      (item: any) => item.nome === origem
    )

    const procedimento = origensPropostasFechadas.find(
      (item: any) => item.nome === origem
    )

    const retorno = (consulta?.valor || 0) + (procedimento?.valor || 0)

    const investimentoOrigem = parseMoney(
      investimentosPorOrigem[origem] || ''
    )

    const roiOrigem =
      investimentoOrigem > 0 ? retorno / investimentoOrigem : 0

    return {
      origem,
      retorno,
      investimento: investimentoOrigem,
      roi: roiOrigem,
    }
  })
  .filter((item) => item.retorno > 0 || item.investimento > 0)
  .sort((a, b) => b.roi - a.roi)
const origensParaInvestimento =
  origensSelecionadas.length === 0 ? todasOrigens : origensSelecionadas

const investimento = origensParaInvestimento.reduce((total, origem) => {
  return total + parseMoney(investimentosPorOrigem[origem] || '')
}, 0)
const lucroMarketing = retornoMarketing - investimento

const roi =
  investimento > 0 ? retornoMarketing / investimento : 0

const cac =
  totalAgendadosFiltrado > 0 ? investimento / totalAgendadosFiltrado : 0

const cpl =
  totalEntradaFiltrada > 0 ? investimento / totalEntradaFiltrada : 0

return (
  <AppShell title="Marketing">
  <div className="space-y-5">
    <div className="grid gap-5 xl:grid-cols-[230px_1fr]">
    <aside className="sticky top-5 flex h-[calc(100vh-120px)] flex-col rounded-[26px] border border-black/5 bg-white p-5 shadow-[0_14px_45px_rgba(15,23,42,0.07)]">
  <div className="min-h-0 flex-1 overflow-y-auto pr-2">
    <div className="mb-4">
      <div className="text-sm font-black uppercase tracking-[0.08em] text-slate-900">
        Origens
      </div>

      <div className="mt-1 text-xs font-semibold text-slate-500">
        Filtre campanhas para calcular o ROI
      </div>
    </div>

    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setOrigensSelecionadas([])}
        className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-black ${
          origensSelecionadas.length === 0
            ? 'border-violet-500 bg-violet-50 text-violet-600'
            : 'border-slate-200 text-slate-600'
        }`}
      >
        Todas as origens
      </button>

      {todasOrigens.map((origem) => {
        const ativo = origensSelecionadas.includes(origem)

        return (
          <button
            key={origem}
            type="button"
            onClick={() =>
              setOrigensSelecionadas((atual) =>
                atual.includes(origem)
                  ? atual.filter((item) => item !== origem)
                  : [...atual, origem]
              )
            }
            className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-bold ${
              ativo
                ? 'border-violet-500 bg-violet-50 text-violet-600'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                ativo
                  ? 'border-violet-500 bg-violet-500'
                  : 'border-slate-300 bg-white'
              }`}
            />

            <span className="truncate">{origem}</span>
          </button>
        )
      })}
    </div>

    <div className="mt-5 border-t border-slate-200 pt-5">
      <div className="text-sm font-black uppercase tracking-[0.08em] text-slate-900">
        Investimento por origem
      </div>

      <div className="mt-2 text-xs font-semibold text-slate-500">
        Informe quanto foi investido em cada campanha
      </div>

      <div className="mt-4 space-y-3">
        {todasOrigens.map((origem) => {
          const ativo =
            origensSelecionadas.length === 0 ||
            origensSelecionadas.includes(origem)

          return (
            <div
              key={`investimento-${origem}`}
              className={`rounded-2xl border p-3 ${
                ativo
                  ? 'border-violet-200 bg-violet-50/50'
                  : 'border-slate-200 bg-white opacity-50'
              }`}
            >
              <div className="mb-2 truncate text-[11px] font-black uppercase text-slate-500">
                {origem}
              </div>

              <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center bg-slate-50 px-2 text-xs font-black text-slate-500">
                  R$
                </div>

                <input
                  value={investimentosPorOrigem[origem] || ''}
                  onChange={(e) =>
                    atualizarInvestimentoOrigem(origem, e.target.value)
                  }
                  placeholder="0,00"
                  className="w-full px-2 py-2 text-xs font-black outline-none"
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  </div>

  <div className="mt-4 shrink-0 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
    <div className="text-xs font-bold text-emerald-600">
      Investimento selecionado
    </div>

    <div className="mt-1 text-lg font-black text-emerald-700">
      {formatMoneyBR(investimento)}
    </div>
  </div>
</aside>

      <section className="space-y-5">
        <div className="grid rounded-[26px] border border-violet-200 bg-violet-50/60 p-4 shadow-[0_14px_45px_rgba(15,23,42,0.06)] xl:grid-cols-6">
          <div className="flex items-center gap-3 border-r border-violet-200 px-3">
            <Wallet className="text-violet-600" size={28} />
            <div>
              <div className="text-xs font-black uppercase text-slate-500">Investimento</div>
              <div className="text-xl font-black text-slate-900">{formatMoneyBR(investimento)}</div>
            </div>
          </div>

          <div className="border-r border-violet-200 px-4">
            <div className="text-xs font-black uppercase text-slate-500">Retorno</div>
            <div className="text-xl font-black text-slate-900">{formatMoneyBR(retornoMarketing)}</div>
          </div>

          <div className="border-r border-violet-200 px-4">
            <div className="text-xs font-black uppercase text-slate-500">Lucro</div>
            <div className="text-xl font-black text-slate-900">{formatMoneyBR(lucroMarketing)}</div>
          </div>

          <div className="border-r border-violet-200 px-4">
            <div className="text-xs font-black uppercase text-slate-500">ROI</div>
            <div className="text-xl font-black text-violet-600">{roi.toFixed(2)}x</div>
          </div>

          <div className="border-r border-violet-200 px-4">
            <div className="text-xs font-black uppercase text-slate-500">CAC</div>
            <div className="text-xl font-black text-slate-900">{formatMoneyBR(cac)}</div>
          </div>

          <div className="px-4">
            <div className="text-xs font-black uppercase text-slate-500">CPL</div>
            <div className="text-xl font-black text-slate-900">{formatMoneyBR(cpl)}</div>
          </div>
        </div>

        <div className="rounded-[28px] bg-white p-4 shadow-[0_12px_40px_rgba(15,23,42,0.06)] dark:bg-[#112742] dark:shadow-[0_20px_70px_rgba(0,0,0,0.35)]">
  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">

<MarketingMetricCard
          title="Entrada"
          value={totalEntradaFiltrada}
          subtitle=""
          icon="entrada"
          status="blue"
        >
          <OrigemStageCard items={entradaFiltrada} status="blue" />
        </MarketingMetricCard>

        <MarketingMetricCard
          title="Não qualificados"
          value={totalNaoQualificadosFiltrado}
          subtitle={metaLabel(marketing?.naoQualificadosPercent || 0, 10, 'maximo')}
          icon="naoQualificado"
          status={(marketing?.naoQualificadosPercent || 0) > 10 ? 'red' : 'green'}
          percent={marketing?.naoQualificadosPercent || 0}
        >
          <OrigemStageCard
            items={naoQualificadosFiltrado}
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
          subtitle={metaLabel(marketing?.leadsAceitosPercent || 0, 90)}
          icon="qualificado"
          status={(marketing?.leadsAceitosPercent || 0) >= 90 ? 'green' : 'red'}
          percent={marketing?.leadsAceitosPercent || 0}
        >
         <div className="mb-2 flex gap-1.5">
  {(['A', 'B', 'C', 'D'] as const).map((tag) => {
    const ativo = tagsSelecionadas.includes(tag)

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
        className={`h-7 w-7 rounded-lg border text-xs font-black transition ${
          ativo
            ? 'border-emerald-400 bg-emerald-50 text-emerald-500'
            : 'border-slate-200 bg-white text-slate-500'
        }`}
      >
        {tag}
      </button>
    )
  })}
</div>
          <OrigemStageCard
            items={qualificadosFiltradosPorOrigem}
            status={(marketing?.leadsAceitosPercent || 0) >= 90 ? 'green' : 'red'}
          />
        </MarketingMetricCard>

        <MarketingMetricCard
          title="Agendados"
          value={totalAgendadosFiltrado}
          subtitle={metaLabel(conversaoAgendados, 30)}
          icon="agendado"
          status={conversaoAgendados >= 30 ? 'green' : 'red'}
          percent={conversaoAgendados}
        >
          <OrigemStageCard
            items={agendadosFiltrado}
            status={conversaoAgendados >= 30 ? 'green' : 'red'}
          />
        </MarketingMetricCard>

       <MarketingMetricCard
  title="Consultas Ganhas"
 value={sumQtd(consultasFiltrado)}
subtitle={formatMoney(valorConsultasFiltrado)}
  icon="consulta"
  status="blue"
 extra={
  <div className="space-y-1">
    <div className="rounded-xl bg-slate-50 p-2">
      <div className="text-[9px] font-black uppercase text-slate-400">
        Valor
      </div>
      <div className="text-xs font-black text-slate-900">
        {formatMoney(valorConsultasFiltrado)}
      </div>
    </div>

    <div className="rounded-xl bg-slate-50 p-2">
      <div className="text-[9px] font-black uppercase text-slate-400">
        TM
      </div>
      <div className="text-xs font-black text-slate-900">
        {formatMoney(
          sumQtd(consultasFiltrado) > 0
            ? valorConsultasFiltrado / sumQtd(consultasFiltrado)
            : 0
        )}
      </div>
    </div>
  </div>
}
>
  <OrigemStageCard
items={consultasFiltrado}
  status="blue"
  tooltipType="consulta"
/>
</MarketingMetricCard>

<MarketingMetricCard
  title="Procedimentos"
  value={sumQtd(procedimentosFiltrado)}
subtitle={formatMoney(valorProcedimentosFiltrado)}
  icon="procedimento"
  status="blue"
  extra={
  <div className="space-y-1">
    <div className="rounded-xl bg-slate-50 p-2">
      <div className="text-[9px] font-black uppercase text-slate-400">
        Valor
      </div>
      <div className="text-xs font-black text-slate-900">
        {formatMoney(valorProcedimentosFiltrado)}
      </div>
    </div>

    <div className="rounded-xl bg-slate-50 p-2">
      <div className="text-[9px] font-black uppercase text-slate-400">
        TM
      </div>
      <div className="text-xs font-black text-slate-900">
        {formatMoney(
          sumQtd(procedimentosFiltrado) > 0
            ? valorProcedimentosFiltrado / sumQtd(procedimentosFiltrado)
            : 0
        )}
      </div>
    </div>
  </div>
}
>
  <OrigemStageCard
  items={procedimentosFiltrado}
  status="blue"
  tooltipType="procedimento"
/>
</MarketingMetricCard>
<RoiPorOrigemCard items={retornoPorOrigem} />
                      </div>
        </div>
      </section>
    </div>
  </div>
</AppShell>
)
}