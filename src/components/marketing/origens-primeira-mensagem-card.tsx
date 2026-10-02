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

type EtapaKey =
  | 'formulario'
  | 'contato'
  | 'nutricao'
  | 'followup'
  | 'qualificado'
  | 'agendado'
  | 'ganhou'
  | 'naoQualificado'
  | 'perdeu'
  | 'outro'

// Cores iguais às etapas do funil CONSULTA no Kommo (mesma ordem do funil),
// pra quem olha o painel reconhecer a etapa pela cor.
const ETAPAS: Record<EtapaKey, { label: string; completo: string; cor: string }> = {
  formulario: { label: 'Formulário', completo: 'Formulário', cor: '#C4B5FD' },
  contato: { label: '1º Contato', completo: '1º Contato', cor: '#8CC5F8' },
  nutricao: { label: 'Nutrição', completo: 'Nutrição', cor: '#FFC9D0' },
  followup: { label: 'Follow-up', completo: 'Follow-up (sem resposta)', cor: '#FFEB3B' },
  qualificado: { label: 'Qualificado', completo: 'Lead qualificado', cor: '#7DF2B7' },
  agendado: { label: 'Agendado', completo: 'Agendado', cor: '#FDFD86' },
  ganhou: { label: 'Ganhou', completo: 'Ganhou (convertido)', cor: '#C4FF66' },
  naoQualificado: { label: 'Não qualif.', completo: 'Perdeu (não qualificado)', cor: '#FF7F8A' },
  perdeu: { label: 'Perdeu', completo: 'Perdeu', cor: '#CDD1D4' },
  outro: { label: 'Outros', completo: 'Outros', cor: '#94A3B8' },
}

const ORDEM: EtapaKey[] = [
  'formulario',
  'contato',
  'nutricao',
  'followup',
  'qualificado',
  'agendado',
  'ganhou',
  'naoQualificado',
  'perdeu',
  'outro',
]

function etapaDoStatus(nomeCompleto: string): EtapaKey {
  const s = nomeCompleto.split('|').pop()?.trim().toUpperCase() ?? ''
  if (s.includes('GANHOU')) return 'ganhou'
  if (s.includes('NÃO QUALIFICADO') || s.includes('NAO QUALIFICADO')) return 'naoQualificado'
  if (s.includes('PERDEU')) return 'perdeu'
  if (s.includes('AGENDADO')) return 'agendado'
  if (s.includes('LEAD QUALIFICADO')) return 'qualificado'
  if (s.includes('FOLLOW')) return 'followup'
  if (s.includes('NUTRI')) return 'nutricao'
  if (s.includes('CONTATO')) return 'contato'
  if (s.includes('FORMUL')) return 'formulario'
  return 'outro'
}

function agruparPorEtapa(detalhes: DetalheItem[] = []) {
  const g: Partial<Record<EtapaKey, number>> = {}
  for (const d of detalhes) {
    const k = etapaDoStatus(d.nome)
    g[k] = (g[k] ?? 0) + d.quantidade
  }
  return ORDEM.filter((k) => (g[k] ?? 0) > 0).map((k) => ({ key: k, quantidade: g[k] as number }))
}

// Ranking em destaque: top 3 com ouro/prata/bronze, resto com o degradê da marca
const ESTILO_RANK = [
  { fundo: 'linear-gradient(135deg,#FBBF24,#F59E0B)', brilho: '0 4px 16px rgba(245,158,11,0.5)', texto: '#3B2300' },
  { fundo: 'linear-gradient(135deg,#E2E8F0,#94A3B8)', brilho: '0 4px 14px rgba(148,163,184,0.45)', texto: '#0F172A' },
  { fundo: 'linear-gradient(135deg,#FDBA74,#EA580C)', brilho: '0 4px 14px rgba(234,88,12,0.45)', texto: '#3A1500' },
  { fundo: 'linear-gradient(135deg,#3B82F6,#7C6CF0 60%,#A855F7)', brilho: '0 4px 14px rgba(99,102,241,0.4)', texto: '#FFFFFF' },
]

const SIGLAS = new Set(['WPP', 'ADV', 'RMKT', 'LP', 'NPS', 'SAL', 'PCT', 'AD'])

// Nome de campanha vem em CAIXA_ALTA_COM_UNDERLINE; no card fica mais
// legível como "Claudia Conversao Leads WPP ADV". O valor cru do Kommo
// continua no title (tooltip).
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

const RAIO = 36
const CIRC = 2 * Math.PI * RAIO

function Rosca({
  etapas,
  total,
  pctConvertido,
  grande,
}: {
  etapas: { key: EtapaKey; quantidade: number }[]
  total: number
  pctConvertido: number
  grande: boolean
}) {
  const folga = etapas.length > 1 ? 2.2 : 0
  let acumulado = 0

  return (
    <div className={`relative shrink-0 ${grande ? 'h-[130px] w-[130px]' : 'h-[116px] w-[116px]'}`}>
      <svg viewBox="0 0 88 88" className="h-full w-full -rotate-90">
        <circle cx="44" cy="44" r={RAIO} fill="none" stroke="var(--progress-bg)" strokeWidth="10" />
        {etapas.map(({ key, quantidade }) => {
          const parte = (quantidade / total) * CIRC
          const len = Math.max(parte - folga, 1.5)
          const offset = -acumulado
          acumulado += parte
          return (
            <motion.circle
              key={key}
              cx="44"
              cy="44"
              r={RAIO}
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              style={{ stroke: ETAPAS[key].cor }}
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
          className={`${grande ? 'text-[28px]' : 'text-[24px]'} font-extrabold leading-none tracking-tight`}
          style={{ color: pctConvertido > 0 ? 'var(--success)' : 'var(--foreground)' }}
        >
          {Math.round(pctConvertido)}%
        </span>
        <span className={`${grande ? 'text-[12px]' : 'text-[11px]'} mt-0.5 font-semibold uppercase tracking-wider text-[var(--muted-foreground)]`}>
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

  // Legenda só com as etapas que existem no período
  const presentes = new Set<EtapaKey>()
  for (const o of origens) for (const e of agruparPorEtapa(o.detalhes)) presentes.add(e.key)

  return (
    <section className="fx-card relative overflow-hidden rounded-[28px] border border-[color:var(--border)] bg-[var(--card)]/70 p-5 shadow-[var(--card-shadow)] backdrop-blur-xl backdrop-saturate-150 sm:p-6">
      <div className="relative mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] ${
              isApresentacao ? 'h-14 w-14' : 'h-10 w-10'
            }`}
          >
            <Funnel size={isApresentacao ? 30 : 19} strokeWidth={2.2} className="text-[var(--accent)]" />
          </div>
          <div>
            <h3
              className={`${isApresentacao ? 'text-[38px]' : 'text-[20px]'} bg-gradient-to-r from-[#60A5FA] via-[#C084FC] to-[#F472B6] bg-clip-text font-black tracking-[-0.02em] text-transparent`}
            >
              Origens dos leads
            </h3>
            <p className={`${isApresentacao ? 'text-[16px]' : 'text-[13.5px]'} text-[var(--muted-foreground)]`}>
              De onde vêm os leads e em que etapa do funil cada um está
            </p>
          </div>
        </div>

        <div className={`flex flex-wrap items-center gap-2 ${isApresentacao ? 'text-[16px]' : 'text-[13px]'}`}>
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

      <div className={`relative mb-4 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 ${isApresentacao ? 'text-[15px]' : 'text-[13px]'} text-[var(--muted-foreground)]`}>
        {ORDEM.filter((k) => presentes.has(k)).map((k) => (
          <span key={k} className="flex items-center gap-1.5 font-semibold">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: ETAPAS[k].cor }} />
            {ETAPAS[k].label}
          </span>
        ))}
      </div>

      {origens.length === 0 ? (
        <div className={`relative flex h-[42px] items-center rounded-[18px] border border-[color:var(--border)] px-5 ${isApresentacao ? 'text-[20px]' : 'text-sm'} font-semibold text-[var(--muted-foreground)]`}>
          Sem dados no período
        </div>
      ) : (
        <div className="relative max-h-[760px] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 items-start gap-4 @lg:grid-cols-2 @6xl:grid-cols-3">
            {origens.map((item, idx) => {
              const etapas = agruparPorEtapa(item.detalhes)
              const total = item.quantidade || 1
              const ganhos = etapas.find((e) => e.key === 'ganhou')?.quantidade ?? 0
              const pctConvertido = (ganhos / total) * 100
              const presa = primeiraMensagemOrigens.find((c) => c.nome === item.nome)?.quantidade ?? 0
              const pctPresa = (presa / total) * 100
              const aberto = expandido === item.nome

              return (
                <motion.div
                  key={item.nome}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: Math.min(idx, 12) * 0.04, ease: 'easeOut' }}
                >
                  <div
                    className={`fx-card-mini group rounded-[21px] border bg-[var(--card)] p-5 transition-colors ${
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
                        <div className="flex min-w-0 items-start gap-3">
                          <span
                            className={`flex shrink-0 items-center justify-center rounded-xl font-extrabold tabular-nums text-white ${
                              isApresentacao ? 'h-14 min-w-[56px] px-2 text-[24px]' : 'h-11 min-w-[44px] px-2 text-[18px]'
                            }`}
                            style={{
                              background: ESTILO_RANK[Math.min(idx, 3)].fundo,
                              boxShadow: ESTILO_RANK[Math.min(idx, 3)].brilho,
                              color: ESTILO_RANK[Math.min(idx, 3)].texto,
                            }}
                            title={`${idx + 1}ª origem com mais leads`}
                          >
                            #{idx + 1}
                          </span>
                          <h4
                            title={item.nome}
                            className={`${isApresentacao ? 'text-[22px]' : 'text-[17px]'} line-clamp-2 min-w-0 break-words pt-0.5 font-bold leading-snug text-[var(--foreground)]`}
                          >
                            {formatarOrigem(item.nome)}
                          </h4>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className={`${isApresentacao ? 'text-[44px]' : 'text-[38px]'} font-extrabold leading-none tracking-tight text-[var(--foreground)] tabular-nums`}>
                            {item.quantidade}
                          </div>
                          <div className="mt-1 text-[12px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                            leads
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <Rosca etapas={etapas} total={total} pctConvertido={pctConvertido} grande={isApresentacao} />
                        <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
                          {presa > 0 && (
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${isApresentacao ? 'text-[15px]' : 'text-[13px]'} font-semibold leading-tight text-[var(--warning)]`}
                              style={{ background: 'color-mix(in srgb, var(--warning) 13%, transparent)' }}
                            >
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--warning)]" />
                              {presa} parados na 1ª msg · {Math.round(pctPresa)}%
                            </span>
                          )}
                          {ganhos > 0 && (
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${isApresentacao ? 'text-[15px]' : 'text-[13px]'} font-bold text-[var(--success)]`}
                              style={{ background: 'color-mix(in srgb, var(--success) 16%, transparent)' }}
                            >
                              <Sparkles size={isApresentacao ? 16 : 14} />
                              {ganhos} convertido{ganhos > 1 ? 's' : ''}
                            </span>
                          )}
                          <span className="flex items-center gap-1 whitespace-nowrap text-[13px] font-semibold text-[var(--muted-foreground)] transition-colors group-hover:text-[var(--foreground)]">
                            {aberto ? 'Ocultar etapas' : 'Ver etapas'}
                            <ChevronDown size={15} strokeWidth={2.5} className={`transition-transform duration-200 ${aberto ? 'rotate-180' : ''}`} />
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-1.5">
                        {etapas.map(({ key, quantidade }) => (
                          <div
                            key={key}
                            className="flex min-w-0 items-center gap-2.5 rounded-lg py-2 pl-3 pr-2"
                            style={{
                              background: `color-mix(in srgb, ${ETAPAS[key].cor} 15%, transparent)`,
                              boxShadow: `inset 3px 0 0 ${ETAPAS[key].cor}`,
                            }}
                          >
                            <span className={`${isApresentacao ? 'text-[22px]' : 'text-[21px]'} font-bold leading-none tabular-nums text-[var(--foreground)]`}>
                              {quantidade}
                            </span>
                            <span className={`${isApresentacao ? 'text-[14px]' : 'text-[13px]'} min-w-0 truncate font-semibold leading-none text-[var(--muted-foreground)]`}>
                              {ETAPAS[key].label}
                            </span>
                          </div>
                        ))}
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
                            <p className="text-[12px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                              Onde estão no Kommo
                            </p>
                            {etapas.map(({ key, quantidade }) => {
                              const pct = (quantidade / total) * 100
                              return (
                                <div key={key}>
                                  <div className="mb-1.5 flex items-center justify-between gap-2 text-[14px]">
                                    <span className="flex min-w-0 items-center gap-2 font-medium text-[var(--foreground)]">
                                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: ETAPAS[key].cor }} />
                                      <span className="truncate">{ETAPAS[key].completo}</span>
                                    </span>
                                    <span className="shrink-0 font-bold tabular-nums text-[var(--foreground)]">
                                      {quantidade}
                                      <span className="ml-1.5 text-[12.5px] font-semibold text-[var(--muted-foreground)]">
                                        {Math.round(pct)}%
                                      </span>
                                    </span>
                                  </div>
                                  <div className="h-3 overflow-hidden rounded-full bg-[var(--progress-bg)]">
                                    <div
                                      className="h-full rounded-full"
                                      style={{ width: `${Math.max(pct, 3)}%`, background: ETAPAS[key].cor }}
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
