'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  Bell,
  Stethoscope,
  HeartPulse,
  Users,
  Activity,
  ClipboardCheck,
} from 'lucide-react'
import { useAuth } from '@/store/use-auth'
import { GhostCard, CARD_LABEL } from '@/components/landing/ghost-card'
import { FloatingIcon } from '@/components/landing/floating-icon'
import { GlowHover } from '@/components/landing/glow-hover'
import { Wordmark } from '@/components/landing/wordmark'

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

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()

  const [etapa, setEtapa] = useState<'escolha' | 'form'>('escolha')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Dados de fundo, vivos igual na página inicial
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

  async function handleLogin() {
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password.trim(),
        }),
      })

      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(json.error || 'E-mail ou senha incorretos')
        setLoading(false)
        return
      }

      router.push(json.role === 'marketing' ? '/marketing' : '/dashboard')
    } catch {
      setError('Não foi possível entrar agora. Tente novamente.')
      setLoading(false)
    }
  }
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#05070D] text-white">
      {/* Animação sutil de fundo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 60, -20, 0], y: [0, -40, 25, 0], scale: [1, 1.1, 0.95, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -left-32 -top-32 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.4),transparent_70%)] blur-[30px]"
        />
        <motion.div
          animate={{ x: [0, -40, 40, 0], y: [0, 25, -30, 0], scale: [1, 0.95, 1.1, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-32 -right-32 h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.35),transparent_70%)] blur-[30px]"
        />
        <motion.div
          animate={{ x: [0, 20, -15, 0], y: [0, -20, 15, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-1/2 top-1/3 h-[340px] w-[340px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.25),transparent_70%)] blur-[20px]"
        />
        <motion.div
          animate={{ x: [0, -25, 15, 0], y: [0, 15, -25, 0], scale: [1, 1.08, 0.94, 1] }}
          transition={{ duration: 19, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-[-10%] left-[8%] h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle,rgba(96,165,250,0.3),transparent_70%)] blur-[15px]"
        />

        {/* Grid sutil, com respiração lenta */}
        <motion.div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
          animate={{ backgroundPosition: ['0px 0px', '60px 60px'] }}
          transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
        />

        {/* Partículas */}
        {[
          { top: '18%', left: '14%', size: 12, delay: 0 },
          { top: '28%', left: '82%', size: 16, delay: 1.2 },
          { top: '68%', left: '10%', size: 10, delay: 2.4 },
          { top: '76%', left: '88%', size: 14, delay: 0.6 },
          { top: '12%', left: '52%', size: 10, delay: 1.8 },
        ].map((p, i) => (
          <motion.svg
            key={i}
            viewBox="0 0 24 24"
            fill="currentColor"
            className="absolute hidden text-[#A5B4FC] sm:block"
            style={{ top: p.top, left: p.left, width: p.size, height: p.size }}
            animate={{ opacity: [0.15, 0.7, 0.15], scale: [0.85, 1.1, 0.85] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
          >
            <path d="M12 0l1.8 8.2L22 10l-8.2 1.8L12 20l-1.8-8.2L2 10l8.2-1.8z" />
          </motion.svg>
        ))}
      </div>

      {/* Cards fantasma, iguais aos da página inicial (maiores e vivos), mais perto do centro */}
      <GhostCard position="left-[4%] top-[8%]" rotate="rotate-[-6deg]" delay="0s" width="w-[260px]" breakpoint="lg">
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

      <GhostCard position="right-[4%] top-[8%]" rotate="rotate-[5deg]" delay="0.8s" width="w-[260px]" breakpoint="lg">
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

      <GhostCard position="left-[3%] top-1/2 -translate-y-1/2" rotate="rotate-[-4deg]" delay="1.6s" width="w-[230px]" breakpoint="lg">
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

      <GhostCard position="right-[3%] top-1/2 -translate-y-1/2" rotate="rotate-[4deg]" delay="2.4s" width="w-[260px]" breakpoint="lg">
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

      <GhostCard position="left-[4%] bottom-[8%]" rotate="rotate-[-5deg]" delay="1.1s" width="w-[290px]" breakpoint="lg">
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

      <GhostCard position="right-[4%] bottom-[8%]" rotate="rotate-[6deg]" delay="1.9s" width="w-[280px]" breakpoint="lg">
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

      {/* Ícones soltos — mais pontos interativos no fundo, sem dados dentro */}
      <FloatingIcon icon={Bell} position="left-1/2 top-[3%] -translate-x-1/2" delay="0.2s" size={44} breakpoint="lg" />
      <FloatingIcon icon={Stethoscope} position="left-[1%] top-[32%]" delay="1.4s" size={52} breakpoint="lg" />
      <FloatingIcon icon={HeartPulse} position="right-[1%] top-[32%]" delay="2.2s" size={52} breakpoint="lg" />
      <FloatingIcon icon={Users} position="left-[16%] top-[70%]" delay="0.6s" size={44} breakpoint="lg" />
      <FloatingIcon icon={Activity} position="right-[16%] top-[70%]" delay="1.8s" size={44} breakpoint="lg" />
      <FloatingIcon icon={ClipboardCheck} position="left-1/2 bottom-[2%] -translate-x-1/2" delay="1s" size={44} breakpoint="lg" />

      {/* Escolha do painel */}
      {etapa === 'escolha' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-2xl px-6"
        >
          <div className="relative mb-6 text-center">
            <div
              className="mx-auto mb-5 inline-flex rounded-full p-[1.5px]"
              style={{
                background:
                  'linear-gradient(120deg, rgba(96,165,250,0.95), rgba(192,132,252,0.95), rgba(244,114,182,0.9), rgba(96,165,250,0.95))',
                backgroundSize: '300% 300%',
                animation: 'gradient-border-move 5s linear infinite',
              }}
            >
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#05070D]/90 px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.26em] text-[#C4B5FD]">
                <Sparkles size={11} />
                Painel Inteligente
              </span>
            </div>

            {/* Halo atrás da wordmark */}
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-[52%] h-[180px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.45),transparent_70%)] blur-[45px]"
              style={{ animation: 'halo-pulse 5s ease-in-out infinite' }}
            />

            <Wordmark
              as="h2"
              delay={0.1}
              className="text-7xl font-black leading-none tracking-[-0.04em] sm:text-8xl"
            />

            <p className="relative mt-4 text-sm text-slate-400">Gestão de clínica de forma inteligente</p>
          </div>

          <div className="flex justify-center">
            <GlowHover magnetic strength={10} className="rounded-2xl">
              <button
                onClick={() => setEtapa('form')}
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#3B82F6] via-[#7C6CF0] to-[#A855F7] px-10 py-4 text-base font-semibold text-white transition-transform duration-300"
                style={{ animation: 'glow-pulse 2.8s ease-in-out infinite' }}
              >
                <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent" />
                <span
                  className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                  style={{ animation: 'shine-sweep 3.2s ease-in-out infinite' }}
                />
                <span className="relative">Acesse seu painel</span>
                <ArrowRight size={18} className="relative transition-transform duration-300 group-hover:translate-x-1.5" />
              </button>
            </GlowHover>
          </div>
        </motion.div>
      )}

      {/* Login Form */}
      {etapa === 'form' && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md px-6"
      >
        <button
          onClick={() => setEtapa('escolha')}
          className="mb-6 flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-300"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>

        <div
          className="relative rounded-[32px] p-[1.5px] shadow-[0_30px_90px_rgba(99,102,241,0.25)]"
          style={{
            background:
              'linear-gradient(120deg, rgba(59,130,246,0.6), rgba(168,85,247,0.6), rgba(236,72,153,0.4), rgba(59,130,246,0.6))',
            backgroundSize: '300% 300%',
            animation: 'gradient-border-move 8s linear infinite',
          }}
        >
          <div className="rounded-[31px] border border-white/10 bg-[#0B1220]/90 p-8 backdrop-blur-2xl backdrop-saturate-150">
            <div className="mb-6 text-center">
              <h2 className="bg-gradient-to-r from-[#60A5FA] via-[#C084FC] to-[#F472B6] bg-clip-text text-4xl font-black tracking-[-0.04em] text-transparent">
                Criare
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Painel Administrativo
              </p>
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="seu@email.com"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#A78BFA]/40 focus:bg-white/[0.08] focus:ring-2 focus:ring-[#A78BFA]/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3.5 pr-12 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#A78BFA]/40 focus:bg-white/[0.08] focus:ring-2 focus:ring-[#A78BFA]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center text-sm font-medium text-rose-400"
                >
                  {error}
                </motion.p>
              )}

              <GlowHover magnetic strength={6} className="block rounded-2xl">
                <button
                  onClick={handleLogin}
                  disabled={loading || !email || !password}
                  className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#3B82F6] via-[#7C6CF0] to-[#A855F7] py-4 text-sm font-semibold text-white transition-transform duration-300 disabled:pointer-events-none disabled:opacity-50"
                  style={{ animation: 'glow-pulse 2.8s ease-in-out infinite' }}
                >
                  <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent" />
                  <span
                    className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                    style={{ animation: 'shine-sweep 3.2s ease-in-out infinite' }}
                  />
                  <span className="relative">{loading ? 'Entrando...' : 'Entrar'}</span>
                  {!loading && (
                    <ArrowRight size={16} className="relative transition-transform duration-300 group-hover:translate-x-1.5" />
                  )}
                </button>
              </GlowHover>
            </div>
          </div>
        </div>
      </motion.div>
      )}
    </div>
  )
}
