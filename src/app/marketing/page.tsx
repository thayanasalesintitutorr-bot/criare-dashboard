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

function metaPercentBadge(
  atual: number,
  meta: number,
  tipo: 'minimo' | 'maximo' = 'minimo'
): { text: string; positive: boolean } {
  const diferenca = tipo === 'maximo' ? meta - atual : atual - meta
  const rounded = Math.round(diferenca)

  return {
    text: `${rounded >= 0 ? '+' : ''}${rounded}%`,
    positive: rounded >= 0,
  }
}

function MarketingMetricCard({
  title,
  value,
  icon,
  percentBadge,
  children,
  extra,
}: {
  title: string
  value: number
  icon: 'entrada' | 'naoQualificado' | 'qualificado' | 'agendado' | 'consulta' | 'procedimento'
  status: 'green' | 'red' | 'blue'
  percentBadge?: { text: string; positive: boolean }
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

 return (
  <div className="h-[230px] rounded-[22px] border border-[color:var(--border)] bg-[var(--card)] p-3 flex flex-col overflow-hidden shadow-[var(--card-shadow)]">
  <div className="mb-1 flex min-h-[40px] items-center gap-3">
  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--metric-card)]">
    <Icon
      size={18}
      strokeWidth={2.2}
      className="text-[var(--accent)]"
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

<div className="mt-1 min-h-[70px] flex items-center justify-between gap-3">
  <div className="flex items-center gap-2">
    <span className="text-2xl font-black tracking-[-0.06em] text-[var(--foreground)]">
      {value}
    </span>

    {percentBadge && (
      <span
        className={`text-xs font-black ${
          percentBadge.positive ? 'text-emerald-500' : 'text-rose-500'
        }`}
      >
        {percentBadge.text}
      </span>
    )}
  </div>

  {extra && (
    <div className="w-[125px] shrink-0">
      {extra}
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
    <div className="space-y-3 border-t border-[color:var(--border)] pt-4">
      {items.length === 0 && (
        <div className="flex h-[42px] items-center rounded-2xl border border-[color:var(--border)] bg-transparent px-5 text-sm font-semibold text-[var(--muted-foreground)]">
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

            <span className="truncate text-sm font-semibold text-[var(--foreground)]">
              {item.nome}
            </span>
          </div>

          <div className="ml-auto shrink-0 text-right">
            <div className="text-base font-black text-[var(--foreground)]">
              {item.quantidade ?? item.qtd ?? 0}
            </div>

            {item.valor !== undefined && (
              <div className="text-xs font-bold text-[var(--muted-foreground)]">
                {formatMoney(item.valor)}
              </div>
            )}
          </div>

          {item.detalhes && item.detalhes.length > 0 && (
            <div className="absolute left-0 top-full z-50 mt-2 hidden w-[460px] rounded-2xl border border-[color:var(--border)] bg-[var(--card)] p-4 shadow-[var(--card-shadow)] group-hover:block">
              <div className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
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
                        className="grid grid-cols-[1fr_120px_90px] gap-3 rounded-xl bg-[var(--metric-card)] p-2 text-xs"
                      >
                        <div className="truncate font-black text-[var(--foreground)]">
                          {detalhe.medico || 'Sem médico'}
                        </div>

                        <div className="truncate font-bold text-[var(--muted-foreground)]">
                          {detalhe.atendimento || detalhe.convenio || 'Sem atendimento'}
                        </div>

                        <div className="text-right font-black text-[var(--foreground)]">
                          {formatMoney(detalhe.valor)}
                        </div>
                      </div>
                    )
                  }

                  if (tooltipType === 'procedimento') {
                    return (
                      <div
                        key={`${detalhe.medico}-${detalheIndex}`}
                        className="grid grid-cols-[1fr_140px_90px] gap-3 rounded-xl bg-[var(--metric-card)] p-3 text-xs"
                      >
                        <div className="truncate font-black text-[var(--foreground)]">
                          {detalhe.medico || 'Sem médico'}
                        </div>

                        <div className="truncate font-bold text-[var(--muted-foreground)]">
                          {detalhe.produto || 'Sem produto'}
                        </div>

                        <div className="text-right font-black text-[var(--foreground)]">
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
                      <span className="truncate font-bold text-[var(--foreground)]">
                        {detalhe.nome}
                      </span>

                      <span className="font-black text-[var(--foreground)]">
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
    <div className="h-[230px] rounded-[22px] border border-[color:var(--border)] bg-[var(--card)] p-3 overflow-hidden shadow-[var(--card-shadow)] xl:col-span-2">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="text-[16px] font-black uppercase leading-[1.12] tracking-[0.08em] text-[var(--foreground)]">
            ROI por origem
          </div>
          <div className="mt-1 text-xs font-bold text-[var(--muted-foreground)]">
            Retorno sobre investimento
          </div>
        </div>

        <div className="rounded-xl bg-[var(--metric-card)] px-3 py-2 text-xs font-black text-[var(--accent)]">
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

                  <span className="truncate text-sm font-black text-[var(--foreground)]">
                    {item.origem}
                  </span>
                </div>

                <div className="text-sm font-black text-[var(--foreground)]">
                  {item.roi.toFixed(2)}x
                </div>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--metric-card)]">
                <div
                  className="h-full rounded-full bg-[var(--accent)]"
                  style={{ width: `${Math.min(Math.max(largura, 4), 100)}%` }}
                />
              </div>

             <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-[var(--muted-foreground)]">
  <div>
    <div className="uppercase text-[var(--muted-foreground)]">Retorno</div>
    <div className="text-[var(--foreground)]">{formatMoneyBR(item.retorno)}</div>
  </div>

  <div className="text-right">
    <div className="uppercase text-[var(--muted-foreground)]">Investimento</div>
    <div className="text-[var(--foreground)]">{formatMoneyBR(item.investimento)}</div>
  </div>
</div>
            </div>
          )
        })}

        {items.length === 0 && (
          <div className="flex h-[42px] items-center rounded-2xl border border-[color:var(--border)] bg-transparent px-5 text-sm font-semibold text-[var(--muted-foreground)]">
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
  <aside className="sticky top-5 flex h-[700px] flex-col rounded-[26px] border border-[color:var(--border)] bg-[var(--card)] p-5 shadow-[var(--card-shadow)]">
  <div className="min-h-0 flex-1 overflow-y-auto pr-2">
    <div className="mb-4">
      <div className="text-sm font-black uppercase tracking-[0.08em] text-[var(--foreground)]">
        Origens
      </div>

      <div className="mt-1 text-xs font-semibold text-[var(--muted-foreground)]">
        Filtre campanhas para calcular o ROI
      </div>
    </div>

    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setOrigensSelecionadas([])}
        className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-black transition-colors ${
          origensSelecionadas.length === 0
            ? 'border-[color:var(--accent)] bg-[var(--metric-card)] text-[var(--accent)]'
            : 'border-[color:var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--metric-card)]'
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
            className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-bold transition-colors ${
              ativo
                ? 'border-[color:var(--accent)] bg-[var(--metric-card)] text-[var(--accent)]'
                : 'border-[color:var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--metric-card)]'
            }`}
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                ativo
                  ? 'border-[color:var(--accent)] bg-[var(--accent)]'
                  : 'border-[color:var(--border)] bg-transparent'
              }`}
            />

            <span className="truncate">{origem}</span>
          </button>
        )
      })}
    </div>

    <div className="mt-5 border-t border-[color:var(--border)] pt-5">
      <div className="text-sm font-black uppercase tracking-[0.08em] text-[var(--foreground)]">
        Investimento por origem
      </div>

      <div className="mt-2 text-xs font-semibold text-[var(--muted-foreground)]">
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
              className={`rounded-2xl border p-3 transition-colors ${
                ativo
                  ? 'border-[color:var(--accent)]/40 bg-[var(--metric-card)]'
                  : 'border-[color:var(--border)] bg-transparent opacity-50'
              }`}
            >
              <div className="mb-2 truncate text-[11px] font-black uppercase text-[var(--muted-foreground)]">
                {origem}
              </div>

              <div className="flex overflow-hidden rounded-xl border border-[color:var(--border)] bg-[var(--card)]">
                <div className="flex items-center bg-[var(--metric-card)] px-2 text-xs font-black text-[var(--muted-foreground)]">
                  R$
                </div>

                <input
                  value={investimentosPorOrigem[origem] || ''}
                  onChange={(e) =>
                    atualizarInvestimentoOrigem(origem, e.target.value)
                  }
                  placeholder="0,00"
                  className="w-full px-2 py-2 text-xs font-black text-[var(--foreground)] outline-none"
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  </div>

  <div className="mt-4 shrink-0 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
    <div className="text-xs font-bold text-emerald-500">
      Investimento selecionado
    </div>

    <div className="mt-1 text-lg font-black text-emerald-500">
      {formatMoneyBR(investimento)}
    </div>
  </div>
</aside>

      <section className="flex h-[700px] flex-col space-y-4 overflow-hidden">
        <div className="shrink-0 grid rounded-[26px] border border-[color:var(--border)] bg-[var(--card)] p-4 shadow-[var(--card-shadow)] xl:grid-cols-6">
          <div className="flex items-center gap-3 border-r border-[color:var(--border)] px-3">
            <Wallet className="text-[var(--accent)]" size={28} />
            <div>
              <div className="text-xs font-black uppercase text-[var(--muted-foreground)]">Investimento</div>
              <div className="text-xl font-black text-[var(--foreground)]">{formatMoneyBR(investimento)}</div>
            </div>
          </div>

          <div className="border-r border-[color:var(--border)] px-4">
            <div className="text-xs font-black uppercase text-[var(--muted-foreground)]">Retorno</div>
            <div className="text-xl font-black text-[var(--foreground)]">{formatMoneyBR(retornoMarketing)}</div>
          </div>

          <div className="border-r border-[color:var(--border)] px-4">
            <div className="text-xs font-black uppercase text-[var(--muted-foreground)]">Lucro</div>
            <div className="text-xl font-black text-[var(--foreground)]">{formatMoneyBR(lucroMarketing)}</div>
          </div>

          <div className="border-r border-[color:var(--border)] px-4">
            <div className="text-xs font-black uppercase text-[var(--muted-foreground)]">ROI</div>
            <div className="text-xl font-black text-[var(--accent)]">{roi.toFixed(2)}x</div>
          </div>

          <div className="border-r border-[color:var(--border)] px-4">
            <div className="text-xs font-black uppercase text-[var(--muted-foreground)]">CAC</div>
            <div className="text-xl font-black text-[var(--foreground)]">{formatMoneyBR(cac)}</div>
          </div>

          <div className="px-4">
            <div className="text-xs font-black uppercase text-[var(--muted-foreground)]">CPL</div>
            <div className="text-xl font-black text-[var(--foreground)]">{formatMoneyBR(cpl)}</div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden rounded-[28px] bg-[var(--card)] p-4 shadow-[var(--card-shadow)]">
<div className="grid h-full grid-rows-2 gap-3 md:grid-cols-2 xl:grid-cols-4">

<MarketingMetricCard
          title="Entrada"
          value={totalEntradaFiltrada}
          icon="entrada"
          status="blue"
        >
          <OrigemStageCard items={entradaFiltrada} status="blue" />
        </MarketingMetricCard>

        <MarketingMetricCard
          title="Não qualificados"
          value={totalNaoQualificadosFiltrado}
          icon="naoQualificado"
          status={(marketing?.naoQualificadosPercent || 0) > 10 ? 'red' : 'green'}
          percentBadge={metaPercentBadge(marketing?.naoQualificadosPercent || 0, 10, 'maximo')}
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
          icon="qualificado"
          status={(marketing?.leadsAceitosPercent || 0) >= 90 ? 'green' : 'red'}
          percentBadge={metaPercentBadge(marketing?.leadsAceitosPercent || 0, 90)}
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
          icon="agendado"
          status={conversaoAgendados >= 30 ? 'green' : 'red'}
          percentBadge={metaPercentBadge(conversaoAgendados, 30)}
        >
          <OrigemStageCard
            items={agendadosFiltrado}
            status={conversaoAgendados >= 30 ? 'green' : 'red'}
          />
        </MarketingMetricCard>

       <MarketingMetricCard
  title="Consultas Ganhas"
 value={sumQtd(consultasFiltrado)}
  icon="consulta"
  status="blue"
 extra={
  <div className="space-y-1">
    <div className="rounded-xl bg-[var(--metric-card)] p-2">
      <div className="text-[9px] font-black uppercase text-[var(--muted-foreground)]">
        Valor
      </div>
      <div className="text-xs font-black text-[var(--foreground)]">
        {formatMoney(valorConsultasFiltrado)}
      </div>
    </div>

    <div className="rounded-xl bg-[var(--metric-card)] p-2">
      <div className="text-[9px] font-black uppercase text-[var(--muted-foreground)]">
        TM
      </div>
      <div className="text-xs font-black text-[var(--foreground)]">
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
  icon="procedimento"
  status="blue"
  extra={
  <div className="space-y-1">
    <div className="rounded-xl bg-[var(--metric-card)] p-2">
      <div className="text-[9px] font-black uppercase text-[var(--muted-foreground)]">
        Valor
      </div>
      <div className="text-xs font-black text-[var(--foreground)]">
        {formatMoney(valorProcedimentosFiltrado)}
      </div>
    </div>

    <div className="rounded-xl bg-[var(--metric-card)] p-2">
      <div className="text-[9px] font-black uppercase text-[var(--muted-foreground)]">
        TM
      </div>
      <div className="text-xs font-black text-[var(--foreground)]">
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