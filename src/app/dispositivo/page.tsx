'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Monitor, Smartphone, Presentation, BadgeCheck } from 'lucide-react'
import { useFilters, type ViewMode } from '@/store/use-filters'

function detectarDispositivo(): ViewMode {
  if (typeof navigator === 'undefined') return 'desktop'

  const ua = navigator.userAgent
  const pareceCelular = /iPhone|Android.*Mobile|Windows Phone/i.test(ua)
  const telaEstreita =
    typeof window !== 'undefined' && window.innerWidth <= 768

  return pareceCelular || telaEstreita ? 'iphone' : 'desktop'
}

const OPCOES: {
  modo: ViewMode
  titulo: string
  descricao: string
  Icon: typeof Monitor
}[] = [
  {
    modo: 'desktop',
    titulo: 'iMac',
    descricao: 'Tela grande, mouse e teclado',
    Icon: Monitor,
  },
  {
    modo: 'iphone',
    titulo: 'iPhone',
    descricao: 'Celular, tela pequena',
    Icon: Smartphone,
  },
  {
    modo: 'apresentacao',
    titulo: 'Modo Apresentação',
    descricao: 'TV ou projetor para reuniões',
    Icon: Presentation,
  },
]

export default function DispositivoPage() {
  const router = useRouter()
  const { setViewMode } = useFilters()
  const [detectado, setDetectado] = useState<ViewMode | null>(null)

  useEffect(() => {
    setDetectado(detectarDispositivo())
  }, [])

  function confirmarDispositivo(modo: ViewMode) {
    setViewMode(modo)

    const cookie = document.cookie
      .split('; ')
      .find((c) => c.startsWith('criare-auth='))
    const session = cookie?.split('=')[1]

    router.push(session === 'marketing' ? '/marketing' : '/dashboard')
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#f0eeff] via-white to-[#e8e4ff]">
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

        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(124,92,252,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(124,92,252,0.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-3xl px-6"
      >
        <div className="rounded-3xl border border-white/60 bg-white/70 p-8 shadow-xl backdrop-blur-xl">
          <div className="mb-8 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="mx-auto mb-4 inline-block rounded-full border border-[#7c5cfc]/20 bg-white/60 px-6 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#7c5cfc]"
            >
              Confirme seu dispositivo
            </motion.div>

            <h1 className="text-3xl font-black tracking-[-0.03em] text-[#7c5cfc] sm:text-4xl">
              Como você está acessando?
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Isso ajusta o painel para ficar do jeito certo na sua tela
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {OPCOES.map(({ modo, titulo, descricao, Icon }, index) => {
              const detectadoAqui = detectado === modo

              return (
                <motion.button
                  key={modo}
                  type="button"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.08 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => confirmarDispositivo(modo)}
                  className={`relative flex flex-col items-center gap-3 rounded-2xl border-2 p-6 text-center transition ${
                    detectadoAqui
                      ? 'border-[#7c5cfc] bg-[#7c5cfc]/5'
                      : 'border-[#e8e4ff] bg-white/60 hover:border-[#7c5cfc]/40'
                  }`}
                >
                  {detectadoAqui && (
                    <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-[#7c5cfc] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                      <BadgeCheck size={12} />
                      Detectamos este dispositivo
                    </span>
                  )}

                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#7c5cfc]/10 text-[#7c5cfc]">
                    <Icon size={26} />
                  </div>

                  <div>
                    <p className="text-base font-black text-slate-800">{titulo}</p>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      {descricao}
                    </p>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
