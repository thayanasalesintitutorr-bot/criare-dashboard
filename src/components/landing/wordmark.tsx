'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

type Phase = 'ball' | 'letter' | 'reveal'

// Entrada em 3 tempos: uma bolinha cai quicando no centro, vira o "C"
// (crossfade com um pequeno overshoot) e, ao assentar, o "C" se afasta
// pro lado enquanto o resto do nome ("riare") cresce ao lado dele até
// formar "Criare" por completo — tudo ainda centralizado o tempo todo
// (o "C" só parece se afastar porque o grupo continua centrado enquanto
// "riare" ganha espaço; é um truque de CSS puro com grid-template-columns
// indo de 0fr pra 1fr, sem precisar medir largura em JS).
//
// Importante: nada aqui usa `filter`, rotateX/preserve-3d, nem anima
// `width` via framer-motion no elemento com `background-clip: text` —
// cada uma dessas combinações já se mostrou bugada em algum motor de
// navegador (texto fica invisível). Só scale/opacity simples nos spans de
// texto, e a expansão do "riare" é feita com CSS puro (grid-template-
// columns + opacity), não com framer-motion.
export function Wordmark({
  as = 'h1',
  className = '',
  delay = 0.1,
}: {
  as?: 'h1' | 'h2'
  className?: string
  delay?: number
}) {
  const [phase, setPhase] = useState<Phase>('ball')
  const Tag = motion[as]

  useEffect(() => {
    const toLetter = setTimeout(() => setPhase('letter'), (delay + 0.58) * 1000)
    const toReveal = setTimeout(() => setPhase('reveal'), (delay + 1.15) * 1000)
    return () => {
      clearTimeout(toLetter)
      clearTimeout(toReveal)
    }
  }, [delay])

  const gradientText =
    'bg-gradient-to-r from-[#60A5FA] via-[#C084FC] to-[#F472B6] bg-clip-text text-transparent'
  const shimmerStyle = {
    backgroundSize: '200% 100%',
    animation: 'text-shimmer 4s ease-in-out infinite',
  }

  return (
    <div className={`relative block ${className}`}>
      {/* Wrapper interno inline-flex: encolhe pro tamanho real do
          conteúdo (bolinha + "Criare"), diferente do wrapper de fora que
          é block só pra garantir que isso ocupe sua própria linha no
          layout (sem ficar colado ao lado do selo "Painel Inteligente").
          Sem esse encolhimento, o brilho (w-1/3 abaixo) vira uma faixa
          enorme relativa à largura inteira do painel, não da palavra. */}
      <div className="relative inline-flex items-center justify-center">
      {/* Bolinha quicando — some assim que vira o "C". Sem tamanho de
          fonte próprio: herda o da className (mesma do Tag abaixo), por
          isso o "em" bate com o tamanho real do "C" em qualquer breakpoint. */}
      {phase === 'ball' && (
        <motion.div
          aria-hidden
          initial={{ opacity: 0, y: -46, scale: 0.5 }}
          animate={{
            opacity: [0, 1, 1, 1, 1, 0],
            y: [-46, 0, -16, 0, -6, 0],
            scale: [0.5, 1, 0.94, 1, 0.98, 1],
          }}
          transition={{
            delay,
            duration: 0.58,
            times: [0, 0.35, 0.55, 0.7, 0.85, 1],
            ease: 'easeOut',
          }}
          className="absolute left-1/2 top-1/2 h-[0.5em] w-[0.5em] rounded-full"
          style={{
            // Centraliza com margem negativa, não com transform: o
            // framer-motion já usa `transform` pra animar y/scale, e um
            // transform de centralização na className seria sobrescrito
            // pelo transform inline que o framer-motion aplica.
            marginLeft: '-0.25em',
            marginTop: '-0.25em',
            background: 'linear-gradient(135deg, #60A5FA, #C084FC)',
            boxShadow: '0 0 40px rgba(139,92,246,0.65)',
          }}
        />
      )}

      <Tag className="relative inline-flex items-baseline">
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={
            phase === 'ball'
              ? { opacity: 0, scale: 0.5 }
              : { opacity: 1, scale: [1.3, 1] }
          }
          transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
          className={`${gradientText} pr-[0.02em]`}
          style={shimmerStyle}
        >
          C
        </motion.span>

        <span
          className="grid transition-[grid-template-columns] duration-500 ease-out"
          style={{ gridTemplateColumns: phase === 'reveal' ? '1fr' : '0fr' }}
        >
          <span
            className={`min-w-0 overflow-hidden ${gradientText} transition-opacity duration-300`}
            style={{ ...shimmerStyle, opacity: phase === 'reveal' ? 1 : 0 }}
          >
            riare
          </span>
        </span>
      </Tag>
      </div>
    </div>
  )
}
