'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { useFilters } from '@/store/use-filters'
import {
  CircleDollarSign,
  TrendingUp,
  Target,
  Funnel,
  Package,
  Megaphone,
  Stethoscope,
} from 'lucide-react'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

type DashboardResponse = {
  ok: boolean
  error?: string
  kpis?: {
    comercialVendas: {
      propostasEnviadas: number
      propostasFechadas: number
      propostasFechadasPercent: number
      valorTotalVendas: number
      ticketMedioVendas: number
      leadsParadosVendas: number
      metaValorTotalVendas: number
    }
  }
  funilVendas?: {
    total: number
    orcamentoEntregue: number
    solicitacaoCirurgia: number
    marcado: number
    vendaGanha: number
    vendaPerdida: number
  }
  produtosVendidos?: {
    nome: string
    qtd: number
    valor: number
    percentual: number
  }[]
  campanhasVendidas?: {
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
  tarefasProximaSemana?: {
    consulta: number
    vendas: number
    total: number
  }
}

function formatMoney(v: number) {
  return v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })
}

function formatPercent(v: number) {
  return `${Math.round(v)}%`
}

const COLORS = [
  '#6366F1',
  '#22C55E',
  '#F59E0B',
  '#EF4444',
  '#06B6D4',
  '#A855F7',
]

function getFotoMedico(nome: string) {
  const n = nome
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toUpperCase()

  if (n.includes('RODOLPHO')) return '/medicos/rodolpho.png'
  if (n.includes('CLAUDIA')) return '/medicos/claudia.png'
  if (n.includes('BRENO')) return '/medicos/breno.png'
  if (n.includes('JESSICA')) return '/medicos/jessica.png'

  return null
}

export default function VendasPage() {

  const [isDark, setIsDark] = useState(false)

useEffect(() => {
  const updateTheme = () => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }

  updateTheme()

  const observer = new MutationObserver(updateTheme)

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })

  return () => observer.disconnect()
}, [])

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

  const vendas = data?.kpis?.comercialVendas
  const funil = data?.funilVendas
  const produtosVendidos = data?.produtosVendidos || []
  const campanhasVendidas = data?.campanhasVendidas || []
  const vendasPorMedicoRaw = data?.vendasPorMedico || []

  const vendasPorMedico = vendasPorMedicoRaw.reduce((acc: any[], medico) => {
    const nomeNormalizado =
      !medico.nome || medico.nome.trim().toLowerCase() === 'null'
        ? 'Sem médico'
        : medico.nome

    const existente = acc.find((m) => m.nome === nomeNormalizado)

    if (existente) {
      existente.valor += medico.valor || 0
      existente.meta += medico.meta || 0
      existente.produtos = [
        ...(existente.produtos || []),
        ...(medico.produtos || []),
      ]
      existente.percentual =
        existente.meta > 0 ? existente.valor / existente.meta : 0
    } else {
      acc.push({
        ...medico,
        nome: nomeNormalizado,
        valor: medico.valor || 0,
        meta: medico.meta || 0,
        percentual: medico.percentual || 0,
        produtos: medico.produtos || [],
      })
    }

    return acc
  }, [])

  const totalQtdProdutos = produtosVendidos.reduce((acc, p) => acc + p.qtd, 0)
  const totalValorProdutos = produtosVendidos.reduce((acc, p) => acc + p.valor, 0)

  const metaVendas = vendas?.metaValorTotalVendas || 0
  const vendasAtingiuMeta = (vendas?.valorTotalVendas || 0) >= metaVendas

  const vendasStatusClass = vendasAtingiuMeta
  ? 'bg-emerald-500/20 dark:bg-emerald-500/25'
  : 'bg-rose-500/20 dark:bg-[#5A2331]'

  const etapas = [
    { nome: 'Orçamento entregue', valor: funil?.orcamentoEntregue || 0, cor: '#3B82F6' },
    { nome: 'Solicitação de cirurgia', valor: funil?.solicitacaoCirurgia || 0, cor: '#FACC15' },
    { nome: 'Marcado', valor: funil?.marcado || 0, cor: '#F59E0B' },
    { nome: 'Venda ganha', valor: funil?.vendaGanha || 0, cor: '#84CC16' },
    { nome: 'Venda perdida', valor: funil?.vendaPerdida || 0, cor: '#6B7280' },
  ]

  const baseFunil = Math.max(funil?.total || 1, 1)

  if (loading) {
    return (
      <AppShell title="Vendas (Procedimentos)">
        <div className="rounded-[28px] bg-[var(--card)] p-6">
          Carregando vendas...
        </div>
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell title="Vendas (Procedimentos)">
        <div className="rounded-[28px] border border-red-500/20 bg-red-500/10 p-6 text-red-300">
          {error}
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Vendas (Procedimentos)">
      <div className="space-y-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <CardMini icon={Target} title="Criados" value={vendas?.propostasEnviadas || 0} big />

          <CardMini
            icon={TrendingUp}
            title="Vendas"
            value={vendas?.propostasFechadas || 0}
            subtitle="venda ganha"
          />

          <CardMini
            icon={CircleDollarSign}
            title="Valor de Venda"
            value={formatMoney(vendas?.valorTotalVendas || 0)}
            subtitle={`meta: ${formatMoney(metaVendas)}`}
            statusClass={vendasStatusClass}
          />

          <CardMini
            icon={CircleDollarSign}
            title="Ticket médio"
            value={formatMoney(vendas?.ticketMedioVendas || 0)}
            subtitle="por venda"
          />
        </div>

        <section className="rounded-[30px] border border-white/5 bg-[var(--card)] p-6">
          <div className="mb-6 flex items-center gap-3">
            <Stethoscope className="h-6 w-6 text-[var(--accent)]" />
            <h2 className="text-[26px] font-black">Vendas por médico</h2>
          </div>

          {vendasPorMedico.length === 0 ? (
            <div className="rounded-2xl bg-[var(--muted)] p-5 text-sm text-[var(--muted-foreground)]">
              Nenhuma venda por médico no período.
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {vendasPorMedico.map((medico) => (
                <div
                
                  key={medico.nome}
                  className="rounded-[24px] border border-white/5 bg-[var(--muted)] p-5"
                >
                  <div className="mb-4 flex items-start justify-between gap-4">
  <div className="flex items-center gap-4">
    
    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-[#D7B46A]/40 bg-[#D7B46A]/10">
      {getFotoMedico(medico.nome) ? (
        <img
          src={getFotoMedico(medico.nome) || ''}
          alt=""
          className="block h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-lg font-black text-[#D7B46A]">
          DR
        </div>
      )}
    </div>

    <div>
      <h3 className="text-xl font-black leading-tight">
        {medico.nome}
      </h3>
    </div>

  </div>
                

                    <div className="text-right">
                      <p className="text-xl font-black">
                        {formatMoney(medico.valor)}
                      </p>

                      <div className="mb-4 space-y-2">
                        <div className="h-2 w-full rounded-full bg-[var(--card)]">
                          <div
                            className={`h-2 rounded-full ${
                              medico.percentual >= 1
                                ? 'bg-green-500'
                                : medico.percentual >= 0.7
                                ? 'bg-yellow-400'
                                : 'bg-red-400'
                            }`}
                            style={{
                              width: `${Math.min(medico.percentual * 100, 100)}%`,
                            }}
                          />
                        </div>

                        <div className="flex justify-between text-xs">
                          <span className="text-[var(--muted-foreground)]">
                            {formatMoney(medico.meta)}
                          </span>

                          <span
                            className={`font-bold ${
                              medico.percentual >= 1
                                ? 'text-green-500'
                                : medico.percentual >= 0.7
                                ? 'text-yellow-400'
                                : 'text-red-400'
                            }`}
                          >
                            {Math.round(medico.percentual * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {(medico.produtos || []).map(
  (
    item: { produto: string; qtd: number },
    index: number
  ) => (
                      <div
                        key={`${medico.nome}-${item.produto}-${index}`}
                        className="flex justify-between rounded-2xl bg-[var(--card)] px-4 py-3"
                      >
                        <span className="font-semibold">{item.produto}</span>
                        <div className="text-right">
                          <span className="font-bold">{item.qtd}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="grid gap-6 xl:grid-cols-2 items-stretch">
          <section className="flex h-full flex-col rounded-[30px] border border-white/5 bg-[var(--card)] p-6">
            <div className="mb-6 flex items-center gap-3">
              <Funnel className="h-6 w-6 text-[var(--accent)]" />
              <h2 className="text-[26px] font-black">Funil de Vendas</h2>
            </div>

            <div className="space-y-4 flex flex-col items-center">
              {etapas.map((etapa, index) => {
                const percent = (etapa.valor / baseFunil) * 100
                const largura = Math.max(40, 100 - index * 12)

                return (
                  <div key={etapa.nome} className="w-full flex justify-center">
                    <div
                      className="relative flex items-center justify-between rounded-[22px] px-6 py-4 text-white shadow-sm"
                      style={{
                        width: `${largura}%`,
                        background: `linear-gradient(135deg, ${etapa.cor}, ${etapa.cor}CC)`,
                      }}
                    >
                      <div>
                        <p className="text-xs opacity-80">{etapa.nome}</p>
                        <p className="text-2xl font-black">{etapa.valor}</p>
                      </div>

                      <div className="rounded-full bg-white/20 px-3 py-1 text-sm font-bold backdrop-blur-sm">
                        {formatPercent(percent)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="flex h-full flex-col rounded-[30px] border border-white/5 bg-[var(--card)] p-6">
            <div className="mb-6 flex items-center gap-3">
              <Package className="h-6 w-6 text-[var(--accent)]" />
              <h2 className="text-[26px] font-black">
                Performance por produto vendido
              </h2>
            </div>

            <div className="space-y-4">
              {produtosVendidos.length === 0 && (
                <div className="rounded-2xl bg-[var(--muted)] p-5 text-sm">
                  Nenhum produto vendido no período.
                </div>
              )}

              {produtosVendidos.map((produto) => {
                const width = Math.max(8, produto.percentual)

                return (
                  <div key={produto.nome}>
                    <div className="mb-2 flex justify-between">
                      <div>
                        <p className="font-semibold">{produto.nome}</p>
                        <p className="text-sm text-[var(--muted-foreground)]">
                          {produto.qtd} vendas
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-bold">{formatMoney(produto.valor)}</p>
                        <p className="text-sm text-[var(--muted-foreground)]">
                          {Math.round(produto.percentual)}%
                        </p>
                      </div>
                    </div>

                    <div className="h-10 rounded-xl bg-[var(--muted)] p-1">
                      <div
                        className="h-full rounded-xl flex items-center px-3 text-white text-sm font-semibold"
                        style={{ width: `${width}%`, backgroundColor: '#6366F1' }}
                      >
                        {produto.qtd}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 border-t border-white/5 pt-5">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs uppercase text-[var(--muted-foreground)]">
                    Total geral
                  </p>
                  <p className="text-sm text-[var(--muted-foreground)] mt-1">
                    {totalQtdProdutos} vendas
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-black">
                    {formatMoney(totalValorProdutos)}
                  </p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    100%
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="rounded-[30px] border border-white/5 bg-[var(--card)] p-6">
          <div className="mb-6 flex items-center gap-3">
            <Megaphone className="h-6 w-6 text-[var(--accent)]" />
            <h2 className="text-[26px] font-black">Vendas por campanha</h2>
          </div>

          <div className="grid gap-8 xl:grid-cols-[360px_1fr]">
            <div className="h-[380px] overflow-visible">
              {campanhasVendidas.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-3xl bg-[var(--muted)] text-sm text-[var(--muted-foreground)]">
                  Nenhuma venda com campanha no período
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={380}>
                  <PieChart>
                    <Pie
                      data={campanhasVendidas}
                      dataKey="valor"
                      nameKey="nome"
                      innerRadius={72}
                      outerRadius={100}
                      paddingAngle={campanhasVendidas.length > 1 ? 3 : 0}
                      strokeWidth={0}
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, index }: any) => {
                        const qtd = campanhasVendidas[index]?.qtd || 0
                        const RADIAN = Math.PI / 180

                        const radius =
                          qtd >= 3
                            ? innerRadius + (outerRadius - innerRadius) * 0.55
                            : outerRadius + 18

                        const x = cx + radius * Math.cos(-midAngle * RADIAN)
                        const y = cy + radius * Math.sin(-midAngle * RADIAN)

                        return (
                          <text
                            x={x}
                            y={y}
                            fill={
  isDark
    ? 'white'
    : qtd >= 3
      ? 'white'
      : '#0F172A'
}
                            textAnchor={qtd >= 3 ? 'middle' : x > cx ? 'start' : 'end'}
                            dominantBaseline="central"
                            style={{
                              fontSize: qtd >= 3 ? 16 : 14,
                              fontWeight: 700,
                            }}
                          >
                            {qtd}
                          </text>
                        )
                      }}
                    >
                      {campanhasVendidas.map((campanha, index) => (
                        <Cell
                          key={campanha.nome}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>

                    <text
                      x="50%"
                      y="48%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-[var(--foreground)] text-5xl font-black"
                    >
                      {campanhasVendidas.reduce((acc, item) => acc + item.qtd, 0)}
                    </text>

                    <text
                      x="50%"
                      y="60%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-[var(--muted-foreground)] text-base"
                    >
                      Vendas
                    </text>

                    <Tooltip formatter={(value) => formatMoney(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="space-y-3">
              {campanhasVendidas.map((campanha, index) => (
                <div
                  key={campanha.nome}
                  className="flex items-center justify-between rounded-2xl bg-[var(--muted)] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />

                    <div>
                      <p className="font-semibold">{campanha.nome}</p>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        {campanha.qtd} vendas
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-bold">{formatMoney(campanha.valor)}</p>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {Math.round(campanha.percentual)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </AppShell>
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
      className={`rounded-[24px] border border-white/5 p-5 ${
        statusClass || 'bg-[var(--card)]'
      }`}
    >
      <div className="mb-3 flex items-center gap-2">
       <Icon
  size={14}
  className={statusClass ? 'text-[#D7B46A]' : 'text-[var(--accent)]'}
/>

<p
  className={`text-[11px] uppercase tracking-[0.18em] ${
    statusClass
      ? 'text-slate-600 dark:text-white/70'
      : 'text-[var(--muted-foreground)]'
  }`}
>
  {title}
</p>
      </div>

      <h3 className={`text-4xl font-black tracking-[-0.05em] ${statusClass ? 'text-white' : ''}`}>
        {value}
      </h3>

      {subtitle && (
        <p
  className={`mt-2 text-sm ${
    statusClass
      ? 'text-slate-600 dark:text-white/70'
      : 'text-[var(--muted-foreground)]'
  }`}
>
  {subtitle}
</p>
      )}
    </div>
  )
}