'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Funnel, Megaphone, Sparkles } from 'lucide-react'
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
  { fundo: 'linear-gradient(135deg,#FBBF24,#F59E0B)', brilho: 'none', texto: '#3B2300' },
  { fundo: 'linear-gradient(135deg,#E2E8F0,#94A3B8)', brilho: 'none', texto: '#0F172A' },
  { fundo: 'linear-gradient(135deg,#FDBA74,#EA580C)', brilho: 'none', texto: '#3A1500' },
  { fundo: 'linear-gradient(135deg,#3B82F6,#7C6CF0 60%,#A855F7)', brilho: 'none', texto: '#FFFFFF' },
]

// Nome da origem sempre em CAIXA ALTA (com espaço no lugar do underline pra
// ler melhor). O valor cru do Kommo continua no title (tooltip).
function formatarOrigem(nome: string) {
  return nome.replace(/_/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase()
}

// Campanha de anúncio vem com nome técnico e comprido (ex:
// RODOLPHO_CONVERSAO_LEADS_WPP_ADV, AD002_R_GERAL_VID..., E04 - ...), bem
// diferente de origens simples como "GOOGLE" ou "LINK BIO | ALTUUS CLINIC".
function ehCampanha(nome: string) {
  const n = nome.trim().toUpperCase()
  return n.includes('_') || /^E\d{2,3}\b/.test(n) || /^AD\d/.test(n) || n.length >= 30
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

const TOP_ORIGENS = 10

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
  // Hover (ou toque/foco) abre o detalhe de uma origem por vez
  const [aberto, setAberto] = useState<string | null>(null)

  // Só as 10 maiores (a lista já vem ordenada por quantidade)
  const principais = origens.slice(0, TOP_ORIGENS)
  const maior = Math.max(...principais.map((o) => o.quantidade), 1)

  // Legenda só com as etapas que existem nas origens exibidas
  const presentes = new Set<EtapaKey>()
  for (const o of principais) for (const e of agruparPorEtapa(o.detalhes)) presentes.add(e.key)

  return (
    <section className="fx-card relative rounded-[28px] border border-[color:var(--border)] bg-[var(--card)]/70 p-5 shadow-[var(--card-shadow)] backdrop-blur-xl backdrop-saturate-150 sm:p-6">
      <div className="relative mb-4 flex flex-wrap items-center justify-between gap-4">
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
              {origens.length > TOP_ORIGENS
                ? `As ${TOP_ORIGENS} principais de ${origens.length} origens · passe o mouse para ver as etapas`
                : 'Passe o mouse sobre uma origem para ver em que etapa do funil cada lead está'}
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

      {principais.length === 0 ? (
        <div className={`relative flex h-[42px] items-center rounded-[18px] border border-[color:var(--border)] px-5 ${isApresentacao ? 'text-[20px]' : 'text-sm'} font-semibold text-[var(--muted-foreground)]`}>
          Sem dados no período
        </div>
      ) : (
        <div className="relative space-y-2">
          {principais.map((item, idx) => {
            const etapas = agruparPorEtapa(item.detalhes)
            const total = item.quantidade || 1
            const ganhos = etapas.find((e) => e.key === 'ganhou')?.quantidade ?? 0
            const pctConvertido = (ganhos / total) * 100
            const presa = primeiraMensagemOrigens.find((c) => c.nome === item.nome)?.quantidade ?? 0
            const pctPresa = (presa / total) * 100
            const aberta = aberto === item.nome
            // As últimas linhas abrem o detalhe pra cima, pra não sair do card
            const paraCima = idx >= Math.ceil(principais.length / 2) && principais.length > 4
            const estilo = ESTILO_RANK[Math.min(idx, 3)]

            return (
              <motion.div
                key={item.nome}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.04, ease: 'easeOut' }}
                className={`relative ${aberta ? 'z-30' : 'z-0'}`}
                onMouseEnter={() => setAberto(item.nome)}
                onMouseLeave={() => setAberto((a) => (a === item.nome ? null : a))}
              >
                <button
                  type="button"
                  onClick={() => setAberto(aberta ? null : item.nome)}
                  onFocus={() => setAberto(item.nome)}
                  className={`block w-full rounded-[18px] border px-4 py-3 text-left transition-colors ${
                    aberta ? 'border-white/20 bg-white/[0.07]' : 'border-white/[0.07] bg-white/[0.03]'
                  }`}
                  aria-expanded={aberta}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-10 min-w-[42px] shrink-0 items-center justify-center rounded-xl px-2 text-[17px] font-extrabold tabular-nums"
                      style={{ background: estilo.fundo, boxShadow: estilo.brilho, color: estilo.texto }}
                      title={`${idx + 1}ª origem com mais leads`}
                    >
                      #{idx + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-2">
                        {ehCampanha(item.nome) && (
                          <span
                            className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#C4B5FD]"
                            style={{ background: 'color-mix(in srgb, #A855F7 20%, transparent)', boxShadow: 'inset 0 0 0 1px rgba(192,132,252,0.35)' }}
                          >
                            <Megaphone size={12} />
                            Campanha
                          </span>
                        )}
                        <h4
                          title={item.nome}
                          className={`${isApresentacao ? 'text-[22px]' : 'text-[17px]'} min-w-0 truncate font-bold uppercase leading-snug text-[var(--foreground)]`}
                        >
                          {formatarOrigem(item.nome)}
                        </h4>
                      </div>

                      {/* Barra grossa: comprimento = tamanho da origem, cores = etapa no Kommo */}
                      <div className="mt-2 h-3.5 w-full overflow-hidden rounded-full bg-[var(--progress-bg)]">
                        <motion.div
                          className="flex h-full overflow-hidden rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max((item.quantidade / maior) * 100, 4)}%` }}
                          transition={{ duration: 0.7, ease: 'easeOut', delay: idx * 0.04 }}
                        >
                          {etapas.map(({ key, quantidade }) => (
                            <span
                              key={key}
                              className="h-full"
                              style={{ width: `${(quantidade / total) * 100}%`, background: ETAPAS[key].cor }}
                            />
                          ))}
                        </motion.div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-4">
                      {presa > 0 && (
                        <span
                          className="hidden items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-[14px] font-semibold text-[var(--warning)] @2xl:inline-flex"
                          style={{ background: 'color-mix(in srgb, var(--warning) 13%, transparent)' }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--warning)]" />
                          {presa} parados na 1ª msg
                        </span>
                      )}
                      <div className="min-w-[76px] text-right">
                        <div className="text-[32px] font-extrabold leading-none tracking-tight tabular-nums text-[var(--foreground)]">
                          {item.quantidade}
                        </div>
                        <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                          recebidos
                        </div>
                      </div>
                    </div>
                  </div>

                  {presa > 0 && (
                    <span
                      className="mt-2 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-[13px] font-semibold text-[var(--warning)] @2xl:hidden"
                      style={{ background: 'color-mix(in srgb, var(--warning) 13%, transparent)' }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--warning)]" />
                      {presa} parados na 1ª msg
                    </span>
                  )}
                </button>

                {/* Detalhe flutuante: não empurra as outras linhas */}
                <AnimatePresence>
                  {aberta && item.detalhes && item.detalhes.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: paraCima ? 6 : -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: paraCima ? 6 : -6, scale: 0.98 }}
                      transition={{ duration: 0.16, ease: 'easeOut' }}
                      className={`absolute inset-x-0 z-40 ${paraCima ? 'bottom-full pb-1.5' : 'top-full pt-1.5'}`}
                    >
                      <div className="rounded-[20px] border border-[var(--glass-border)] bg-[var(--pop)] p-4 shadow-[var(--pop-shadow)]">
                        <div className="flex flex-wrap items-center gap-4">
                          <Rosca etapas={etapas} total={total} pctConvertido={pctConvertido} grande={false} />
                          <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
                            <p className="text-[12px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                              Onde estão no Kommo
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {presa > 0 && (
                                <span
                                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[14px] font-semibold text-[var(--warning)]"
                                  style={{ background: 'color-mix(in srgb, var(--warning) 13%, transparent)' }}
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--warning)]" />
                                  {presa} parados na 1ª msg · {Math.round(pctPresa)}%
                                </span>
                              )}
                              {ganhos > 0 && (
                                <span
                                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[14px] font-bold text-[var(--success)]"
                                  style={{ background: 'color-mix(in srgb, var(--success) 16%, transparent)' }}
                                >
                                  <Sparkles size={14} />
                                  {ganhos} convertido{ganhos > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 @2xl:grid-cols-3 @5xl:grid-cols-4">
                          {etapas.map(({ key, quantidade }) => (
                            <div
                              key={key}
                              className="flex min-w-0 items-center gap-2.5 rounded-lg py-2.5 pl-3 pr-2"
                              style={{
                                background: `color-mix(in srgb, ${ETAPAS[key].cor} 15%, transparent)`,
                                boxShadow: `inset 3px 0 0 ${ETAPAS[key].cor}`,
                              }}
                            >
                              <span className="text-[24px] font-bold leading-none tabular-nums text-[var(--foreground)]">
                                {quantidade}
                              </span>
                              <span className="min-w-0 flex-1 truncate text-[14px] font-semibold leading-none text-[var(--muted-foreground)]">
                                {ETAPAS[key].completo}
                              </span>
                              <span className="shrink-0 text-[13px] font-bold tabular-nums text-[var(--foreground)]/80">
                                {Math.round((quantidade / total) * 100)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}
    </section>
  )
}
