'use client'

import { useRef, useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, UserRound, TrendingUp, TrendingDown } from 'lucide-react'
import { useFilters } from '@/store/use-filters'

export type MedicoPremium = {
  nome: string
  atendimentos?: number
  atendimentosAnterior?: number
  ticketConsulta?: number
  faturamentoConsolidado?: number
  faturamentoConsolidadoAnterior?: number
  percentualMeta?: number
  procedimentos?: number
  capacidadeAgenda?: number
  agendaSemDados?: boolean
  tempoEsperaMedio?: number
  tempoAtendimentoMedio?: number
  noShow?: number
  cancelados?: number
  reagendados?: number
  consultasPrimeiraVez?: number
  retornos?: number
  taxaConversao?: number
  propostasEnviadas?: number
  vendasFechadas?: number
}

function formatMoney(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function formatMoneyShort(v: number) {
  if (v >= 1000000) {
    const x = v / 1000000
    return `R$ ${x % 1 === 0 ? x.toFixed(0) : x.toFixed(1)} mi`
  }
  if (v >= 1000) {
    const x = v / 1000
    return `R$ ${x % 1 === 0 ? x.toFixed(0) : x.toFixed(1)} mil`
  }
  return formatMoney(v)
}

function getAvatar(nome: string) {
  const n = nome.toUpperCase()
  if (n.includes('RODOLPHO')) return '/medicos/rodolpho.png'
  if (n.includes('BRENO')) return '/medicos/breno.png'
  if (n.includes('CLAUDIA')) return '/medicos/claudia.png'
  if (n.includes('JESSICA')) return '/medicos/jessica.png'
  if (n.includes('ALBA')) return '/medicos/alba.png'
  if (n.includes('JOANA')) return '/medicos/joana.jpeg'
  if (n.includes('CATHARINA')) return '/medicos/catharina.jpeg'
  return null
}

function titulo(s: string) {
  return s.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase())
}

// "DR. RODOLPHO REIS" -> "Dr. Rodolpho"; "NUTRICIONISTA JOANA GUARANYS" -> "Nutri Joana"
function nomeCurto(nome: string) {
  const m = nome.match(/^(DRA?\.?|NUTRICIONISTA)\s+(\S+)/i)
  if (m) {
    const pref = /^nutri/i.test(m[1]) ? 'Nutri' : titulo(m[1]).replace(/\.?$/, '.')
    return `${pref} ${titulo(m[2])}`
  }
  return titulo(nome.split(' ').slice(0, 2).join(' '))
}

function corStatus(bom: boolean, alerta: boolean) {
  return bom ? 'var(--success)' : alerta ? 'var(--warning)' : 'var(--danger)'
}

function Delta({ atual, anterior }: { atual?: number; anterior?: number }) {
  if (!anterior || anterior <= 0) return null
  const diff = Math.round((((atual || 0) - anterior) / anterior) * 100)
  if (diff === 0) return null
  const positivo = diff > 0
  const Icone = positivo ? TrendingUp : TrendingDown
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-bold"
      style={{
        color: positivo ? 'var(--success)' : 'var(--danger)',
        background: `color-mix(in srgb, ${positivo ? 'var(--success)' : 'var(--danger)'} 14%, transparent)`,
      }}
    >
      <Icone size={13} />
      {Math.abs(diff)}%
    </span>
  )
}

function Avatar({ nome, tamanho, anel = false }: { nome: string; tamanho: number; anel?: boolean }) {
  const src = getAvatar(nome)
  const miolo = (
    <div
      className="overflow-hidden rounded-full bg-[var(--accent)]/15"
      style={{ width: tamanho, height: tamanho }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={nome} className="h-full w-full object-cover" />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center font-bold text-[var(--accent)]"
          style={{ fontSize: tamanho * 0.38 }}
        >
          {nome.charAt(0)}
        </div>
      )}
    </div>
  )
  if (!anel) return miolo
  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-[5px] rounded-full opacity-90 blur-[10px]"
        style={{ background: 'conic-gradient(from 0deg,#3B82F6,#A855F7,#EC4899,#3B82F6)' }}
      />
      <div
        className="relative rounded-full p-[3px]"
        style={{
          background: 'conic-gradient(from 0deg,#60A5FA,#C084FC,#F472B6,#60A5FA)',
          animation: 'spin-slow 10s linear infinite',
        }}
      >
        <div className="rounded-full bg-[var(--card)] p-[3px]" style={{ animation: 'spin-slow-reverse 10s linear infinite' }}>
          {miolo}
        </div>
      </div>
    </div>
  )
}

function Anel({
  valor,
  cor,
  tamanho,
  children,
}: {
  valor: number
  cor: string
  tamanho: number
  children: ReactNode
}) {
  const r = 40
  const circ = 2 * Math.PI * r
  const len = (Math.min(Math.max(valor, 0), 100) / 100) * circ
  return (
    <div className="relative shrink-0" style={{ width: tamanho, height: tamanho }}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--progress-bg)" strokeWidth="9" />
        <motion.circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          style={{ stroke: cor, filter: `drop-shadow(0 0 6px ${cor})` }}
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${len} ${circ - len}` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}

function Tile({
  label,
  children,
  extra,
  apresentacao,
}: {
  label: string
  children: ReactNode
  extra?: ReactNode
  apresentacao: boolean
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 py-3">
      <p className={`${apresentacao ? 'text-[14px]' : 'text-[12px]'} font-bold uppercase tracking-[0.08em] text-[var(--muted-foreground)]`}>
        {label}
      </p>
      <div className={`${apresentacao ? 'text-[34px]' : 'text-[26px]'} mt-1 font-bold leading-tight tracking-tight text-[var(--foreground)]`}>
        {children}
      </div>
      {extra}
    </div>
  )
}

export function MedicosPremium({ medicos }: { medicos: MedicoPremium[] }) {
  const { viewMode } = useFilters()
  const apresentacao = viewMode === 'apresentacao'
  const [indice, setIndice] = useState(0)
  const direcao = useRef(1)
  const intencao = useRef<ReturnType<typeof setTimeout> | null>(null)

  const total = medicos.length
  const i = Math.min(indice, total - 1)
  const m = medicos[i]

  function ir(novo: number) {
    const alvo = (novo + total) % total
    if (alvo === i) return
    direcao.current = novo > i || (i === total - 1 && alvo === 0) ? 1 : -1
    if (i === 0 && alvo === total - 1) direcao.current = -1
    setIndice(alvo)
  }

  // "Passar o mouse" troca de médico, mas com uma pequena espera pra não
  // trocar sem querer enquanto o cursor só atravessa a faixa.
  function aoEntrar(idx: number) {
    if (intencao.current) clearTimeout(intencao.current)
    intencao.current = setTimeout(() => ir(idx), 70)
  }
  function aoSair() {
    if (intencao.current) clearTimeout(intencao.current)
  }

  const metaPct = m.percentualMeta || 0
  const metaOk = metaPct >= 100
  const ocupacao = m.capacidadeAgenda ?? 0
  const conv = m.taxaConversao || 0

  return (
    <section className="fx-card relative overflow-hidden rounded-[28px] border border-[color:var(--border)] bg-[var(--card)]/60 p-5 shadow-[var(--card-shadow)] backdrop-blur-xl backdrop-saturate-150 sm:p-6">
      <div className="relative mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] ${apresentacao ? 'h-14 w-14' : 'h-10 w-10'}`}>
            <UserRound size={apresentacao ? 28 : 19} className="text-[var(--accent)]" />
          </div>
          <div>
            <h3 className={`${apresentacao ? 'text-[38px]' : 'text-[20px]'} bg-gradient-to-r from-[#60A5FA] via-[#C084FC] to-[#F472B6] bg-clip-text font-black tracking-[-0.02em] text-transparent`}>
              Médicos
            </h3>
            {total > 1 && (
              <p className={`${apresentacao ? 'text-[16px]' : 'text-[13px]'} text-[var(--muted-foreground)]`}>
                <span className="hidden sm:inline">Passe o mouse sobre um médico para trocar</span>
                <span className="sm:hidden">Toque ou deslize para trocar de médico</span>
              </p>
            )}
          </div>
        </div>

        {total > 1 && (
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[13px] font-bold tabular-nums text-[var(--muted-foreground)]">
              <span className="text-[var(--foreground)]">{i + 1}</span> / {total}
            </span>
            {[
              { Icone: ChevronLeft, alvo: i - 1, rotulo: 'Médico anterior' },
              { Icone: ChevronRight, alvo: i + 1, rotulo: 'Próximo médico' },
            ].map(({ Icone, alvo, rotulo }) => (
              <motion.button
                key={rotulo}
                type="button"
                aria-label={rotulo}
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.08 }}
                onClick={() => ir(alvo)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-[var(--foreground)] transition-colors hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/15"
              >
                <Icone size={18} />
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {total > 1 && (
        <div
          className="relative mb-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onMouseLeave={aoSair}
        >
          {medicos.map((md, idx) => {
            const ativo = idx === i
            return (
              <button
                key={md.nome}
                type="button"
                onMouseEnter={() => aoEntrar(idx)}
                onFocus={() => ir(idx)}
                onClick={() => ir(idx)}
                className={`relative flex shrink-0 items-center gap-3 rounded-2xl border px-3 py-2 text-left transition-colors ${
                  ativo ? 'border-white/20' : 'border-white/[0.06] hover:border-white/15'
                }`}
              >
                {ativo && (
                  <motion.span
                    layoutId="medico-ativo"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#3B82F6]/25 via-[#7C6CF0]/25 to-[#A855F7]/25 shadow-[0_8px_24px_rgba(99,102,241,0.25)]"
                  />
                )}
                <span className="relative">
                  <Avatar nome={md.nome} tamanho={apresentacao ? 48 : 38} />
                </span>
                <span className="relative min-w-0">
                  <span className={`block truncate font-bold ${ativo ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'} ${apresentacao ? 'text-[16px]' : 'text-[14px]'}`}>
                    {nomeCurto(md.nome)}
                  </span>
                  <span className={`block text-[12px] font-semibold tabular-nums ${ativo ? 'text-[var(--foreground)]/80' : 'text-[var(--muted-foreground)]/80'}`}>
                    {formatMoneyShort(md.faturamentoConsolidado || 0)}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      )}

      <div className="relative @3xl:min-h-[400px]">
        <AnimatePresence mode="wait" initial={false} custom={direcao.current}>
          <motion.div
            key={m.nome}
            custom={direcao.current}
            variants={{
              entra: (d: number) => ({ opacity: 0, x: d * 48, scale: 0.985 }),
              centro: { opacity: 1, x: 0, scale: 1 },
              sai: (d: number) => ({ opacity: 0, x: d * -48, scale: 0.985 }),
            }}
            initial="entra"
            animate="centro"
            exit="sai"
            transition={{ duration: 0.26, ease: 'easeOut' }}
            drag={total > 1 ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            onDragEnd={(_, info) => {
              if (info.offset.x < -80) ir(i + 1)
              else if (info.offset.x > 80) ir(i - 1)
            }}
            className="grid gap-5 @3xl:grid-cols-[minmax(250px,300px)_1fr]"
          >
            {/* Perfil + meta */}
            <div className="relative flex flex-col items-center overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.06] to-white/[0.02] px-5 pb-5 pt-7 text-center">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-16 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full opacity-60"
                style={{ background: 'radial-gradient(circle, rgba(124,108,240,0.45), transparent 70%)' }}
              />
              <div className="relative">
                <Avatar nome={m.nome} tamanho={apresentacao ? 150 : 112} anel />
              </div>
              <h4 className={`relative mt-4 font-black tracking-tight text-[var(--foreground)] ${apresentacao ? 'text-[30px]' : 'text-[21px]'}`}>
                {titulo(m.nome)}
              </h4>
              <div className={`relative mt-1.5 flex flex-wrap items-center justify-center gap-2 font-medium text-[var(--muted-foreground)] ${apresentacao ? 'text-[17px]' : 'text-[14px]'}`}>
                <span>{m.atendimentos ?? 0} atend.</span>
                <Delta atual={m.atendimentos} anterior={m.atendimentosAnterior} />
                {m.procedimentos !== undefined && (
                  <span>· {m.procedimentos} procedimento{m.procedimentos === 1 ? '' : 's'}</span>
                )}
              </div>

              <div className="relative mt-5 flex w-full items-center justify-center gap-4 rounded-2xl border border-white/[0.07] bg-black/10 px-4 py-3">
                <Anel valor={metaPct} cor={corStatus(metaOk, metaPct >= 50 && !metaOk)} tamanho={apresentacao ? 96 : 76}>
                  <span
                    className={`${apresentacao ? 'text-[24px]' : 'text-[19px]'} font-black leading-none`}
                    style={{ color: corStatus(metaOk, metaPct >= 50 && !metaOk) }}
                  >
                    {Math.round(metaPct)}%
                  </span>
                </Anel>
                <div className="text-left">
                  <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--muted-foreground)]">Alcance da meta</p>
                  <p className={`${apresentacao ? 'text-[18px]' : 'text-[15px]'} font-semibold text-[var(--foreground)]`}>
                    {metaOk ? 'Meta batida' : metaPct >= 50 ? 'No caminho' : 'Abaixo da meta'}
                  </p>
                </div>
              </div>
            </div>

            {/* Números */}
            <div className="min-w-0 space-y-3">
              <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-r from-[#3B82F6]/12 via-[#7C6CF0]/10 to-[#A855F7]/12 px-5 py-4">
                <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">Faturamento consolidado</p>
                <div className="mt-1 flex flex-wrap items-end gap-3">
                  <span className={`bg-gradient-to-r from-[#93C5FD] via-[#C4B5FD] to-[#F9A8D4] bg-clip-text font-black leading-none tracking-tight text-transparent ${apresentacao ? 'text-[68px]' : 'text-[48px]'}`}>
                    {formatMoneyShort(m.faturamentoConsolidado || 0)}
                  </span>
                  <Delta atual={m.faturamentoConsolidado} anterior={m.faturamentoConsolidadoAnterior} />
                </div>
                <p className="mt-1 text-[14px] font-medium text-[var(--muted-foreground)]">
                  Ticket médio <span className="font-bold text-[var(--foreground)]">{formatMoney(m.ticketConsulta || 0)}</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 @4xl:grid-cols-4">
                <Tile label="Ocupação da agenda" apresentacao={apresentacao}
                  extra={
                    !m.agendaSemDados ? (
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--progress-bg)]">
                        <div className="h-full rounded-full" style={{ width: `${Math.min(ocupacao, 100)}%`, background: corStatus(ocupacao >= 80, ocupacao >= 50) }} />
                      </div>
                    ) : null
                  }
                >
                  {m.agendaSemDados ? (
                    <span className="text-[var(--muted-foreground)]" title="Sem agenda sincronizada para esse período ainda">—</span>
                  ) : (
                    <span style={{ color: corStatus(ocupacao >= 80, ocupacao >= 50) }}>{Math.round(ocupacao)}%</span>
                  )}
                </Tile>

                <Tile label="Propostas" apresentacao={apresentacao}>{m.propostasEnviadas ?? 0}</Tile>
                <Tile label="Fechadas" apresentacao={apresentacao}>{m.vendasFechadas ?? 0}</Tile>
                <Tile label="Conversão" apresentacao={apresentacao}
                  extra={
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--progress-bg)]">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(conv, 100)}%`, background: corStatus(conv >= 50, conv >= 25) }} />
                    </div>
                  }
                >
                  <span style={{ color: corStatus(conv >= 50, conv >= 25) }}>{Math.round(conv)}%</span>
                </Tile>

                <Tile label="Pacientes novos" apresentacao={apresentacao}
                  extra={
                    m.retornos !== undefined ? (
                      <p className="mt-1 text-[13px] font-medium text-[var(--muted-foreground)]">
                        {m.retornos} retorno{m.retornos === 1 ? '' : 's'}
                      </p>
                    ) : null
                  }
                >
                  {m.consultasPrimeiraVez ?? 0}
                </Tile>
                <Tile label="Tempo de espera" apresentacao={apresentacao}>
                  {m.agendaSemDados ? '—' : `${m.tempoEsperaMedio ?? 0} min`}
                </Tile>
                <Tile label="Tempo de atendimento" apresentacao={apresentacao}>
                  {m.agendaSemDados ? '—' : `${m.tempoAtendimentoMedio ?? 0} min`}
                </Tile>
                <div className="flex min-w-0 flex-col justify-center gap-1.5 rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 py-3">
                  {[
                    { l: 'No-show', v: m.noShow ?? 0, c: 'var(--danger)' },
                    { l: 'Cancelados', v: m.cancelados ?? 0, c: 'var(--warning)' },
                    { l: 'Reagendados', v: m.reagendados ?? 0, c: '#A855F7' },
                  ].map((x) => (
                    <div key={x.l} className="flex items-center justify-between gap-2 text-[14px] font-medium text-[var(--muted-foreground)]">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ background: x.c }} />
                        {x.l}
                      </span>
                      <span className="font-bold tabular-nums text-[var(--foreground)]">{x.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
