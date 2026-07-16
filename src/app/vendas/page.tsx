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
  Medal,
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
    propostasEnviadas?: number
    produtos?: {
      produto: string
      qtd: number
      valor: number
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

function formatMoneyDecimal(v: number) {
  return v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatPercent(v: number) {
  return `${Math.round(v)}%`
}

function metaColor(percentual: number, hasValor: boolean, sucessoPercent = 100) {
  if (!hasValor) return 'var(--muted-foreground)'
  return percentual >= sucessoPercent ? 'var(--success)' : 'var(--danger)'
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

  const { periodo, tipoData, segmento, dataInicio, dataFim, comparar, compararInicio, compararFim, viewMode } = useFilters()
  const isApresentacao = viewMode === 'apresentacao'

  const [data, setData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [medicoAberto, setMedicoAberto] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)

        let url = `/api/test?periodo=${periodo}&tipo=${tipoData}&segmento=${segmento}`

        if (periodo === 'personalizado' && dataInicio && dataFim) {
          url += `&inicio=${dataInicio}&fim=${dataFim}`
        }

        if (comparar && compararInicio && compararFim) {
          url += `&compararInicio=${compararInicio}&compararFim=${compararFim}`
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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro inesperado')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [periodo, tipoData, segmento, dataInicio, dataFim, comparar, compararInicio, compararFim])

  const vendas = data?.kpis?.comercialVendas
  const funil = data?.funilVendas
  const produtosVendidos = data?.produtosVendidos || []
  const vendasPorMedicoRaw = data?.vendasPorMedico || []

  type MedicoVenda = NonNullable<DashboardResponse['vendasPorMedico']>[number]

  const vendasPorMedico = vendasPorMedicoRaw.reduce((acc: MedicoVenda[], medico) => {
    const nomeNormalizado =
      !medico.nome || medico.nome.trim().toLowerCase() === 'null'
        ? 'Sem médico'
        : medico.nome

    const existente = acc.find((m) => m.nome === nomeNormalizado)

    if (existente) {
      existente.valor += medico.valor || 0
      existente.meta += medico.meta || 0
      existente.propostasEnviadas = (existente.propostasEnviadas || 0) + (medico.propostasEnviadas || 0)
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
        propostasEnviadas: medico.propostasEnviadas || 0,
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
  comparar={comparar}
/>

  <CardMini
    icon={TrendingUp}
    title="Vendas ganhas"
    value={funil?.vendaGanha || 0}
    rawValue={funil?.vendaGanha || 0}
    previousValue={data?.comparativo?.comercialVendas?.propostasFechadasAnterior || 0}
    subtitle="fechamentos"
    comparar={comparar}
  />

  <CardMini
    icon={TrendingDown}
    title="Vendas perdidas"
    value={funil?.vendaPerdida || 0}
    rawValue={funil?.vendaPerdida || 0}
    previousValue={data?.comparativo?.comercialVendas?.propostasPerdidasAnterior || 0}
    subtitle="perdidas no período"
    comparar={comparar}
    allowZero
  />

 <CardMini
  icon={Percent}
  title="Conversão"
  value={`${Math.round(vendas?.propostasFechadasPercent || 0)}%`}
  rawValue={vendas?.propostasFechadasPercent || 0}
  previousValue={data?.comparativo?.comercialVendas?.propostasFechadasPercentAnterior || 0}
  subtitle="ganhas sobre orçamentos"
  formatAnterior={(v) => `${Math.round(v)}%`}
  comparar={comparar}
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
  metaSucessoPercent={70}
  comparar={comparar}
/>

<CardMeta
  icon={Receipt}
  title="Ticket médio"
  value={vendas?.ticketMedioVendas || 0}
  meta={2800}
  isMoney
  previousValue={data?.comparativo?.comercialVendas?.ticketMedioVendasAnterior || 0}
  comparar={comparar}
/>
</div>



       

        <div className="grid gap-5">


          <section className="flex h-full flex-col rounded-[18px] border border-[color:var(--border)] bg-[var(--card)] p-5 transition-colors duration-200 hover:border-[var(--accent)]/30">
            <div className="mb-4 flex items-center gap-3">
              <Package className="h-6 w-6 text-[var(--accent)]" />
              <h2 className={`section-title ${isApresentacao ? '!text-[28px]' : ''}`}>
                Performance por produto vendido
              </h2>
            </div>

            <div className="max-h-[300px] space-y-4 overflow-y-auto pr-2">
              {produtosVendidos.length === 0 && (
                <div className={`rounded-2xl bg-[var(--muted)] p-5 ${isApresentacao ? 'text-[18px]' : 'text-sm'}`}>
                  Nenhum produto vendido no período.
                </div>
              )}

              {produtosVendidos.map((produto) => {
                const width = Math.max(8, produto.percentual)

                return (
                  <div key={produto.nome}>
                    <div className="mb-1 flex justify-between items-center">
                      <div>
                       <p className={`${isApresentacao ? 'text-[20px]' : 'text-[14px]'} font-semibold`}>{produto.nome}</p>
                        <p className={`${isApresentacao ? 'text-[16px]' : 'text-xs'} text-[var(--muted-foreground)]`}>
                          {produto.qtd} vendas
                        </p>
                      </div>

                      <div className="text-right">
                        <p className={`${isApresentacao ? 'text-[20px]' : 'text-[14px]'} font-bold`}>{formatMoney(produto.valor)}</p>
                        <p className={`${isApresentacao ? 'text-[16px]' : 'text-xs'} text-[var(--muted-foreground)]`}>
                          {Math.round(produto.percentual)}%
                        </p>
                      </div>
                    </div>

                    <div className={`${isApresentacao ? 'h-9' : 'h-7'} rounded-xl bg-[var(--muted)] p-1`}>
                      <div
                        className={`h-full rounded-xl flex items-center px-2 text-white ${isApresentacao ? 'text-[16px]' : 'text-[12px]'} font-semibold`}
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
                  <p className={`${isApresentacao ? 'text-[16px]' : 'text-xs'} uppercase text-[var(--muted-foreground)]`}>
                    Total geral
                  </p>
                  <p className={`${isApresentacao ? 'text-[18px]' : 'text-sm'} text-[var(--muted-foreground)] mt-1`}>
                    {totalQtdProdutos} vendas
                  </p>
                </div>

                <div className="text-right">
                  <p className={`${isApresentacao ? 'text-[38px]' : 'text-2xl'} font-black`}>
                    {formatMoney(totalValorProdutos)}
                  </p>
                  <p className={`${isApresentacao ? 'text-[18px]' : 'text-sm'} text-[var(--muted-foreground)]`}>
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
      <h2 className={`section-title ${isApresentacao ? '!text-[28px]' : ''}`}>
        Vendas por médico
      </h2>
    </div>

    <span className={`${isApresentacao ? 'text-[16px]' : 'text-sm'} font-bold text-[var(--muted-foreground)]`}>
      desempenho individual
    </span>
  </div>

  {vendasPorMedico.length === 0 ? (
    <div className={`rounded-2xl bg-[var(--muted)] p-5 ${isApresentacao ? 'text-[18px]' : 'text-sm'} text-[var(--muted-foreground)]`}>
      Nenhuma venda por médico no período.
    </div>
  ) : (
   <div className="grid gap-4">
      {vendasPorMedico.map((medico, index) => {
        const produtosDetalhados = (medico.produtos || []).map(
          (item: { produto: string; qtd: number; valor: number }) => ({
            produto: item.produto,
            qtd: Number(item.qtd || 0),
            valor: Number(item.valor || 0),
            ticketMedio: item.qtd > 0 ? Number(item.valor || 0) / item.qtd : 0,
          })
        )

        const totalProdutosMedico = produtosDetalhados.reduce(
          (acc: number, item: { qtd: number }) => acc + item.qtd,
          0
        )

        const totalValorProdutosMedico = produtosDetalhados.reduce(
          (acc: number, item: { valor: number }) => acc + item.valor,
          0
        )

        const ticketMedioGeralProdutos =
          totalProdutosMedico > 0 ? totalValorProdutosMedico / totalProdutosMedico : 0

        const ticketMedico =
          totalProdutosMedico > 0 ? medico.valor / totalProdutosMedico : 0

        const percentualMeta =
          medico.meta > 0 ? Math.round((medico.valor / medico.meta) * 100) : 0

        const isTop = index === 0
        const produtosAberto = medicoAberto === medico.nome

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
                    <div className={`flex h-full w-full items-center justify-center ${isApresentacao ? 'text-[20px]' : 'text-base'} font-black text-[var(--accent)]`}>
                      DR
                    </div>
                  )}
                </div>

                <div>
                  {isTop && (
                    <span className={`mb-2 inline-flex items-center gap-1 rounded-full bg-[var(--accent)]/15 px-2 py-0.5 ${isApresentacao ? 'text-[14px]' : 'text-[10px]'} font-black uppercase tracking-[0.12em] text-[var(--accent)]`}>
                      <Medal size={isApresentacao ? 16 : 12} strokeWidth={2.5} />
                      Top vendedor
                    </span>
                  )}

                  <h3 className={`${isApresentacao ? 'text-[30px]' : 'text-[20px]'} font-black leading-tight text-[var(--foreground)]`}>
                    {medico.nome}
                  </h3>

                  <p className={`mt-1 ${isApresentacao ? 'text-[18px]' : 'text-[13px]'} font-semibold text-[var(--muted-foreground)]`}>
                    Procedimentos vendidos
                  </p>
                </div>
              </div>

              <div className="min-w-[120px] text-right">
                <p className={`${isApresentacao ? 'text-[32px]' : 'text-[22px]'} font-black text-[var(--foreground)]`}>
                  {formatMoney(medico.valor)}
                </p>

                <div className={`progress-bar mt-2 ${isApresentacao ? 'h-3' : 'h-2'}`}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(percentualMeta, 100)}%`,
                      backgroundColor: metaColor(percentualMeta, medico.valor > 0, 70),
                    }}
                  />
                </div>

                <div className={`mt-1 flex justify-between ${isApresentacao ? 'text-[16px]' : 'text-[11px]'}`}>
                  <span className="text-[var(--muted-foreground)]">
                    Meta {formatMoney(medico.meta)}
                  </span>

                  <span
                    className="font-black"
                    style={{ color: metaColor(percentualMeta, medico.valor > 0, 70) }}
                  >
                    {medico.valor > 0 ? `${percentualMeta}%` : '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <MiniInfo label="Propostas enviadas" value={medico.propostasEnviadas || 0} />
              <MiniInfo
                label="Propostas fechadas"
                value={totalProdutosMedico}
                helper="Clique para ver detalhes"
                active={produtosAberto}
                onClick={() =>
                  setMedicoAberto((atual) => (atual === medico.nome ? null : medico.nome))
                }
              />
              <MiniInfo label="Valor vendido" value={formatMoney(medico.valor)} />
              <MiniInfo label="Ticket médio" value={formatMoney(ticketMedico)} />
            </div>

            {produtosAberto && (
              <div className="flex justify-center">
                <div className="h-0 w-0 border-x-[7px] border-t-[7px] border-x-transparent border-t-[var(--accent)]" />
              </div>
            )}

            {produtosAberto && (
              <div className="mt-2 overflow-hidden rounded-[14px] border border-[color:var(--border)] bg-[var(--card)]">
                <div className="flex items-center justify-between border-b border-[color:var(--border)] px-3 py-2.5">
                  <div>
                    <h4 className="text-sm font-black text-[var(--foreground)]">
                      Detalhamento de produtos
                    </h4>

                    <p className="mt-0.5 text-[11px] font-semibold text-[var(--muted-foreground)]">
                      Visualizando {produtosDetalhados.length} de {produtosDetalhados.length} produtos
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMedicoAberto(null)}
                    className="shrink-0 rounded-lg border border-[color:var(--border)] px-3 py-1.5 text-xs font-bold text-[var(--muted-foreground)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
                  >
                    Recolher
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[440px] border-collapse text-[12px]">
                    <thead>
                      <tr className="bg-[var(--accent)]/5">
                        <th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.06em] text-[var(--accent)]">
                          Produto
                        </th>
                        <th className="px-3 py-2 text-center text-[10px] font-black uppercase tracking-[0.06em] text-[var(--accent)]">
                          Qtd.
                        </th>
                        <th className="px-3 py-2 text-right text-[10px] font-black uppercase tracking-[0.06em] text-[var(--accent)]">
                          Valor
                        </th>
                        <th className="px-3 py-2 text-right text-[10px] font-black uppercase tracking-[0.06em] text-[var(--accent)]">
                          T.M por produto
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {produtosDetalhados.map(
                        (
                          item: { produto: string; qtd: number; valor: number; ticketMedio: number },
                          itemIndex: number
                        ) => (
                          <tr
                            key={`${medico.nome}-${item.produto}-${itemIndex}`}
                            className="border-t border-[color:var(--border)]"
                          >
                            <td className="px-3 py-2 text-left font-semibold text-[var(--foreground)]">
                              {item.produto}
                            </td>
                            <td className="px-3 py-2 text-center font-bold text-[var(--foreground)]">
                              {item.qtd}
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-[var(--foreground)]">
                              {formatMoneyDecimal(item.valor)}
                            </td>
                            <td className="px-3 py-2 text-right font-semibold text-[var(--muted-foreground)]">
                              {formatMoneyDecimal(item.ticketMedio)}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>

                    <tfoot>
                      <tr className="border-t border-[color:var(--border)] bg-[var(--accent)]/10">
                        <td className="px-3 py-2 text-left text-[11px] font-black uppercase tracking-[0.06em] text-[var(--foreground)]">
                          Total
                        </td>
                        <td className="px-3 py-2 text-center font-black text-[var(--foreground)]">
                          {totalProdutosMedico}
                        </td>
                        <td className="px-3 py-2 text-right font-black text-[var(--accent)]">
                          {formatMoneyDecimal(totalValorProdutosMedico)}
                        </td>
                        <td className="px-3 py-2 text-right font-black text-[var(--accent)]">
                          {formatMoneyDecimal(ticketMedioGeralProdutos)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
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

function MiniInfo({
  label,
  value,
  onClick,
  active,
  helper,
}: {
  label: string
  value: string | number
  onClick?: () => void
  active?: boolean
  helper?: string
}) {
  const { viewMode } = useFilters()
  const isApresentacao = viewMode === 'apresentacao'

  const clickable = Boolean(onClick)

  const className = `w-full rounded-[18px] border px-3 py-1.5 text-left transition-colors duration-200 ${
    active
      ? 'border-[var(--accent)] bg-[var(--accent)]/5'
      : 'border-[color:var(--border)] bg-[var(--metric-card)]'
  } ${clickable ? 'cursor-pointer hover:border-[var(--accent)]/50' : ''}`

  const content = (
    <>
      <p className={`metric-label ${isApresentacao ? '!text-[16px]' : ''}`}>
        {label}
      </p>

      <p className={`mt-1 ${isApresentacao ? 'text-[22px]' : 'text-[15px]'} font-black text-[var(--foreground)]`}>
        {value}
      </p>

      {helper && (
        <p
          className={`mt-0.5 ${isApresentacao ? 'text-[14px]' : 'text-[10px]'} font-semibold ${
            active ? 'text-[var(--accent)]' : 'text-[var(--muted-foreground)]'
          }`}
        >
          {helper}
        </p>
      )}
    </>
  )

  if (clickable) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    )
  }

  return <div className={className}>{content}</div>
}

function CompareRow({
  atual,
  anterior,
  anteriorLabel,
}: {
  atual: number
  anterior: number
  anteriorLabel?: string
}) {
  const { viewMode } = useFilters()
  const isApresentacao = viewMode === 'apresentacao'

  const diff = anterior > 0 ? Math.round(((atual - anterior) / anterior) * 100) : 0
  const positivo = diff > 0
  const negativo = diff < 0

  return (
    <div className={`mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 ${isApresentacao ? 'text-[16px]' : 'text-[12px]'} font-black`}>
      <span
        className={
          positivo ? 'text-[var(--success)]' : negativo ? 'text-[var(--danger)]' : 'text-[var(--muted-foreground)]'
        }
      >
        {positivo ? '▲' : negativo ? '▼' : '＝'} {Math.abs(diff)}%
      </span>

      <span className="font-medium text-[var(--muted-foreground)]">
        vs anterior{anteriorLabel ? ` · ${anteriorLabel}` : ''}
      </span>
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
  metaSucessoPercent = 100,
  comparar = false,
}: {
  icon: typeof CircleDollarSign
  title: string
  value: number
  meta: number
  isMoney?: boolean
  previousValue?: number
  metaSucessoPercent?: number
  comparar?: boolean
}) {
  const { viewMode } = useFilters()
  const isApresentacao = viewMode === 'apresentacao'

  const percentual = meta > 0 ? Math.round((value / meta) * 100) : 0
  const empty = value === 0
  const anterior = Number(previousValue || 0)

  if (empty) {
    return (
      <div className="flex h-full flex-col rounded-[18px] border border-[color:var(--border)] bg-[var(--metric-card)] px-3 py-2 transition-all duration-300 hover:-translate-y-[2px] hover:border-[var(--accent)]/30">
        <div className="flex min-h-[40px] items-center gap-2">
          <Icon className="h-5 w-5 shrink-0 text-[var(--accent)]" />
          <p className={`${isApresentacao ? 'text-[22px]' : 'text-[15px]'} font-black text-[var(--foreground)]`}>{title}</p>
        </div>

        <div className="mt-3">
          <div className={`${isApresentacao ? 'text-[40px]' : 'text-[24px]'} font-black leading-none text-[var(--muted-foreground)]/40`}>—</div>
          <p className={`mt-2 ${isApresentacao ? 'text-[18px]' : 'text-[13px]'} font-medium text-[var(--muted-foreground)]`}>Sem dados no período</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col rounded-[18px] border border-[color:var(--border)] bg-[var(--metric-card)] px-3 py-2 transition-all duration-300 hover:-translate-y-[2px] hover:border-[var(--accent)]/30">
      <div className="flex min-h-[40px] items-center gap-2">
        <Icon className="h-5 w-5 shrink-0 text-[var(--accent)]" />
        <p className={`${isApresentacao ? 'text-[22px]' : 'text-[15px]'} font-black text-[var(--foreground)]`}>{title}</p>
      </div>

      <div className="mt-3">
        <div className={`${isApresentacao ? 'text-[40px]' : 'text-[24px]'} font-black leading-none text-[var(--foreground)]`}>
          {isMoney ? formatMoney(value) : value}
        </div>

        <div className={`progress-bar mt-3 ${isApresentacao ? 'h-3' : 'h-2'}`}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(percentual, 100)}%`,
              backgroundColor: metaColor(percentual, true, metaSucessoPercent),
            }}
          />
        </div>

        <div className={`mt-2 flex items-center justify-between ${isApresentacao ? 'text-[18px]' : 'text-[13px]'} font-medium text-[var(--muted-foreground)]`}>
          <span>Meta {isMoney ? formatMoney(meta) : meta}</span>
          <span className={`${isApresentacao ? 'text-[20px]' : 'text-[14px]'} font-black`} style={{ color: metaColor(percentual, true, metaSucessoPercent) }}>
            {percentual}%
          </span>
        </div>

        {comparar && (
          <CompareRow
            atual={value}
            anterior={anterior}
            anteriorLabel={anterior > 0 ? (isMoney ? formatMoney(anterior) : String(anterior)) : undefined}
          />
        )}
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
  formatAnterior = (v: number) => String(Math.round(v)),
  comparar = false,
  allowZero = false,
}: {
  icon: typeof CircleDollarSign
  title: string
  value: string | number
  rawValue?: number
  previousValue?: number
  subtitle?: string
  formatAnterior?: (v: number) => string
  comparar?: boolean
  allowZero?: boolean
}) {
  const { viewMode } = useFilters()
  const isApresentacao = viewMode === 'apresentacao'

  const atual = Number(rawValue ?? value ?? 0)
  const anterior = Number(previousValue || 0)
  const empty = !allowZero && atual === 0

  if (empty) {
    return (
      <div className="flex h-full flex-col rounded-[18px] border border-[color:var(--border)] bg-[var(--metric-card)] px-3 py-2 transition-all duration-300 hover:-translate-y-[2px] hover:border-[var(--accent)]/30">
        <div className="flex min-h-[40px] items-center gap-2">
          <Icon className="h-5 w-5 shrink-0 text-[var(--accent)]" />
          <p className={`${isApresentacao ? 'text-[22px]' : 'text-[15px]'} font-black text-[var(--foreground)]`}>{title}</p>
        </div>

        <div className="mt-3">
          <div className={`${isApresentacao ? 'text-[40px]' : 'text-[24px]'} font-black leading-none text-[var(--muted-foreground)]/40`}>—</div>
          <p className={`mt-2 ${isApresentacao ? 'text-[18px]' : 'text-[13px]'} font-medium text-[var(--muted-foreground)]`}>Sem dados no período</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col rounded-[18px] border border-[color:var(--border)] bg-[var(--metric-card)] px-3 py-2 transition-all duration-300 hover:-translate-y-[2px] hover:border-[var(--accent)]/30">
      <div className="flex min-h-[40px] items-center gap-2">
        <Icon className="h-5 w-5 shrink-0 text-[var(--accent)]" />
        <p className={`${isApresentacao ? 'text-[22px]' : 'text-[15px]'} font-black text-[var(--foreground)]`}>{title}</p>
      </div>

      <div className="mt-3">
        <div className={`${isApresentacao ? 'text-[40px]' : 'text-[24px]'} font-black leading-none text-[var(--foreground)]`}>{value}</div>

        {subtitle && (
          <p className={`mt-2 ${isApresentacao ? 'text-[18px]' : 'text-[13px]'} font-medium text-[var(--muted-foreground)]`}>{subtitle}</p>
        )}

        {comparar && (
          <CompareRow
            atual={atual}
            anterior={anterior}
            anteriorLabel={anterior > 0 ? formatAnterior(anterior) : undefined}
          />
        )}
      </div>
    </div>
  )
}