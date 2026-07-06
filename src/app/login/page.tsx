'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/store/use-auth'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()

  const [step, setStep] = useState<'landing' | 'form'>('landing')
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#f0eeff] via-white to-[#e8e4ff]">
      {/* Animação sutil de fundo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0], scale: [1, 1.08, 0.95, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-[#7c5cfc]/8 blur-[100px]"
        />
        <motion.div
          animate={{ x: [0, -30, 40, 0], y: [0, 20, -30, 0], scale: [1, 0.95, 1.1, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-32 -right-32 h-[600px] w-[600px] rounded-full bg-[#7c5cfc]/6 blur-[120px]"
        />
        <motion.div
          animate={{ x: [0, 20, -15, 0], y: [0, -20, 15, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-[#a78bfa]/5 blur-[80px]"
        />

        {/* Grid sutil */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(124,92,252,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(124,92,252,0.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Landing */}
      {step === 'landing' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="relative z-10 flex flex-col items-center gap-6 px-6 text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="rounded-full border border-[#7c5cfc]/20 bg-white/60 px-6 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#7c5cfc] backdrop-blur-sm"
          >
            Painel Inteligente
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-[100px] font-black leading-none tracking-[-0.06em] text-[#7c5cfc]"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            Criare
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-2"
          >
            <p className="text-xl font-bold text-slate-800">
              Domine sua operação com inteligência real
            </p>
            <p className="text-base text-slate-500">
              Dados, desempenho e decisão em um único lugar
            </p>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setStep('form')}
            className="mt-4 rounded-2xl bg-[#7c5cfc] px-12 py-4 text-base font-semibold text-white shadow-lg shadow-[#7c5cfc]/30 transition hover:bg-[#6a4ce0]"
          >
            Acessar painel
          </motion.button>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 flex gap-2"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-[#7c5cfc]/30" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#7c5cfc]/50" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#7c5cfc]/30" />
          </motion.div>
        </motion.div>
      )}

      {/* Login Form */}
      {step === 'form' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-md px-6"
        >
          <button
            onClick={() => setStep('landing')}
            className="mb-6 flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-700"
          >
            <ArrowLeft size={16} />
            Voltar
          </button>

          <div className="rounded-3xl border border-white/60 bg-white/70 p-8 shadow-xl backdrop-blur-xl">
            <div className="mb-6 text-center">
              <h2
                className="text-4xl font-black tracking-[-0.04em] text-[#7c5cfc]"
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
                  className="w-full rounded-xl border-0 bg-[#e8e4ff]/40 px-4 py-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-[#e8e4ff]/60 focus:ring-2 focus:ring-[#7c5cfc]/30"
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
                    className="w-full rounded-xl border-0 bg-[#e8e4ff]/40 px-4 py-3.5 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-[#e8e4ff]/60 focus:ring-2 focus:ring-[#7c5cfc]/30"
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
                className="w-full rounded-xl bg-[#7c5cfc] py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#7c5cfc]/25 transition hover:bg-[#6a4ce0] disabled:opacity-50"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}