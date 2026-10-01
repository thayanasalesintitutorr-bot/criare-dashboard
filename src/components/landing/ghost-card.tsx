'use client'

import { motion } from 'framer-motion'
import { useRepel } from './use-repel'

// Raio de influência do mouse e o quanto o card empurra pra longe no pico (bem perto do cursor).
const REPEL_RADIUS = 190
const REPEL_STRENGTH = 46

export const CARD_LABEL = 'text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500'

export function Sparkle({ className, delay }: { className: string; delay: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`pointer-events-none absolute hidden text-[#A5B4FC] lg:block ${className}`}
      style={{ animation: 'twinkle 4.5s ease-in-out infinite', animationDelay: delay }}
      fill="currentColor"
    >
      <path d="M12 0l1.8 8.2L22 10l-8.2 1.8L12 20l-1.8-8.2L2 10l8.2-1.8z" />
    </svg>
  )
}

export function GhostCard({
  position,
  rotate,
  delay,
  width = 'w-[210px]',
  breakpoint = 'xl',
  children,
}: {
  position: string
  rotate: string
  delay: string
  width?: string
  breakpoint?: 'lg' | 'xl' | '2xl'
  children: React.ReactNode
}) {
  const { ref, offset } = useRepel(REPEL_RADIUS, REPEL_STRENGTH)

  const breakpointClass = { lg: 'lg:block', xl: 'xl:block', '2xl': '2xl:block' }[breakpoint]

  // Duração da respiração varia por card (baseada no próprio delay, que já
  // é diferente em cada chamada) pra não pulsarem todos em sincronia.
  const breatheDuration = 9 + (parseFloat(delay) || 0) * 1.6

  return (
    <div
      ref={ref}
      className={`pointer-events-none absolute hidden select-none ${breakpointClass} ${position}`}
      style={{
        animation: `float-slow 7s ease-in-out infinite, fade-breathe ${breatheDuration}s ease-in-out infinite`,
        animationDelay: `${delay}, ${delay}`,
      }}
    >
      <motion.div
        animate={{ x: offset.x, y: offset.y }}
        transition={{ type: 'spring', stiffness: 160, damping: 14, mass: 0.6 }}
        className={`${width} rounded-[20px] border border-white/10 bg-white/[0.06] p-4 text-left shadow-[0_20px_50px_rgba(59,130,246,0.12),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-xl backdrop-saturate-150 ${rotate}`}
      >
        {children}
      </motion.div>
    </div>
  )
}
