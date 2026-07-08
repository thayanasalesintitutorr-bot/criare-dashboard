'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'

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

function Sparkle({ className, delay }: { className: string; delay: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`pointer-events-none absolute hidden text-[#93C5FD] lg:block ${className}`}
      style={{ animation: 'twinkle 4.5s ease-in-out infinite', animationDelay: delay }}
      fill="currentColor"
    >
      <path d="M12 0l1.8 8.2L22 10l-8.2 1.8L12 20l-1.8-8.2L2 10l8.2-1.8z" />
    </svg>
  )
}

function GhostCard({
  position,
  rotate,
  delay,
  width = 'w-[210px]',
  children,
}: {
  position: string
  rotate: string
  delay: string
  width?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={`pointer-events-none absolute hidden select-none 2xl:block ${position}`}
      style={{ animation: 'float-slow 7s ease-in-out infinite', animationDelay: delay }}
    >
      <div
        className={`${width} rounded-[20px] border border-white/70 bg-white/50 p-4 text-left opacity-45 shadow-[0_20px_50px_rgba(37,99,235,0.10)] backdrop-blur-sm ${rotate}`}
      >
        {children}
      </div>
    </div>
  )
}

const CARD_LABEL = 'text-[10px] font-semibold uppercase tracking-[0.1em] text-[#64748B]'

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
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,#F8FAFF_0%,#EEF4FF_50%,#DCEAFF_100%)] text-[#191b2a]">
      {/* Grid sutil */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(37,99,235,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(37,99,235,0.05)_1px,transparent_1px)] bg-[size:88px_88px]" />

      {/* Noise quase imperceptível */}
      <div
        className="absolute inset-0 opacity-[0.025] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Radial gradients de profundidade */}
      <div className="absolute -left-40 -top-40 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.16),transparent_70%)] blur-[10px]" />
      <div className="absolute -right-32 top-1/3 h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(96,165,250,0.14),transparent_70%)] blur-[10px]" />
      <div className="absolute bottom-[-220px] left-1/2 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.10),transparent_70%)] blur-[10px]" />

      {/* Sparkles */}
      <Sparkle className="left-[38%] top-[15%] h-3 w-3" delay="0s" />
      <Sparkle className="right-[34%] top-[9%] h-4 w-4" delay="1.4s" />
      <Sparkle className="left-[32%] bottom-[22%] h-3 w-3" delay="2.2s" />
      <Sparkle className="right-[30%] bottom-[16%] h-3.5 w-3.5" delay="0.7s" />
      <Sparkle className="right-[42%] top-[46%] h-2.5 w-2.5" delay="3s" />

      {/* Cards abstratos de fundo, simulando o dashboard real */}
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

      <div className="relative flex min-h-screen items-center justify-center px-6 py-16">
        <section className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center text-center">
          <span className="mb-7 inline-flex items-center rounded-full border border-[#BFDBFE]/70 bg-white/50 px-5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#2563EB] shadow-[0_1px_3px_rgba(37,99,235,0.08)] backdrop-blur-md">
            Painel Inteligente
          </span>

          <h1
            className="bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#60A5FA] bg-clip-text text-5xl font-black tracking-[-0.05em] text-transparent sm:text-6xl md:text-7xl"
            style={{ filter: 'drop-shadow(0 8px 18px rgba(37,99,235,0.22))' }}
          >
            Criare
          </h1>

          <h2 className="mt-7 max-w-2xl text-2xl font-semibold tracking-[-0.02em] text-[#1f2233] sm:text-3xl">
            Inteligência para transformar operação em decisão
          </h2>

          <p className="mt-4 max-w-xl text-base text-[#64748B] sm:text-lg">
            Dados, metas e desempenho em uma visão clara para o crescimento da operação.
          </p>

          <Link
            href="/login"
            className="group relative mt-11 inline-flex items-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] px-10 py-4 text-base font-semibold text-white shadow-[0_14px_32px_rgba(37,99,235,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(37,99,235,0.38)]"
          >
            <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent" />
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
