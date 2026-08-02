'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/store/use-auth'
import { GhostCard, CARD_LABEL } from '@/components/landing/ghost-card'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleLogin() {
  setError('')
  setLoading(true)

  const emailDigitado = email.trim().toLowerCase()
  const senhaDigitada = password.trim()

  if (
    emailDigitado === 'altuusclinic@gmail.com' &&
    senhaDigitada === 'Altuus@2026#'
  ) {
    localStorage.setItem('access_token', 'criare-auth')
    document.cookie = 'criare-auth=admin; path=/'
    router.push('/dispositivo')
    return
  }

  if (
    emailDigitado === 'brunofontanella.ads@gmail.com' &&
    senhaDigitada === 'Criare@Mkt9274#'
  ) {
    localStorage.setItem('access_token', 'criare-auth')
    document.cookie = 'criare-auth=marketing; path=/'
    router.push('/dispositivo')
    return
  }

  setError('E-mail ou senha incorretos')
  setLoading(false)
}
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#DCE9FF_0%,#B9D2FF_45%,#8FB4FF_100%)]">
      {/* Animação sutil de fundo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0], scale: [1, 1.08, 0.95, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-[#2563EB]/8 blur-[100px]"
        />
        <motion.div
          animate={{ x: [0, -30, 40, 0], y: [0, 20, -30, 0], scale: [1, 0.95, 1.1, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-32 -right-32 h-[600px] w-[600px] rounded-full bg-[#2563EB]/6 blur-[120px]"
        />
        <motion.div
          animate={{ x: [0, 20, -15, 0], y: [0, -20, 15, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-[#60A5FA]/5 blur-[80px]"
        />
        <motion.div
          animate={{ x: [0, -25, 15, 0], y: [0, 15, -25, 0], scale: [1, 1.08, 0.94, 1] }}
          transition={{ duration: 19, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-[-10%] left-[8%] h-[260px] w-[260px] rounded-full bg-[#93C5FD]/10 blur-[70px]"
        />

        {/* Grid sutil, com respiração lenta */}
        <motion.div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(37,99,235,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.25) 1px, transparent 1px)',
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
            className="absolute hidden text-[#93C5FD] sm:block"
            style={{ top: p.top, left: p.left, width: p.size, height: p.size }}
            animate={{ opacity: [0.15, 0.7, 0.15], scale: [0.85, 1.1, 0.85] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
          >
            <path d="M12 0l1.8 8.2L22 10l-8.2 1.8L12 20l-1.8-8.2L2 10l8.2-1.8z" />
          </motion.svg>
        ))}
      </div>

      {/* Cards fantasma, mais próximos do centro já que o card de login é estreito */}
      <GhostCard position="left-[6%] top-[12%]" rotate="rotate-[-5deg]" delay="0s" width="w-[170px]" breakpoint="lg">
        <div className="flex items-center justify-between">
          <p className={CARD_LABEL}>Receita</p>
          <span className="rounded-full bg-[#059669]/10 px-2 py-0.5 text-[10px] font-bold text-[#059669]">+18%</span>
        </div>
        <p className="mt-2 text-lg font-black tracking-[-0.02em] text-[#1f2233]">R$ 1.25M</p>
      </GhostCard>

      <GhostCard position="right-[6%] top-[12%]" rotate="rotate-[5deg]" delay="0.9s" width="w-[170px]" breakpoint="lg">
        <p className={CARD_LABEL}>Metas</p>
        <p className="mt-1 text-xl font-black tracking-[-0.02em] text-[#1f2233]">75%</p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#DCEAFF]">
          <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-[#2563EB] to-[#60A5FA]" />
        </div>
      </GhostCard>

      <GhostCard position="left-[7%] top-1/2 -translate-y-1/2" rotate="rotate-[4deg]" delay="1.7s" width="w-[160px]" breakpoint="lg">
        <p className={CARD_LABEL}>Desempenho</p>
        <p className="mt-1 text-xl font-black tracking-[-0.02em] text-[#1f2233]">92%</p>
        <p className="text-[10px] font-medium text-[#94A3B8]">da meta mensal</p>
      </GhostCard>

      <GhostCard position="right-[7%] top-1/2 -translate-y-1/2" rotate="rotate-[-4deg]" delay="0.5s" width="w-[160px]" breakpoint="lg">
        <p className={CARD_LABEL}>Conversão</p>
        <p className="mt-1 text-xl font-black tracking-[-0.02em] text-[#2563EB]">+24.7%</p>
        <p className="text-[10px] font-medium text-[#94A3B8]">vs. mês anterior</p>
      </GhostCard>

      <GhostCard position="left-[6%] bottom-[12%]" rotate="rotate-[-4deg]" delay="1.2s" width="w-[180px]" breakpoint="lg">
        <p className={`${CARD_LABEL} mb-2`}>Funil Comercial</p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3 text-[11px]">
            <span className="text-[#64748B]">Leads</span>
            <span className="font-bold text-[#1f2233]">1.250</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-[11px]">
            <span className="text-[#64748B]">Fechados</span>
            <span className="font-bold text-[#1f2233]">128</span>
          </div>
        </div>
      </GhostCard>

      <GhostCard position="right-[6%] bottom-[12%]" rotate="rotate-[5deg]" delay="2s" width="w-[170px]" breakpoint="lg">
        <p className={CARD_LABEL}>NPS</p>
        <div className="mt-1 flex items-baseline gap-1">
          <p className="text-xl font-black tracking-[-0.02em] text-[#1f2233]">92</p>
          <span className="text-[10px] font-bold text-[#059669]">Excelente</span>
        </div>
      </GhostCard>

      {/* Login Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md px-6"
      >
        <button
          onClick={() => router.push('/')}
          className="mb-6 flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-700"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>

        <div className="rounded-3xl border border-white/60 bg-white/70 p-8 shadow-xl backdrop-blur-xl">
            <div className="mb-6 text-center">
              <h2
                className="text-4xl font-black tracking-[-0.04em] text-[#2563EB]"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                Criare
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                pressione seu painel de controle
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
                  className="w-full rounded-xl border-0 bg-[#DBEAFE]/40 px-4 py-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-[#DBEAFE]/60 focus:ring-2 focus:ring-[#2563EB]/30"
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
                    className="w-full rounded-xl border-0 bg-[#DBEAFE]/40 px-4 py-3.5 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-[#DBEAFE]/60 focus:ring-2 focus:ring-[#2563EB]/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center text-sm font-medium text-rose-500"
                >
                  {error}
                </motion.p>
              )}

              <button
                onClick={handleLogin}
                disabled={loading || !email || !password}
                className="group relative w-full overflow-hidden rounded-xl bg-[#2563EB] py-3.5 text-sm font-semibold text-white transition hover:bg-[#1D4ED8] disabled:opacity-50"
                style={{ animation: 'glow-pulse 2.8s ease-in-out infinite' }}
              >
                <span
                  className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                  style={{ animation: 'shine-sweep 3.2s ease-in-out infinite' }}
                />
                <span className="relative">{loading ? 'Entrando...' : 'Entrar'}</span>
              </button>
            </div>
          </div>
        </motion.div>
    </div>
  )
}