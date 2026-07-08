'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { useFilters } from '@/store/use-filters'
import {
  CircleDollarSign,
  TrendingUp,
  TrendingDown,
  Percent,
  Receipt,
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
  comparativo?: {
  comercialVendas?: {
    propostasEnviadasAnterior: number
    propostasFechadasAnterior: number
    propostasPerdidasAnterior: number
    propostasFechadasPercentAnterior: number
    valorTotalVendasAnterior: number
    ticketMedioVendasAnterior: number
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

function formatPercent(v: number) {
  return `${Math.round(v)}%`
}

function metaColor(percentual: number, hasValor: boolean) {
  if (!hasValor) return 'var(--muted-foreground)'
  return percentual >= 100 ? 'var(--success)' : 'var(--danger)'
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
        <div className="rounded-[18px] border border-[color:var(--border)] bg-[var(--card)] p-6">
          Carregando vendas...
        </div>
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell title="Vendas (Procedimentos)">
        <div className="rounded-[18px] border border-[color:var(--danger)]/20 bg-[var(--danger)]/10 p-6 text-[var(--danger)]">
          {error}
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Vendas (Procedimentos)">
      <div className="space-y-5">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
  <CardMini
  icon={Target}
  title="Orçamentos entregues"
  value={funil?.orcamentoEntregue || 0}
  rawValue={funil?.orcamentoEntregue || 0}
  previousValue={data?.comparativo?.comercialVendas?.propostasEnviadasAnterior || 0}
  subtitle="no período"
/>

  <CardMini
    icon={TrendingUp}
    title="Vendas ganhas"
    value={funil?.vendaGanha || 0}
    rawValue={funil?.vendaGanha || 0}
    previousValue={data?.comparativo?.comercialVendas?.propostasFechadasAnterior || 0}
    subtitle="fechamentos"
  />

  <CardMini
    icon={TrendingDown}
    title="Vendas perdidas"
    value={funil?.vendaPerdida || 0}
    rawValue={funil?.vendaPerdida || 0}
    previousValue={data?.comparativo?.comercialVendas?.propostasPerdidasAnterior || 0}
    subtitle="perdidas no período"
  />

 <CardMini
  icon={Percent}
  title="Conversão"
  value={`${Math.round(vendas?.propostasFechadasPercent || 0)}%`}
  rawValue={vendas?.propostasFechadasPercent || 0}
  previousValue={data?.comparativo?.comercialVendas?.propostasFechadasPercentAnterior || 0}
  subtitle="ganhas sobre orçamentos"
/>
</div>

<div className="grid gap-5 md:grid-cols-2">
  <CardMeta
  icon={CircleDollarSign}
  title="Valor vendido"
  value={vendas?.valorTotalVendas || 0}
  meta={metaVendas}
  isMoney
  previousValue={data?.comparativo?.comercialVendas?.valorTotalVendasAnterior || 0}
/>

<CardMeta
  icon={Receipt}
  title="Ticket médio"
  value={vendas?.ticketMedioVendas || 0}
  meta={2800}
  isMoney
  previousValue={data?.comparativo?.comercialVendas?.ticketMedioVendasAnterior || 0}
/>
</div>



       

        <div className="grid gap-5">


          <section className="flex h-full flex-col rounded-[18px] border border-[color:var(--border)] bg-[var(--card)] p-5 transition-colors duration-200 hover:border-[var(--accent)]/30">
            <div className="mb-4 flex items-center gap-3">
              <Package className="h-6 w-6 text-[var(--accent)]" />
              <h2 className="section-title">
                Performance por produto vendido
              </h2>
            </div>

            <div className="max-h-[300px] space-y-4 overflow-y-auto pr-2">
              {produtosVendidos.length === 0 && (
                <div className="rounded-2xl bg-[var(--muted)] p-5 text-sm">
                  Nenhum produto vendido no período.
                </div>
              )}

              {produtosVendidos.map((produto) => {
                const width = Math.max(8, produto.percentual)

                return (
                  <div key={produto.nome}>
                    <div className="mb-1 flex justify-between items-center">
                      <div>
                       <p className="text-[14px] font-semibold">{produto.nome}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {produto.qtd} vendas
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[14px] font-bold">{formatMoney(produto.valor)}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {Math.round(produto.percentual)}%
                        </p>
                      </div>
                    </div>

                    <div className="h-7 rounded-xl bg-[var(--muted)] p-1">
                      <div
                        className="h-full rounded-xl flex items-center px-2 text-white text-[12px] font-semibold"
                        style={{ width: `${width}%`, backgroundColor: 'var(--accent)' }}
                      >
                        {produto.qtd}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>


            <div className="mt-4 border-t border-[color:var(--border)] pt-3">
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

<section className="rounded-[18px] border border-[color:var(--border)] bg-[var(--card)] p-5 transition-colors duration-200 hover:border-[var(--accent)]/30">
 <div className="mb-4 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <Stethoscope className="h-6 w-6 text-[var(--accent)]" />
      <h2 className="section-title">
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
   <div className="grid gap-4">
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
            className="rounded-[18px] border border-[color:var(--border)] bg-[var(--background)] p-4 transition-colors duration-200 hover:border-[var(--accent)]/30"
          >
            <div className="mb-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-[color:var(--accent)]/40 bg-[var(--accent)]/10">
                  {getFotoMedico(medico.nome) ? (
                    <img
                      src={getFotoMedico(medico.nome) || ''}
                      alt={medico.nome}
                      className="h-full w-full object-cover object-center"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-base font-black text-[var(--accent)]">
                      DR
                    </div>
                  )}
                </div>

                <div>
                  {isTop && (
                    <span className="mb-2 inline-flex rounded-full bg-[var(--accent)]/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--accent)]">
                      Top vendedor
                    </span>
                  )}

                  <h3 className="text-[20px] font-black leading-tight text-[var(--foreground)]">
                    {medico.nome}
                  </h3>

                  <p className="mt-1 text-[13px] font-semibold text-[var(--muted-foreground)]">
                    Procedimentos vendidos
                  </p>
                </div>
              </div>

              <div className="min-w-[120px] text-right">
                <p className="text-[22px] font-black text-[var(--foreground)]">
                  {formatMoney(medico.valor)}
                </p>

                <div className="progress-bar mt-2 h-2">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(percentualMeta, 100)}%`,
                      backgroundColor: metaColor(percentualMeta, medico.valor > 0),
                    }}
                  />
                </div>

                <div className="mt-1 flex justify-between text-[11px]">
                  <span className="text-[var(--muted-foreground)]">
                    Meta {formatMoney(medico.meta)}
                  </span>

                  <span
                    className="font-black"
                    style={{ color: metaColor(percentualMeta, medico.valor > 0) }}
                  >
                    {medico.valor > 0 ? `${percentualMeta}%` : '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-2 grid grid-cols-3 gap-2">
              <MiniInfo label="Valor vendido" value={formatMoney(medico.valor)} />
              <MiniInfo label="Produtos" value={totalProdutosMedico} />
              <MiniInfo label="Ticket médio" value={formatMoney(ticketMedico)} />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-black uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                  Produtos vendidos
                </h4>

                <span className="text-xs font-bold text-[var(--muted-foreground)]">
                  qtd.
                </span>
              </div>

              <div className="space-y-1">
                {(medico.produtos || []).map(
                  (item: { produto: string; qtd: number }, itemIndex: number) => (
                    <div
                      key={`${medico.nome}-${item.produto}-${itemIndex}`}
                      className="flex items-center justify-between rounded-lg bg-[var(--card)] px-2 py-1"
                    >
                      <div>
                        <p className="text-[12px] font-semibold text-[var(--foreground)]">
                          {item.produto}
                        </p>

    
                      </div>

                      <span className="text-[13px] font-black text-[var(--foreground)]">
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
    <div className="rounded-[18px] border border-[color:var(--border)] bg-[var(--metric-card)] px-3 py-1.5">
      <p className="metric-label">
        {label}
      </p>

      <p className="mt-1 text-[15px] font-black text-[var(--foreground)]">
        {value}
      </p>
    </div>
  )
}

function CompareRow({ atual, anterior }: { atual: number; anterior: number }) {
  const diff = anterior > 0 ? Math.round(((atual - anterior) / anterior) * 100) : 0
  const positivo = diff > 0
  const negativo = diff < 0

  return (
    <div className="mt-2 flex items-center gap-2 text-[12px] font-black">
      <span
        className={
          positivo ? 'text-[var(--success)]' : negativo ? 'text-[var(--danger)]' : 'text-[var(--muted-foreground)]'
        }
      >
        {positivo ? '▲' : negativo ? '▼' : '＝'} {Math.abs(diff)}%
      </span>

      <span className="text-[var(--muted-foreground)]">vs anterior</span>
    </div>
  )
}

function CardMeta({
  icon: Icon,
  title,
  value,
  meta,
  isMoney,
  previousValue = 0,
}: {
  icon: typeof CircleDollarSign
  title: string
  value: number
  meta: number
  isMoney?: boolean
  previousValue?: number
}) {
  const percentual = meta > 0 ? Math.round((value / meta) * 100) : 0
  const empty = value === 0
  const anterior = Number(previousValue || 0)

  if (empty) {
    return (
      <div className="flex h-full flex-col rounded-[18px] border border-[color:var(--border)] bg-[var(--metric-card)] px-3 py-2 transition-all duration-300 hover:-translate-y-[2px] hover:border-[var(--accent)]/30">
        <div className="flex min-h-[40px] items-center gap-2">
          <Icon className="h-5 w-5 shrink-0 text-[var(--accent)]" />
          <p className="text-[15px] font-black text-[var(--foreground)]">{title}</p>
        </div>

        <div className="mt-3">
          <div className="text-[24px] font-black leading-none text-[var(--muted-foreground)]/40">—</div>
          <p className="mt-2 text-[13px] font-medium text-[var(--muted-foreground)]">Sem dados no período</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col rounded-[18px] border border-[color:var(--border)] bg-[var(--metric-card)] px-3 py-2 transition-all duration-300 hover:-translate-y-[2px] hover:border-[var(--accent)]/30">
      <div className="flex min-h-[40px] items-center gap-2">
        <Icon className="h-5 w-5 shrink-0 text-[var(--accent)]" />
        <p className="text-[15px] font-black text-[var(--foreground)]">{title}</p>
      </div>

      <div className="mt-3">
        <div className="text-[24px] font-black leading-none text-[var(--foreground)]">
          {isMoney ? formatMoney(value) : value}
        </div>

        <div className="progress-bar mt-3 h-2">
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(percentual, 100)}%`,
              backgroundColor: metaColor(percentual, true),
            }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-[13px] font-medium text-[var(--muted-foreground)]">
          <span>Meta {isMoney ? formatMoney(meta) : meta}</span>
          <span className="text-[14px] font-black" style={{ color: metaColor(percentual, true) }}>
            {percentual}%
          </span>
        </div>

        <CompareRow atual={value} anterior={anterior} />
      </div>
    </div>
  )
}

function CardMini({
  icon: Icon,
  title,
  value,
  rawValue,
  previousValue = 0,
  subtitle,
}: {
  icon: typeof CircleDollarSign
  title: string
  value: string | number
  rawValue?: number
  previousValue?: number
  subtitle?: string
}) {
  const atual = Number(rawValue ?? value ?? 0)
  const anterior = Number(previousValue || 0)
  const empty = atual === 0

  if (empty) {
    return (
      <div className="flex h-full flex-col rounded-[18px] border border-[color:var(--border)] bg-[var(--metric-card)] px-3 py-2 transition-all duration-300 hover:-translate-y-[2px] hover:border-[var(--accent)]/30">
        <div className="flex min-h-[40px] items-center gap-2">
          <Icon className="h-5 w-5 shrink-0 text-[var(--accent)]" />
          <p className="text-[15px] font-black text-[var(--foreground)]">{title}</p>
        </div>

        <div className="mt-3">
          <div className="text-[24px] font-black leading-none text-[var(--muted-foreground)]/40">—</div>
          <p className="mt-2 text-[13px] font-medium text-[var(--muted-foreground)]">Sem dados no período</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col rounded-[18px] border border-[color:var(--border)] bg-[var(--metric-card)] px-3 py-2 transition-all duration-300 hover:-translate-y-[2px] hover:border-[var(--accent)]/30">
      <div className="flex min-h-[40px] items-center gap-2">
        <Icon className="h-5 w-5 shrink-0 text-[var(--accent)]" />
        <p className="text-[15px] font-black text-[var(--foreground)]">{title}</p>
      </div>

      <div className="mt-3">
        <div className="text-[24px] font-black leading-none text-[var(--foreground)]">{value}</div>

        {subtitle && (
          <p className="mt-2 text-[13px] font-medium text-[var(--muted-foreground)]">{subtitle}</p>
        )}

        <CompareRow atual={atual} anterior={anterior} />
      </div>
    </div>
  )
}