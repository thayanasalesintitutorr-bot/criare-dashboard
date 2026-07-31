'use client'

import { Funnel } from 'lucide-react'
import { useFilters } from '@/store/use-filters'
import { usePrimeiraMensagem } from './primeira-mensagem-tile'

type OrigemItem = {
  nome: string
  quantidade: number
}

export function OrigensPrimeiraMensagemCard({
  origens,
  origensTotal,
  periodo,
  dataInicio,
  dataFim,
}: {
  origens: OrigemItem[]
  origensTotal: number
  periodo: string
  dataInicio?: string
  dataFim?: string
}) {
  const { viewMode } = useFilters()
  const isApresentacao = viewMode === 'apresentacao'

  const primeiraMensagem = usePrimeiraMensagem(periodo, dataInicio, dataFim)
  const primeiraMensagemTotal = primeiraMensagem?.total ?? 0
  const porCampanha = primeiraMensagem?.porCampanha ?? []

  return (
    <section className="rounded-[24px] border border-[color:var(--border)] bg-[var(--card)] px-4 py-2 shadow-[var(--card-shadow)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`${
              isApresentacao ? 'h-12 w-12' : 'h-6 w-6'
            } flex shrink-0 items-center justify-center text-[var(--accent)]`}
          >
            <Funnel size={26} />
          </div>
          <h3 className={`${isApresentacao ? 'text-[42px]' : 'text-[20px]'} font-bold tracking-[-0.02em] text-[var(--foreground)]`}>
            Origens dos leads
          </h3>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--accent)]" />
            <span className={`${isApresentacao ? 'text-[20px]' : 'text-[12px]'} font-semibold text-[var(--muted-foreground)]`}>
              leads recebidos ({origensTotal})
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--warning)]" />
            <span className={`${isApresentacao ? 'text-[20px]' : 'text-[12px]'} font-semibold text-[var(--muted-foreground)]`}>
              só 1ª mensagem ({primeiraMensagemTotal})
            </span>
          </div>
        </div>
      </div>

      {origens.length === 0 ? (
        <div className={`flex h-[42px] items-center rounded-[18px] border border-[color:var(--border)] bg-transparent px-5 ${isApresentacao ? 'text-[20px]' : 'text-sm'} font-semibold text-[var(--muted-foreground)]`}>
          Sem dados no período
        </div>
      ) : (
        <div className="space-y-4">
          {origens.map((item) => {
            const pctDoTotal = origensTotal > 0 ? (item.quantidade / origensTotal) * 100 : 0
            // "Sem origem" é só o balde de "não identificado" de cada lado (Kommo x WhatsApp) —
            // não representa os mesmos leads, então cruzar os dois aqui dá número sem sentido.
            const comparavel = item.nome !== 'Sem origem'
            const presaNaPrimeira = comparavel ? porCampanha.find((c) => c.campanha === item.nome)?.qtd ?? 0 : 0
            const pctPresaNaCampanha = item.quantidade > 0 ? (presaNaPrimeira / item.quantidade) * 100 : 0

            return (
              <div key={item.nome}>
                <div className="mb-1 flex items-center justify-between gap-4">
                  <span className={`${isApresentacao ? 'text-[24px]' : 'text-[13px]'} truncate font-medium text-[var(--muted-foreground)]`}>
                    {item.nome}
                  </span>

                  <span className={`${isApresentacao ? 'text-[28px]' : 'text-[14px]'} font-medium text-[var(--foreground)]`}>
                    {item.quantidade}
                  </span>
                </div>

                <div className={`${isApresentacao ? 'h-6' : 'h-3'} relative overflow-hidden rounded-full bg-[var(--progress-bg)]`}>
                  <div
                    className={`${isApresentacao ? 'h-6' : 'h-3'} rounded-full bg-[var(--accent)]`}
                    style={{ width: `${Math.max(pctDoTotal, 4)}%` }}
                  />
                </div>

                {presaNaPrimeira > 0 && (
                  <div className="mt-1 flex items-center justify-between gap-4">
                    <span className={`${isApresentacao ? 'text-[18px]' : 'text-[11px]'} font-medium text-[var(--warning)]`}>
                      {presaNaPrimeira} ficaram só na 1ª mensagem ({Math.round(pctPresaNaCampanha)}%)
                    </span>
                  </div>
                )}

                {presaNaPrimeira > 0 && (
                  <div className={`${isApresentacao ? 'h-3' : 'h-1.5'} relative mt-1 overflow-hidden rounded-full bg-[var(--progress-bg)]`}>
                    <div
                      className={`${isApresentacao ? 'h-3' : 'h-1.5'} rounded-full bg-[var(--warning)]`}
                      style={{ width: `${Math.min(Math.max(pctPresaNaCampanha, 4), 100)}%` }}
                    />
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
