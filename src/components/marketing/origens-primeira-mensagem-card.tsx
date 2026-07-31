'use client'

import { Funnel } from 'lucide-react'
import { useFilters } from '@/store/use-filters'

type OrigemItem = {
  nome: string
  quantidade: number
}

export function OrigensPrimeiraMensagemCard({
  origens,
  origensTotal,
  primeiraMensagemOrigens,
  primeiraMensagemTotal,
}: {
  origens: OrigemItem[]
  origensTotal: number
  primeiraMensagemOrigens: OrigemItem[]
  primeiraMensagemTotal: number
}) {
  const { viewMode } = useFilters()
  const isApresentacao = viewMode === 'apresentacao'

  const maiorQuantidade = Math.max(...origens.map((o) => o.quantidade), 1)

  return (
    <section className="rounded-[24px] border border-[color:var(--border)] bg-[var(--card)] p-5 shadow-[var(--card-shadow)]">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex shrink-0 items-center justify-center rounded-xl bg-[var(--metric-card)] ${
              isApresentacao ? 'h-14 w-14' : 'h-9 w-9'
            }`}
          >
            <Funnel size={isApresentacao ? 30 : 18} strokeWidth={2.2} className="text-[var(--accent)]" />
          </div>
          <h3 className={`${isApresentacao ? 'text-[38px]' : 'text-[17px]'} font-bold tracking-[-0.01em] text-[var(--foreground)]`}>
            Origens dos leads
          </h3>
        </div>

        <div className={`flex items-center gap-5 ${isApresentacao ? 'text-[18px]' : 'text-[12px]'}`}>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]" />
            <span className="font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
              recebidos <span className="text-[var(--foreground)]">{origensTotal}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--warning)]" />
            <span className="font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
              parados na 1ª msg <span className="text-[var(--foreground)]">{primeiraMensagemTotal}</span>
            </span>
          </div>
        </div>
      </div>

      {origens.length === 0 ? (
        <div className={`flex h-[42px] items-center rounded-[18px] border border-[color:var(--border)] bg-transparent px-5 ${isApresentacao ? 'text-[20px]' : 'text-sm'} font-semibold text-[var(--muted-foreground)]`}>
          Sem dados no período
        </div>
      ) : (
        <div className={isApresentacao ? 'space-y-6' : 'space-y-4'}>
          {origens.map((item) => {
            const pctDoMaior = (item.quantidade / maiorQuantidade) * 100
            const presaNaPrimeira = primeiraMensagemOrigens.find((c) => c.nome === item.nome)?.quantidade ?? 0
            const pctPresaNaBarra = (presaNaPrimeira / maiorQuantidade) * 100
            const pctPresaNaCampanha = item.quantidade > 0 ? (presaNaPrimeira / item.quantidade) * 100 : 0

            return (
              <div key={item.nome}>
                <div className="mb-1.5 flex items-baseline justify-between gap-4">
                  <span className={`${isApresentacao ? 'text-[22px]' : 'text-[13px]'} truncate font-semibold text-[var(--foreground)]`}>
                    {item.nome}
                  </span>

                  <span className={`shrink-0 tabular-nums ${isApresentacao ? 'text-[24px]' : 'text-[13px]'} font-semibold text-[var(--muted-foreground)]`}>
                    {item.quantidade}
                  </span>
                </div>

                <div className={`relative w-full overflow-hidden rounded-full bg-[var(--progress-bg)] ${isApresentacao ? 'h-4' : 'h-2.5'}`}>
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-[var(--accent)]"
                    style={{ width: `${Math.max(pctDoMaior, 2)}%` }}
                  />
                  {presaNaPrimeira > 0 && (
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-[var(--warning)]"
                      style={{
                        width: `${Math.max(pctPresaNaBarra, 2)}%`,
                        boxShadow: '2px 0 0 0 var(--card)',
                      }}
                    />
                  )}
                </div>

                {presaNaPrimeira > 0 && (
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--warning)]" />
                    <span className={`${isApresentacao ? 'text-[16px]' : 'text-[11px]'} font-medium text-[var(--muted-foreground)]`}>
                      {presaNaPrimeira} parados na 1ª mensagem · {Math.round(pctPresaNaCampanha)}%
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
