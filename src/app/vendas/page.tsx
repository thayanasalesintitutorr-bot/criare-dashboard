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
  Stethoscope,
} from 'lucide-react'

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

  const vendas = data?.kpis?.comercialVendas
  const funil = data?.funilVendas
  const produtosVendidos = data?.produtosVendidos || []
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
  
  const etapas = [
  { nome: 'Orçamento entregue', valor: funil?.orcamentoEntregue || 0, cor: '#3B82F6' },
  { nome: 'Em negociação', valor: (funil?.solicitacaoCirurgia || 0) + (funil?.marcado || 0), cor: '#F59E0B' },
  { nome: 'Venda ganha', valor: funil?.vendaGanha || 0, cor: '#22C55E' },
  { nome: 'Venda perdida', valor: funil?.vendaPerdida || 0, cor: '#EF4444' },
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
  <CardMini
    icon={Target}
    title="Orçamentos entregues"
    value={funil?.orcamentoEntregue || 0}
    subtitle="no período"
  />

  <CardMini
    icon={Funnel}
    title="Em negociação"
    value={(funil?.solicitacaoCirurgia || 0) + (funil?.marcado || 0)}
    subtitle="em andamento"
  />

  <CardMini
    icon={TrendingUp}
    title="Vendas ganhas"
    value={funil?.vendaGanha || 0}
    subtitle="fechamentos"
  />

  <CardMini
    icon={CircleDollarSign}
    title="Vendas perdidas"
    value={funil?.vendaPerdida || 0}
    subtitle="perdidas no período"
  />
</div>

<div className="grid gap-5 md:grid-cols-2">
  <CardMeta
    title="Valor vendido"
    value={vendas?.valorTotalVendas || 0}
    meta={metaVendas}
    isMoney
  />

  <CardMeta
    title="Ticket médio"
    value={vendas?.ticketMedioVendas || 0}
    meta={2800}
    isMoney
  />
</div>



       

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
                      className="relative flex items-center justify-between rounded-[22px] px-6 py-5 text-white shadow-sm"
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

<section className="rounded-[30px] border border-[color:var(--border)] bg-[var(--card)] p-6 shadow-[var(--card-shadow)]">
  <div className="mb-6 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <Stethoscope className="h-6 w-6 text-[var(--accent)]" />
      <h2 className="text-[26px] font-black text-[var(--foreground)]">
        Vendas por médico
      </h2>
    </div>

    <span className="text-sm font-bold text-[var(--muted-foreground)]">
      desempenho individual
    </span>
  </div>

  {vendasPorMedico.length === 0 ? (
    <div className="rounded-2xl bg-[var(--muted)] p-5 text-sm text-[var(--muted-foreground)]">
      Nenhuma venda por médico no período.
    </div>
  ) : (
   <div className="grid gap-6 xl:grid-cols-2">
      {vendasPorMedico.map((medico, index) => {
        const totalProdutosMedico =
          medico.produtos?.reduce(
  (acc: number, item: { produto: string; qtd: number }) =>
    acc + Number(item.qtd || 0),
  0
) || 0

        const ticketMedico =
          totalProdutosMedico > 0 ? medico.valor / totalProdutosMedico : 0

        const percentualMeta =
          medico.meta > 0 ? Math.round((medico.valor / medico.meta) * 100) : 0

        const isTop = index === 0

        return (
          <div
            key={medico.nome}
            className="rounded-[26px] border border-[color:var(--border)] bg-[var(--background)] p-5"
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-[#D7B46A]/40 bg-[#D7B46A]/10">
                  {getFotoMedico(medico.nome) ? (
                    <img
                      src={getFotoMedico(medico.nome) || ''}
                      alt={medico.nome}
                      className="h-full w-full object-cover object-center"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-black text-[#D7B46A]">
                      DR
                    </div>
                  )}
                </div>

                <div>
                  {isTop && (
                    <span className="mb-2 inline-flex rounded-full bg-[#D7B46A]/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#D7B46A]">
                      Top vendedor
                    </span>
                  )}

                  <h3 className="text-xl font-black leading-tight text-[var(--foreground)]">
                    {medico.nome}
                  </h3>

                  <p className="mt-1 text-sm font-semibold text-[var(--muted-foreground)]">
                    Procedimentos vendidos
                  </p>
                </div>
              </div>

              <div className="min-w-[180px] text-right">
                <p className="text-2xl font-black text-[var(--foreground)]">
                  {formatMoney(medico.valor)}
                </p>

                <div className="mt-2 h-4 overflow-hidden rounded-full bg-[var(--progress-bg)]">
                  <div
                    className={`h-full rounded-full ${
                      percentualMeta >= 100
                        ? 'bg-emerald-500'
                        : percentualMeta >= 70
                        ? 'bg-yellow-400'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(percentualMeta, 100)}%` }}
                  />
                </div>

                <div className="mt-2 flex justify-between text-xs">
                  <span className="text-[var(--muted-foreground)]">
                    Meta {formatMoney(medico.meta)}
                  </span>

                  <span
                    className={`font-black ${
                      percentualMeta >= 100
                        ? 'text-emerald-500'
                        : percentualMeta >= 70
                        ? 'text-yellow-500'
                        : 'text-red-500'
                    }`}
                  >
                    {percentualMeta}%
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-5 grid grid-cols-3 gap-3">
              <MiniInfo label="Valor vendido" value={formatMoney(medico.valor)} />
              <MiniInfo label="Produtos" value={totalProdutosMedico} />
              <MiniInfo label="Ticket médio" value={formatMoney(ticketMedico)} />
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-black uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                  Produtos vendidos
                </h4>

                <span className="text-xs font-bold text-[var(--muted-foreground)]">
                  qtd.
                </span>
              </div>

              <div className="space-y-3">
                {(medico.produtos || []).map(
                  (item: { produto: string; qtd: number }, itemIndex: number) => (
                    <div
                      key={`${medico.nome}-${item.produto}-${itemIndex}`}
                      className="flex items-center justify-between rounded-2xl bg-[var(--card)] px-4 py-3"
                    >
                      <div>
                        <p className="font-black text-[var(--foreground)]">
                          {item.produto}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-[var(--muted-foreground)]">
                          produto vendido
                        </p>
                      </div>

                      <span className="text-xl font-black text-[var(--foreground)]">
                        {item.qtd}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )}
</section>

      </div>
    </AppShell>
  )
}

function MiniInfo({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[var(--card)] px-4 py-3">
      <p className="text-xs font-bold text-[var(--muted-foreground)]">
        {label}
      </p>

      <p className="mt-2 text-lg font-black text-[var(--foreground)]">
        {value}
      </p>
    </div>
  )
}

function CardMeta({
  title,
  value,
  meta,
  isMoney,
}: {
  title: string
  value: number
  meta: number
  isMoney?: boolean
}) {
  const percentual = meta > 0 ? Math.round((value / meta) * 100) : 0

  return (
    <div className="rounded-[24px] border border-[color:var(--border)] bg-[var(--card)] p-6 shadow-[var(--card-shadow)]">
      <div className="mb-5 flex items-center gap-3">
        <CircleDollarSign className="h-6 w-6 text-[var(--accent)]" />

        <p className="text-sm font-black uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
          {title}
        </p>
      </div>

      <p className="text-[42px] font-black leading-none text-[var(--foreground)]">
        {isMoney ? formatMoney(value) : value}
      </p>

      <div className="mt-5 h-4 overflow-hidden rounded-full bg-[var(--progress-bg)]">
        <div
          className={`h-full rounded-full ${
            percentual >= 100
              ? 'bg-emerald-500'
              : percentual >= 70
              ? 'bg-yellow-400'
              : 'bg-red-500'
          }`}
          style={{ width: `${Math.min(percentual, 100)}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-base font-bold text-[var(--muted-foreground)]">
          Meta {isMoney ? formatMoney(meta) : meta}
        </span>

        <span
          className={`text-2xl font-black ${
            percentual >= 100
              ? 'text-emerald-500'
              : percentual >= 70
              ? 'text-yellow-500'
              : 'text-red-500'
          }`}
        >
          {percentual}%
        </span>
      </div>
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
        statusClass || 'bg-[var(--card)]'
      }`}
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--icon-bg)]">
          <Icon className="h-6 w-6 text-[var(--accent)]" />
        </div>

        <p className="text-sm font-black uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
          {title}
        </p>
      </div>

      <h3 className="text-[40px] font-black tracking-[-0.05em] text-[var(--foreground)]">
        {value}
      </h3>

      {subtitle && (
        <p className="mt-2 text-base font-semibold text-[var(--muted-foreground)]">
          {subtitle}
        </p>
      )}
    </div>
  )
}