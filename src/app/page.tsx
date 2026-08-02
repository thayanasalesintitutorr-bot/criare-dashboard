'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { GhostCard, Sparkle, CARD_LABEL } from '@/components/landing/ghost-card'

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
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,#F0F6FF_0%,#E1ECFF_45%,#C7DCFF_100%)] text-[#191b2a]">
      {/* Grid sutil, com respiração lenta */}
      <motion.div
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(37,99,235,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(37,99,235,0.06)_1px,transparent_1px)] bg-[size:88px_88px]"
        animate={{ backgroundPosition: ['0px 0px', '88px 88px'] }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      />

      {/* Noise quase imperceptível */}
      <div
        className="absolute inset-0 opacity-[0.025] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Blobs de profundidade, à deriva */}
      <motion.div
        className="absolute -left-40 -top-40 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.18),transparent_70%)] blur-[10px]"
        animate={{ x: [0, 50, -20, 0], y: [0, -40, 25, 0], scale: [1, 1.1, 0.95, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -right-32 top-1/3 h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(96,165,250,0.16),transparent_70%)] blur-[10px]"
        animate={{ x: [0, -40, 30, 0], y: [0, 30, -25, 0], scale: [1, 0.92, 1.08, 1] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[-220px] left-1/2 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.12),transparent_70%)] blur-[10px]"
        animate={{ x: ['-50%', '-46%', '-54%', '-50%'], scale: [1, 1.06, 0.97, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute left-1/4 top-1/4 h-[260px] w-[260px] rounded-full bg-[radial-gradient(circle,rgba(147,197,253,0.22),transparent_70%)] blur-[6px]"
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
      <GhostCard position="left-10 top-16" rotate="rotate-[-6deg]" delay="0s" width="w-[210px]">
        <div className="flex items-center justify-between">
          <p className={CARD_LABEL}>Receita</p>
          <span className="rounded-full bg-[#059669]/10 px-2 py-0.5 text-[10px] font-bold text-[#059669]">
            +{receitaVar.toFixed(1)}%
          </span>
        </div>
        <p className="mt-2 text-xl font-black tracking-[-0.02em] text-[#1f2233]">{formatMoney(receita)}</p>
        <p className="text-[10px] font-medium text-[#94A3B8]">vs. mês anterior</p>
        <svg viewBox="0 0 140 44" className="mt-2 h-11 w-full">
          <polyline
            points={toPoints(receitaSerie)}
            fill="none"
            stroke="#2563EB"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </GhostCard>

      <GhostCard position="right-10 top-16" rotate="rotate-[5deg]" delay="0.8s" width="w-[210px]">
        <p className={CARD_LABEL}>Metas</p>
        <p className="mt-1 text-2xl font-black tracking-[-0.02em] text-[#1f2233]">{meta}%</p>
        <p className="text-[10px] font-medium text-[#94A3B8]">da meta alcançada</p>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#DCEAFF]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#60A5FA]"
            style={{ width: `${meta}%`, transition: 'width 1s ease' }}
          />
        </div>
        <p className="mt-2 text-[10px] font-medium text-[#94A3B8]">
          {formatMoney(metaValor)} / {formatMoney(1000000)}
        </p>
      </GhostCard>

      <GhostCard position="left-10 top-1/2 -translate-y-1/2" rotate="rotate-[-4deg]" delay="1.6s" width="w-[190px]">
        <p className={CARD_LABEL}>Desempenho</p>
        <div className="relative mt-2 flex h-20 w-20 items-center justify-center self-center">
          <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
            <circle cx="40" cy="40" r="34" fill="none" stroke="#DCEAFF" strokeWidth="8" />
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke="#2563EB"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 34}
              strokeDashoffset={2 * Math.PI * 34 * (1 - desempenho / 100)}
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
          </svg>
          <span className="absolute text-lg font-black text-[#1f2233]">{desempenho}%</span>
        </div>
        <p className="mt-2 text-center text-[10px] font-medium text-[#94A3B8]">da meta mensal</p>
      </GhostCard>

      <GhostCard position="right-10 top-1/2 -translate-y-1/2" rotate="rotate-[4deg]" delay="2.4s" width="w-[210px]">
        <p className={CARD_LABEL}>Evolução de Vendas</p>
        <svg viewBox="0 0 140 44" className="mt-2 h-11 w-full">
          <polyline
            points={toPoints(evolucaoSerie)}
            fill="none"
            stroke="#2563EB"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-lg font-black text-[#2563EB]">+{evolucao.toFixed(1)}%</span>
          <span className="text-[10px] font-medium text-[#94A3B8]">vs. mês anterior</span>
        </div>
      </GhostCard>

      <GhostCard position="left-10 bottom-16" rotate="rotate-[-5deg]" delay="1.1s" width="w-[240px]">
        <p className={`${CARD_LABEL} mb-3`}>Funil Comercial</p>
        <div className="flex items-center gap-4">
          <div className="flex shrink-0 flex-col items-center gap-1.5">
            <div className="h-2.5 w-[64px] rounded-sm bg-[#2563EB]/70" />
            <div className="h-2.5 w-[48px] rounded-sm bg-[#2563EB]/58" />
            <div className="h-2.5 w-[32px] rounded-sm bg-[#2563EB]/46" />
            <div className="h-2.5 w-[18px] rounded-sm bg-[#2563EB]/34" />
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <span className="text-[#64748B]">Leads</span>
              <span className="font-bold text-[#1f2233]">{funil.leads.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <span className="text-[#64748B]">Qualificados</span>
              <span className="font-bold text-[#1f2233]">{funil.qualificados.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <span className="text-[#64748B]">Propostas</span>
              <span className="font-bold text-[#1f2233]">{funil.propostas.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <span className="text-[#64748B]">Fechados</span>
              <span className="font-bold text-[#1f2233]">{funil.fechados.toLocaleString('pt-BR')}</span>
            </div>
          </div>
        </div>
      </GhostCard>

      <GhostCard position="right-10 bottom-16" rotate="rotate-[6deg]" delay="1.9s" width="w-[230px]">
        <p className={`${CARD_LABEL} mb-3`}>Top Produtos</p>
        <div className="space-y-2">
          {produtos.map((p) => (
            <div key={p.nome} className="flex items-center gap-2 text-[11px]">
              <span className="w-[64px] shrink-0 text-[#64748B]">{p.nome}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#DCEAFF]">
                <div
                  className="h-full rounded-full bg-[#2563EB]"
                  style={{ width: `${p.percent}%`, transition: 'width 1s ease' }}
                />
              </div>
              <span className="w-8 shrink-0 text-right font-bold text-[#1f2233]">{p.percent}%</span>
            </div>
          ))}
        </div>
      </GhostCard>

      <GhostCard position="left-[26%] top-[10%]" rotate="rotate-[-3deg]" delay="0.4s" width="w-[170px]">
        <p className={CARD_LABEL}>Conversão</p>
        <p className="mt-1 text-xl font-black tracking-[-0.02em] text-[#1f2233]">32%</p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#DCEAFF]">
          <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-[#2563EB] to-[#60A5FA]" />
        </div>
      </GhostCard>

      <GhostCard position="right-[26%] top-[10%]" rotate="rotate-[3deg]" delay="1.3s" width="w-[170px]">
        <p className={CARD_LABEL}>Ticket Médio</p>
        <p className="mt-1 text-xl font-black tracking-[-0.02em] text-[#1f2233]">R$ 1.390</p>
        <p className="text-[10px] font-medium text-[#94A3B8]">por atendimento</p>
      </GhostCard>

      <GhostCard position="left-[24%] bottom-[12%]" rotate="rotate-[4deg]" delay="2.1s" width="w-[170px]">
        <p className={CARD_LABEL}>NPS</p>
        <div className="mt-1 flex items-baseline gap-1">
          <p className="text-xl font-black tracking-[-0.02em] text-[#1f2233]">92</p>
          <span className="text-[10px] font-bold text-[#059669]">Excelente</span>
        </div>
      </GhostCard>

      <GhostCard position="right-[24%] bottom-[12%]" rotate="rotate-[-4deg]" delay="0.9s" width="w-[170px]">
        <p className={CARD_LABEL}>Ocupação</p>
        <p className="mt-1 text-xl font-black tracking-[-0.02em] text-[#1f2233]">78%</p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#DCEAFF]">
          <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-[#2563EB] to-[#60A5FA]" />
        </div>
      </GhostCard>
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-6 py-16">
        <section className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center text-center">
          <span className="mb-7 inline-flex items-center rounded-full border border-[#BFDBFE]/70 bg-white/50 px-5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#2563EB] shadow-[0_1px_3px_rgba(37,99,235,0.08)] backdrop-blur-md">
            Painel Inteligente
          </span>

          <h1
            className="bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#60A5FA] bg-clip-text pr-2 text-5xl font-black leading-[1.15] tracking-[-0.03em] text-transparent sm:text-6xl md:text-7xl"
            style={{ filter: 'drop-shadow(0 8px 18px rgba(37,99,235,0.22))' }}
          >
            Criare
          </h1>

          <h2 className="mt-7 max-w-4xl whitespace-normal text-xl font-semibold tracking-[-0.02em] text-[#1f2233] sm:whitespace-nowrap sm:text-2xl md:text-3xl">
            Inteligência para transformar operação em decisão
          </h2>

          <p className="mt-4 max-w-xl text-base text-[#64748B] sm:text-lg">
            Dados, metas e desempenho em uma visão clara para o crescimento da operação.
          </p>

          <Link
            href="/login"
            className="group relative mt-11 inline-flex items-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] px-10 py-4 text-base font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5"
            style={{ animation: 'glow-pulse 2.8s ease-in-out infinite' }}
          >
            <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent" />
            <span
              className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent"
              style={{ animation: 'shine-sweep 3.2s ease-in-out infinite' }}
            />
            <span className="relative">Acessar painel</span>
            <ArrowRight size={18} className="relative transition-transform duration-300 group-hover:translate-x-1" />
          </Link>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-2.5">
            {['Dados em tempo real', 'Funil comercial', 'Metas inteligentes'].map((texto) => (
              <span
                key={texto}
                className="rounded-full border border-[#DCEAFF] bg-white/55 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#475569] backdrop-blur-sm"
              >
                {texto}
              </span>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
