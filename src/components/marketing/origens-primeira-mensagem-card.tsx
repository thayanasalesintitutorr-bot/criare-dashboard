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

type Categoria = 'andamento' | 'agendado' | 'convertido' | 'perdido'

const ORDEM: Categoria[] = ['andamento', 'agendado', 'convertido', 'perdido']

const COR: Record<Categoria, string> = {
  andamento: '#3B82F6',
  agendado: '#A855F7',
  convertido: 'var(--success)',
  perdido: 'var(--danger)',
}

const LABEL: Record<Categoria, string> = {
  andamento: 'Em andamento',
  agendado: 'Agendados',
  convertido: 'Convertidos',
  perdido: 'Perdidos',
}

// "GANHOU" é a consulta efetivamente convertida (o que a clínica chama de
// gerar venda), "AGENDADO" ainda não aconteceu, qualquer "PERDEU..." é perda
// e o resto é lead ainda em trabalho (1º contato, follow-up, qualificado...).
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

const SIGLAS = new Set(['WPP', 'ADV', 'RMKT', 'LP', 'NPS', 'SAL', 'PCT', 'AD'])

// Nome de campanha vem em CAIXA_ALTA_COM_UNDERLINE; pro card fica mais
// legível como "Claudia Conversao Leads WPP ADV". O nome cru continua no
// title (tooltip) pra quem precisar do valor exato do Kommo.
function formatarOrigem(nome: string) {
  return nome
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((p) => {
      if (p === '|' || p === '-') return p
      const up = p.toUpperCase()
      if (SIGLAS.has(up) || /\d/.test(up)) return up
      return up.charAt(0) + up.slice(1).toLowerCase()
    })
    .join(' ')
}

function agrupar(detalhes: DetalheItem[] = []) {
  const g: Record<Categoria, number> = { andamento: 0, agendado: 0, convertido: 0, perdido: 0 }
  for (const d of detalhes) g[categorizarStatus(d.nome)] += d.quantidade
  return g
}

const RAIO = 36
const CIRC = 2 * Math.PI * RAIO

function Rosca({
  grupos,
  total,
  pctConvertido,
  grande,
}: {
  grupos: Record<Categoria, number>
  total: number
  pctConvertido: number
  grande: boolean
}) {
  const ativos = ORDEM.filter((c) => grupos[c] > 0)
  const folga = ativos.length > 1 ? 2.5 : 0
  let acumulado = 0

  return (
    <div className={`relative shrink-0 ${grande ? 'h-[130px] w-[130px]' : 'h-[92px] w-[92px]'}`}>
      <svg viewBox="0 0 88 88" className="h-full w-full -rotate-90">
        <circle cx="44" cy="44" r={RAIO} fill="none" stroke="var(--progress-bg)" strokeWidth="9" />
        {ativos.map((cat) => {
          const len = Math.max((grupos[cat] / total) * CIRC - folga, 1.5)
          const offset = -acumulado
          acumulado += (grupos[cat] / total) * CIRC
          return (
            <motion.circle
              key={cat}
              cx="44"
              cy="44"
              r={RAIO}
              fill="none"
              strokeWidth="9"
              strokeLinecap="round"
              style={{ stroke: COR[cat] }}
              strokeDashoffset={offset}
              initial={{ strokeDasharray: `0 ${CIRC}` }}
              animate={{ strokeDasharray: `${len} ${CIRC - len}` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          )
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`${grande ? 'text-[26px]' : 'text-[19px]'} font-black leading-none tracking-tight`}
          style={{ color: pctConvertido > 0 ? 'var(--success)' : 'var(--foreground)' }}
        >
          {Math.round(pctConvertido)}%
        </span>
        <span className={`${grande ? 'text-[11px]' : 'text-[9px]'} mt-0.5 font-semibold uppercase tracking-wider text-[var(--muted-foreground)]`}>
          conversão
        </span>
      </div>
    </div>
  )
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

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-[color:var(--border)] bg-[var(--card)]/70 p-5 shadow-[var(--card-shadow)] backdrop-blur-xl backdrop-saturate-150 sm:p-6">
      {/* Aurora de fundo — mesma paleta azul/roxo/rosa da entrada do login */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-28 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.22),transparent_70%)] blur-3xl" />
        <div className="absolute -right-24 top-1/3 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.18),transparent_70%)] blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 h-72 w-96 rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.12),transparent_70%)] blur-3xl" />
      </div>

      <div className="relative mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06]  ${
              isApresentacao ? 'h-14 w-14' : 'h-10 w-10'
            }`}
          >
            <Funnel size={isApresentacao ? 30 : 19} strokeWidth={2.2} className="text-[var(--accent)]" />
          </div>
          <div>
            <h3
              className={`${isApresentacao ? 'text-[38px]' : 'text-[18px]'} bg-gradient-to-r from-[#60A5FA] via-[#C084FC] to-[#F472B6] bg-clip-text font-black tracking-[-0.02em] text-transparent`}
            >
              Origens dos leads
            </h3>
            <p className={`${isApresentacao ? 'text-[16px]' : 'text-[11.5px]'} text-[var(--muted-foreground)]`}>
              De onde vêm os leads e em que etapa do funil cada um está
            </p>
          </div>
        </div>

        <div className={`flex flex-wrap items-center gap-2 ${isApresentacao ? 'text-[16px]' : 'text-[11.5px]'}`}>
          <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
            recebidos <span className="text-[var(--foreground)]">{origensTotal}</span>
          </span>
          <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            <span className="h-2 w-2 rounded-full bg-[var(--warning)]" />
            parados na 1ª msg <span className="text-[var(--foreground)]">{primeiraMensagemTotal}</span>
          </span>
        </div>
      </div>

      <div className={`relative mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 ${isApresentacao ? 'text-[15px]' : 'text-[11.5px]'} text-[var(--muted-foreground)]`}>
        {ORDEM.map((c) => (
          <span key={c} className="flex items-center gap-1.5 font-medium">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: COR[c] }} />
            {LABEL[c]}
          </span>
        ))}
      </div>

      {origens.length === 0 ? (
        <div className={`relative flex h-[42px] items-center rounded-[18px] border border-[color:var(--border)] px-5 ${isApresentacao ? 'text-[20px]' : 'text-sm'} font-semibold text-[var(--muted-foreground)]`}>
          Sem dados no período
        </div>
      ) : (
        <div className="relative max-h-[760px] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 items-start gap-4 @lg:grid-cols-2 @4xl:grid-cols-3">
            {origens.map((item, idx) => {
              const grupos = agrupar(item.detalhes)
              const total = item.quantidade || 1
              const pctConvertido = (grupos.convertido / total) * 100
              const presa = primeiraMensagemOrigens.find((c) => c.nome === item.nome)?.quantidade ?? 0
              const pctPresa = (presa / total) * 100
              const aberto = expandido === item.nome
              const nomeBonito = formatarOrigem(item.nome)

              return (
                <motion.div
                  key={item.nome}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: Math.min(idx, 12) * 0.04, ease: 'easeOut' }}
                  className="group relative"
                >
                  {/* Borda em gradiente que acende no hover, igual aos
                      painéis da home/login */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -inset-px rounded-[22px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                      background:
                        'linear-gradient(120deg, rgba(96,165,250,0.7), rgba(192,132,252,0.7), rgba(244,114,182,0.55), rgba(96,165,250,0.7))',
                      backgroundSize: '300% 300%',
                      animation: 'gradient-border-move 6s linear infinite',
                    }}
                  />
                  <div
                    className={`relative rounded-[21px] border bg-[var(--card)] p-4 transition-colors ${
                      aberto ? 'border-white/15' : 'border-white/[0.07]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandido(aberto ? null : item.nome)}
                      className="block w-full text-left"
                      aria-expanded={aberto}
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="mb-1 flex items-center gap-2">
                            <span className="rounded-md bg-white/[0.07] px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-[var(--muted-foreground)]">
                              #{idx + 1}
                            </span>
                            {grupos.convertido > 0 && (
                              <span
                                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--success)]"
                                style={{ background: 'color-mix(in srgb, var(--success) 16%, transparent)' }}
                              >
                                <Sparkles size={10} />
                                {grupos.convertido} convertido{grupos.convertido > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          <h4
                            title={item.nome}
                            className={`${isApresentacao ? 'text-[22px]' : 'text-[14px]'} line-clamp-2 break-words font-bold leading-snug text-[var(--foreground)]`}
                          >
                            {nomeBonito}
                          </h4>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className={`${isApresentacao ? 'text-[44px]' : 'text-[30px]'} font-black leading-none tracking-tight text-[var(--foreground)] tabular-nums`}>
                            {item.quantidade}
                          </div>
                          <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                            leads
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <Rosca grupos={grupos} total={total} pctConvertido={pctConvertido} grande={isApresentacao} />
                        <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-3 gap-y-2">
                          {ORDEM.map((c) => (
                            <div
                              key={c}
                              className={`rounded-xl px-2.5 py-1.5 ${grupos[c] === 0 ? 'opacity-40' : ''}`}
                              style={{ background: `color-mix(in srgb, ${COR[c]} 11%, transparent)` }}
                            >
                              <div className={`${isApresentacao ? 'text-[22px]' : 'text-[17px]'} font-extrabold leading-none tabular-nums`} style={{ color: COR[c] }}>
                                {grupos[c]}
                              </div>
                              <div className={`${isApresentacao ? 'text-[12px]' : 'text-[9.5px]'} mt-1 font-semibold uppercase tracking-wide text-[var(--muted-foreground)]`}>
                                {LABEL[c]}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
                        {presa > 0 ? (
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${isApresentacao ? 'text-[14px]' : 'text-[10.5px]'} font-semibold text-[var(--warning)]`}
                            style={{ background: 'color-mix(in srgb, var(--warning) 13%, transparent)' }}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-[var(--warning)]" />
                            {presa} parados na 1ª msg · {Math.round(pctPresa)}%
                          </span>
                        ) : (
                          <span />
                        )}
                        <span className="ml-auto flex shrink-0 items-center gap-1 whitespace-nowrap text-[10.5px] font-semibold text-[var(--muted-foreground)] transition-colors group-hover:text-[var(--foreground)]">
                          {aberto ? 'Ocultar etapas' : 'Ver etapas'}
                          <ChevronDown size={13} strokeWidth={2.5} className={`transition-transform duration-200 ${aberto ? 'rotate-180' : ''}`} />
                        </span>
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {aberto && item.detalhes && item.detalhes.length > 0 && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: 'easeOut' }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3.5 space-y-2 border-t border-white/[0.07] pt-3.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                              Onde estão no Kommo
                            </p>
                            {[...item.detalhes]
                              .sort((a, b) => b.quantidade - a.quantidade)
                              .map((d) => {
                                const cat = categorizarStatus(d.nome)
                                const pct = (d.quantidade / total) * 100
                                return (
                                  <div key={d.nome}>
                                    <div className="mb-1 flex items-center justify-between gap-2 text-[12px]">
                                      <span className="flex min-w-0 items-center gap-2 font-medium text-[var(--foreground)]">
                                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: COR[cat] }} />
                                        <span className="truncate">{formatarStatus(d.nome)}</span>
                                      </span>
                                      <span className="shrink-0 font-bold tabular-nums text-[var(--foreground)]">
                                        {d.quantidade}
                                        <span className="ml-1.5 text-[10.5px] font-semibold text-[var(--muted-foreground)]">
                                          {Math.round(pct)}%
                                        </span>
                                      </span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-[var(--progress-bg)]">
                                      <div
                                        className="h-full rounded-full"
                                        style={{ width: `${Math.max(pct, 3)}%`, background: COR[cat] }}
                                      />
                                    </div>
                                  </div>
                                )
                              })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
