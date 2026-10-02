'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Funnel, Sparkles } from 'lucide-react'
import { useFilters } from '@/store/use-filters'

type DetalheItem = {
  nome: string
  quantidade: number
}

type OrigemItem = {
  nome: string
  quantidade: number
  detalhes?: DetalheItem[]
}

type Categoria = 'convertido' | 'agendado' | 'perdido' | 'andamento'

const CORES_CATEGORIA: Record<Categoria, string> = {
  andamento: '#3B82F6',
  agendado: '#A855F7',
  convertido: 'var(--success)',
  perdido: 'var(--danger)',
}

const LABEL_CATEGORIA: Record<Categoria, string> = {
  andamento: 'em andamento',
  agendado: 'agendados',
  convertido: 'convertidos',
  perdido: 'perdidos',
}

// O "nome" de cada item de detalhes vem como "PIPELINE | STATUS" (ex:
// "CONSULTA | GANHOU") — aqui só interessa o status, já que esse card
// sempre olha o funil CONSULTA. Agrupa os status reais do Kommo em 4
// categorias de negócio: "GANHOU" é a consulta efetivamente convertida
// (o que a clínica chama de gerar venda), "AGENDADO" ainda não aconteceu,
// "PERDEU..." (qualquer variante) é perda, e o resto é lead ainda em
// trabalho (1º contato, follow-up, qualificado, formulário...).
function categorizarStatus(nomeCompleto: string): Categoria {
  const status = nomeCompleto.split('|').pop()?.trim().toUpperCase() ?? ''
  if (status.includes('GANHOU')) return 'convertido'
  if (status.includes('PERDEU')) return 'perdido'
  if (status.includes('AGENDADO')) return 'agendado'
  return 'andamento'
}

function formatarStatus(nomeCompleto: string) {
  const status = nomeCompleto.split('|').pop()?.trim() ?? nomeCompleto
  return status
    .toLowerCase()
    .replace(/\[([^\]]+)\]/g, '($1)')
    .replace(/(^|\s)\S/g, (c) => c.toUpperCase())
}

function agruparPorCategoria(detalhes: DetalheItem[] = []) {
  const grupos: Record<Categoria, number> = {
    andamento: 0,
    agendado: 0,
    convertido: 0,
    perdido: 0,
  }
  for (const d of detalhes) {
    grupos[categorizarStatus(d.nome)] += d.quantidade
  }
  return grupos
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
  const [expandido, setExpandido] = useState<string | null>(null)

  const maiorQuantidade = Math.max(...origens.map((o) => o.quantidade), 1)

  return (
    <section className="relative overflow-hidden rounded-[24px] border border-[color:var(--border)] bg-[var(--card)] p-5 shadow-[var(--card-shadow)]">
      {/* Glow discreto no canto, só pra dar a mesma textura "premium" da
          home/login — bem sutil aqui porque é uma tela de trabalho, não
          a vitrine. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full opacity-[0.07] blur-3xl"
        style={{ background: 'radial-gradient(circle, #A855F7, transparent 70%)' }}
      />

      <div className="relative mb-5 flex flex-wrap items-center justify-between gap-4">
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
        <div className={`relative max-h-[560px] overflow-y-auto pr-1 ${isApresentacao ? 'space-y-3' : 'space-y-2'}`}>
          {origens.map((item) => {
            const pctDoMaior = (item.quantidade / maiorQuantidade) * 100
            const presaNaPrimeira = primeiraMensagemOrigens.find((c) => c.nome === item.nome)?.quantidade ?? 0
            const pctPresaNaCampanha = item.quantidade > 0 ? (presaNaPrimeira / item.quantidade) * 100 : 0

            const grupos = agruparPorCategoria(item.detalhes)
            const pctConvertido = item.quantidade > 0 ? (grupos.convertido / item.quantidade) * 100 : 0
            const aberto = expandido === item.nome

            const segmentos = (
              ['andamento', 'agendado', 'convertido', 'perdido'] as Categoria[]
            )
              .map((cat) => ({
                cat,
                quantidade: grupos[cat],
                pct: item.quantidade > 0 ? (grupos[cat] / item.quantidade) * 100 : 0,
              }))
              .filter((s) => s.quantidade > 0)

            return (
              <div
                key={item.nome}
                className="group rounded-2xl border border-transparent px-2.5 py-2.5 transition-colors hover:border-[color:var(--border)] hover:bg-white/[0.025]"
              >
                <button
                  type="button"
                  onClick={() => setExpandido(aberto ? null : item.nome)}
                  className="flex w-full flex-col gap-1.5 text-left"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <span className={`flex min-w-0 items-center gap-1.5 ${isApresentacao ? 'text-[22px]' : 'text-[13px]'} font-semibold text-[var(--foreground)]`}>
                      <ChevronDown
                        size={isApresentacao ? 18 : 13}
                        strokeWidth={2.5}
                        className={`shrink-0 text-[var(--muted-foreground)] transition-transform duration-200 ${aberto ? 'rotate-180' : ''}`}
                      />
                      <span className="truncate">{item.nome}</span>
                      {grupos.convertido > 0 && (
                        <span
                          className="ml-1 inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--success)]"
                          style={{ background: 'color-mix(in srgb, var(--success) 16%, transparent)' }}
                        >
                          <Sparkles size={10} />
                          {grupos.convertido} convertido{grupos.convertido > 1 ? 's' : ''} · {Math.round(pctConvertido)}%
                        </span>
                      )}
                    </span>

                    <span className={`shrink-0 tabular-nums ${isApresentacao ? 'text-[24px]' : 'text-[13px]'} font-semibold text-[var(--muted-foreground)]`}>
                      {item.quantidade}
                    </span>
                  </div>

                  {/* Barra composta: o comprimento mostra o volume da origem
                      em relação à maior, e o preenchimento interno mostra
                      a composição por estágio do funil (cores) — dá pra ver
                      de relance tanto o tamanho quanto "onde estão" os leads. */}
                  <div className={`relative w-full overflow-hidden rounded-full bg-[var(--progress-bg)] ${isApresentacao ? 'h-4' : 'h-2.5'}`}>
                    <div
                      className="flex h-full gap-[1.5px] transition-[width] duration-500 ease-out"
                      style={{ width: `${Math.max(pctDoMaior, 2)}%` }}
                    >
                      {segmentos.map((s) => (
                        <div
                          key={s.cat}
                          className="h-full first:rounded-l-full last:rounded-r-full"
                          style={{ width: `${s.pct}%`, background: CORES_CATEGORIA[s.cat], minWidth: 2 }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    {segmentos
                      .filter((s) => s.cat !== 'convertido')
                      .map((s) => (
                        <span
                          key={s.cat}
                          className={`flex items-center gap-1.5 ${isApresentacao ? 'text-[14px]' : 'text-[11px]'} font-medium text-[var(--muted-foreground)]`}
                        >
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: CORES_CATEGORIA[s.cat] }} />
                          {s.quantidade} {LABEL_CATEGORIA[s.cat]}
                        </span>
                      ))}
                    {presaNaPrimeira > 0 && (
                      <span className={`flex items-center gap-1.5 ${isApresentacao ? 'text-[14px]' : 'text-[11px]'} font-medium text-[var(--muted-foreground)]`}>
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--warning)]" />
                        {presaNaPrimeira} parados na 1ª mensagem · {Math.round(pctPresaNaCampanha)}%
                      </span>
                    )}
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {aberto && item.detalhes && item.detalhes.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className="ml-[22px] mt-2.5 space-y-1.5 border-l border-[color:var(--border)] pl-3">
                        {[...item.detalhes]
                          .sort((a, b) => b.quantidade - a.quantidade)
                          .map((d) => {
                            const cat = categorizarStatus(d.nome)
                            const pct = item.quantidade > 0 ? (d.quantidade / item.quantidade) * 100 : 0
                            return (
                              <div key={d.nome} className="flex items-center gap-2.5">
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: CORES_CATEGORIA[cat] }} />
                                <span className="min-w-0 flex-1 truncate text-[11.5px] text-[var(--muted-foreground)]">
                                  {formatarStatus(d.nome)}
                                </span>
                                <span className="shrink-0 text-[11.5px] font-semibold tabular-nums text-[var(--foreground)]">
                                  {d.quantidade}
                                </span>
                                <span className="w-9 shrink-0 text-right text-[10.5px] tabular-nums text-[var(--muted-foreground)]">
                                  {Math.round(pct)}%
                                </span>
                              </div>
                            )
                          })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
