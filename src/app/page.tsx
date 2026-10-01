'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, Zap, TrendingUp } from 'lucide-react'
import { GhostCard, Sparkle, CARD_LABEL } from '@/components/landing/ghost-card'
import { GlowHover } from '@/components/landing/glow-hover'

function formatMoney(v: number) {
  return v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })
}

function jitter(base: number, amount: number, min = -Infinity, max = Infinity) {
  const next = base + (Math.random() - 0.5) * 2 * amount
  return Math.min(max, Math.max(min, next))
}

function toPoints(series: number[]) {
  const step = 140 / (series.length - 1)
  return series.map((y, i) => `${i * step},${y}`).join(' ')
}

export default function Home() {
  const [receita, setReceita] = useState(1250000)
  const [receitaVar, setReceitaVar] = useState(18.5)
  const [receitaSerie, setReceitaSerie] = useState([32, 30, 34, 22, 26, 14, 18, 4])

  const [meta, setMeta] = useState(75)

  const [desempenho, setDesempenho] = useState(92)

  const [evolucao, setEvolucao] = useState(24.7)
  const [evolucaoSerie, setEvolucaoSerie] = useState([36, 30, 32, 20, 24, 16, 20, 6])

  const [funil, setFunil] = useState({ leads: 1250, qualificados: 860, propostas: 320, fechados: 128 })

  const [produtos, setProdutos] = useState([
    { nome: 'Produto A', percent: 38 },
    { nome: 'Produto B', percent: 27 },
    { nome: 'Produto C', percent: 18 },
    { nome: 'Produto D', percent: 17 },
  ])

  useEffect(() => {
    const id = setInterval(() => {
      setReceita((v) => Math.round(jitter(v, v * 0.006)))
      setReceitaVar((v) => Number(jitter(v, 0.6, 5, 30).toFixed(1)))
      setReceitaSerie((serie) => serie.map((y) => jitter(y, 3, 2, 40)))

      setMeta((v) => Math.round(jitter(v, 2, 40, 98)))
      setDesempenho((v) => Math.round(jitter(v, 2, 55, 99)))

      setEvolucao((v) => Number(jitter(v, 0.8, 5, 40).toFixed(1)))
      setEvolucaoSerie((serie) => serie.map((y) => jitter(y, 3, 2, 40)))

      setFunil((f) => ({
        leads: Math.round(jitter(f.leads, 15, 900, 1600)),
        qualificados: Math.round(jitter(f.qualificados, 10, 600, 1000)),
        propostas: Math.round(jitter(f.propostas, 6, 200, 420)),
        fechados: Math.round(jitter(f.fechados, 3, 80, 180)),
      }))

      setProdutos((ps) => ps.map((p) => ({ ...p, percent: Math.round(jitter(p.percent, 2, 8, 45)) })))
    }, 3200)

    return () => clearInterval(id)
  }, [])

  const metaValor = Math.round((meta / 100) * 1000000)

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05070D] text-white">
      {/* Grid sutil, com respiração lenta */}
      <motion.div
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:88px_88px]"
        animate={{ backgroundPosition: ['0px 0px', '88px 88px'] }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      />

      {/* Noise quase imperceptível */}
      <div
        className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Aurora — blobs vívidos de profundidade, à deriva, em azul/violeta/rosa */}
      <motion.div
        className="absolute -left-40 -top-40 h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.45),transparent_70%)] blur-[20px]"
        animate={{ x: [0, 60, -20, 0], y: [0, -40, 25, 0], scale: [1, 1.12, 0.95, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -right-32 top-1/4 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.4),transparent_70%)] blur-[20px]"
        animate={{ x: [0, -40, 30, 0], y: [0, 30, -25, 0], scale: [1, 0.92, 1.1, 1] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[-260px] left-1/2 h-[560px] w-[780px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.28),transparent_70%)] blur-[20px]"
        animate={{ x: ['-50%', '-46%', '-54%', '-50%'], scale: [1, 1.06, 0.97, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute left-1/4 top-1/4 h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle,rgba(96,165,250,0.3),transparent_70%)] blur-[10px]"
        animate={{ x: [0, 30, -15, 0], y: [0, 25, -20, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Sparkles */}
      <Sparkle className="left-[10%] top-[22%] h-2.5 w-2.5 sm:block" delay="0.3s" />
      <Sparkle className="right-[8%] bottom-[26%] h-3 w-3 sm:block" delay="1.9s" />
      <Sparkle className="left-[38%] top-[15%] h-3 w-3" delay="0s" />
      <Sparkle className="right-[34%] top-[9%] h-4 w-4" delay="1.4s" />
      <Sparkle className="left-[32%] bottom-[22%] h-3 w-3" delay="2.2s" />
      <Sparkle className="right-[30%] bottom-[16%] h-3.5 w-3.5" delay="0.7s" />
      <Sparkle className="right-[42%] top-[46%] h-2.5 w-2.5" delay="3s" />
      <Sparkle className="left-[6%] top-[52%] h-3.5 w-3.5 md:block" delay="2.6s" />
      <Sparkle className="right-[5%] top-[18%] h-2.5 w-2.5 md:block" delay="1s" />

      {/* Cards abstratos de fundo, simulando o dashboard real — some perto do centro pra não brigar com o texto */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          maskImage: 'radial-gradient(ellipse 52% 58% at center, transparent 15%, black 68%)',
          WebkitMaskImage: 'radial-gradient(ellipse 52% 58% at center, transparent 15%, black 68%)',
        }}
      >
      <GhostCard position="left-6 top-10" rotate="rotate-[-6deg]" delay="0s" width="w-[260px]">
        <div className="flex items-center justify-between">
          <p className={CARD_LABEL}>Receita</p>
          <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
            +{receitaVar.toFixed(1)}%
          </span>
        </div>
        <p className="mt-2 text-xl font-black tracking-[-0.02em] text-white">{formatMoney(receita)}</p>
        <p className="text-[10px] font-medium text-slate-500">vs. mês anterior</p>
        <svg viewBox="0 0 140 44" className="mt-2 h-11 w-full">
          <polyline
            points={toPoints(receitaSerie)}
            fill="none"
            stroke="#60A5FA"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </GhostCard>

      <GhostCard position="right-6 top-10" rotate="rotate-[5deg]" delay="0.8s" width="w-[260px]">
        <p className={CARD_LABEL}>Metas</p>
        <p className="mt-1 text-2xl font-black tracking-[-0.02em] text-white">{meta}%</p>
        <p className="text-[10px] font-medium text-slate-500">da meta alcançada</p>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#3B82F6] to-[#A855F7]"
            style={{ width: `${meta}%`, transition: 'width 1s ease' }}
          />
        </div>
        <p className="mt-2 text-[10px] font-medium text-slate-500">
          {formatMoney(metaValor)} / {formatMoney(1000000)}
        </p>
      </GhostCard>

      <GhostCard position="left-6 top-1/2 -translate-y-1/2" rotate="rotate-[-4deg]" delay="1.6s" width="w-[230px]">
        <p className={CARD_LABEL}>Desempenho</p>
        <div className="relative mt-2 flex h-20 w-20 items-center justify-center self-center">
          <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
            <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke="#60A5FA"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 34}
              strokeDashoffset={2 * Math.PI * 34 * (1 - desempenho / 100)}
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
          </svg>
          <span className="absolute text-lg font-black text-white">{desempenho}%</span>
        </div>
        <p className="mt-2 text-center text-[10px] font-medium text-slate-500">da meta mensal</p>
      </GhostCard>

      <GhostCard position="right-6 top-1/2 -translate-y-1/2" rotate="rotate-[4deg]" delay="2.4s" width="w-[260px]">
        <p className={CARD_LABEL}>Evolução de Vendas</p>
        <svg viewBox="0 0 140 44" className="mt-2 h-11 w-full">
          <polyline
            points={toPoints(evolucaoSerie)}
            fill="none"
            stroke="#C084FC"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-lg font-black text-[#C084FC]">+{evolucao.toFixed(1)}%</span>
          <span className="text-[10px] font-medium text-slate-500">vs. mês anterior</span>
        </div>
      </GhostCard>

      <GhostCard position="left-6 bottom-10" rotate="rotate-[-5deg]" delay="1.1s" width="w-[290px]">
        <p className={`${CARD_LABEL} mb-3`}>Funil Comercial</p>
        <div className="flex items-center gap-4">
          <div className="flex shrink-0 flex-col items-center gap-1.5">
            <div className="h-2.5 w-[64px] rounded-sm bg-[#60A5FA]/70" />
            <div className="h-2.5 w-[48px] rounded-sm bg-[#60A5FA]/58" />
            <div className="h-2.5 w-[32px] rounded-sm bg-[#60A5FA]/46" />
            <div className="h-2.5 w-[18px] rounded-sm bg-[#60A5FA]/34" />
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <span className="text-slate-400">Leads</span>
              <span className="font-bold text-white">{funil.leads.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <span className="text-slate-400">Qualificados</span>
              <span className="font-bold text-white">{funil.qualificados.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <span className="text-slate-400">Propostas</span>
              <span className="font-bold text-white">{funil.propostas.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <span className="text-slate-400">Fechados</span>
              <span className="font-bold text-white">{funil.fechados.toLocaleString('pt-BR')}</span>
            </div>
          </div>
        </div>
      </GhostCard>

      <GhostCard position="right-6 bottom-10" rotate="rotate-[6deg]" delay="1.9s" width="w-[280px]">
        <p className={`${CARD_LABEL} mb-3`}>Top Produtos</p>
        <div className="space-y-2">
          {produtos.map((p) => (
            <div key={p.nome} className="flex items-center gap-2 text-[11px]">
              <span className="w-[64px] shrink-0 text-slate-400">{p.nome}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#3B82F6] to-[#A855F7]"
                  style={{ width: `${p.percent}%`, transition: 'width 1s ease' }}
                />
              </div>
              <span className="w-8 shrink-0 text-right font-bold text-white">{p.percent}%</span>
            </div>
          ))}
        </div>
      </GhostCard>

      <GhostCard position="left-[24%] top-[8%]" rotate="rotate-[-3deg]" delay="0.4s" width="w-[200px]">
        <p className={CARD_LABEL}>Conversão</p>
        <p className="mt-1 text-xl font-black tracking-[-0.02em] text-white">32%</p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-[#3B82F6] to-[#A855F7]" />
        </div>
      </GhostCard>

      <GhostCard position="right-[24%] top-[8%]" rotate="rotate-[3deg]" delay="1.3s" width="w-[200px]">
        <p className={CARD_LABEL}>Ticket Médio</p>
        <p className="mt-1 text-xl font-black tracking-[-0.02em] text-white">R$ 1.390</p>
        <p className="text-[10px] font-medium text-slate-500">por atendimento</p>
      </GhostCard>

      <GhostCard position="left-[22%] bottom-[10%]" rotate="rotate-[4deg]" delay="2.1s" width="w-[200px]">
        <p className={CARD_LABEL}>NPS</p>
        <div className="mt-1 flex items-baseline gap-1">
          <p className="text-xl font-black tracking-[-0.02em] text-white">92</p>
          <span className="text-[10px] font-bold text-emerald-400">Excelente</span>
        </div>
      </GhostCard>

      <GhostCard position="right-[22%] bottom-[10%]" rotate="rotate-[-4deg]" delay="0.9s" width="w-[200px]">
        <p className={CARD_LABEL}>Ocupação</p>
        <p className="mt-1 text-xl font-black tracking-[-0.02em] text-white">78%</p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-[#3B82F6] to-[#A855F7]" />
        </div>
      </GhostCard>
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-6 py-16">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="relative z-10 mx-auto w-full max-w-3xl"
        >
          {/* Moldura com gradiente animado — a "borda de vidro premium" do painel central */}
          <div
            className="relative rounded-[38px] p-[1.5px] shadow-[0_40px_120px_rgba(59,130,246,0.25)]"
            style={{
              background:
                'linear-gradient(120deg, rgba(59,130,246,0.7), rgba(168,85,247,0.7), rgba(236,72,153,0.55), rgba(59,130,246,0.7))',
              backgroundSize: '300% 300%',
              animation: 'gradient-border-move 8s linear infinite',
            }}
          >
            {/* Painel de vidro central — o "palco" do hero. Fundo escuro quase
                opaco de propósito: como a borda em gradiente vivo fica a 1.5px
                de distância, um vidro muito transparente deixaria o blur
                "engolir" o painel inteiro com a cor da borda em vez de só
                deixar vazar um brilho sutil nas bordas. */}
            <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[#0A0E18]/85 px-7 py-12 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-2xl backdrop-saturate-150 sm:px-14 sm:py-16">
              {/* Halo pulsante atrás do título */}
              <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-[18%] h-[260px] w-[560px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.5),transparent_70%)] blur-[50px]"
                style={{ animation: 'halo-pulse 5s ease-in-out infinite' }}
              />

              {/* Brilho de vidro no topo do painel */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
              />

              <div className="relative flex flex-col items-center text-center">
                {/* Selo com borda em gradiente animado */}
                <div
                  className="mb-7 rounded-full p-[1.5px]"
                  style={{
                    background:
                      'linear-gradient(120deg, rgba(96,165,250,0.95), rgba(192,132,252,0.95), rgba(244,114,182,0.9), rgba(96,165,250,0.95))',
                    backgroundSize: '300% 300%',
                    animation: 'gradient-border-move 5s linear infinite',
                  }}
                >
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#05070D]/90 px-5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#C4B5FD] backdrop-blur-md">
                    <Sparkles size={12} className="shrink-0" />
                    Painel Inteligente
                  </span>
                </div>

                <motion.h1
                  initial={{ opacity: 0, scale: 0.8, y: 14 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                  className="bg-gradient-to-r from-[#60A5FA] via-[#C084FC] to-[#F472B6] bg-clip-text pr-2 text-6xl font-black leading-[1.1] tracking-[-0.03em] text-transparent sm:text-7xl md:text-8xl"
                  style={{
                    backgroundSize: '200% 100%',
                    animation: 'text-shimmer 4s ease-in-out infinite',
                  }}
                >
                  Criare
                </motion.h1>

                <h2 className="mt-7 max-w-4xl whitespace-normal text-xl font-semibold tracking-[-0.02em] text-white sm:whitespace-nowrap sm:text-2xl md:text-3xl">
                  Inteligência para transformar operação em decisão
                </h2>

                <p className="mt-4 max-w-xl text-base text-slate-400 sm:text-lg">
                  Dados, metas e desempenho em uma visão clara para o crescimento da operação.
                </p>

                <GlowHover magnetic strength={10} className="mt-11 rounded-2xl">
                  <Link
                    href="/login"
                    className="group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#3B82F6] via-[#7C6CF0] to-[#A855F7] px-10 py-4 text-base font-semibold text-white transition-transform duration-300"
                    style={{ animation: 'glow-pulse 2.8s ease-in-out infinite' }}
                  >
                    <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent" />
                    <span
                      className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                      style={{ animation: 'shine-sweep 3.2s ease-in-out infinite' }}
                    />
                    <span className="relative">Acessar painel</span>
                    <ArrowRight size={18} className="relative transition-transform duration-300 group-hover:translate-x-1.5" />
                  </Link>
                </GlowHover>

                {/* Tira de métricas vivas dentro do próprio vidro do hero */}
                <div className="mt-10 grid w-full grid-cols-3 gap-3 sm:max-w-md">
                  {[
                    { label: 'Receita', valor: formatMoney(receita), icon: TrendingUp },
                    { label: 'Meta', valor: `${meta}%`, icon: Sparkles },
                    { label: 'Desempenho', valor: `${desempenho}%`, icon: Zap },
                  ].map(({ label, valor, icon: Icon }) => (
                    <div
                      key={label}
                      className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-md"
                    >
                      <div className="flex items-center justify-center gap-1 text-[#A78BFA]">
                        <Icon size={12} />
                        <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                          {label}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs font-black tracking-[-0.01em] text-white sm:text-base">
                        {valor}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
                  {['Dados em tempo real', 'Funil comercial', 'Metas inteligentes'].map((texto) => (
                    <GlowHover key={texto} className="rounded-full">
                      <span className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 backdrop-blur-sm transition-colors duration-300 group-hover:border-[#A78BFA]/40 group-hover:text-[#C4B5FD]">
                        {texto}
                      </span>
                    </GlowHover>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </main>
  )
}
