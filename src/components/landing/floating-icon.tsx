'use client'

import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { useRepel } from './use-repel'

const REPEL_RADIUS = 150
const REPEL_STRENGTH = 38

// Ícone solto flutuando no fundo, numa bolha de vidro com sombra colorida
// — mais leve que os GhostCard (sem dados dentro), só pra dar mais
// textura/pontos interativos no fundo sem competir com os cards de
// métricas.
export function FloatingIcon({
  icon: Icon,
  position,
  delay,
  size = 52,
  breakpoint = 'lg',
}: {
  icon: LucideIcon
  position: string
  delay: string
  size?: number
  breakpoint?: 'lg' | 'xl' | '2xl'
}) {
  const { ref, offset } = useRepel(REPEL_RADIUS, REPEL_STRENGTH)

  const breakpointClass = { lg: 'lg:flex', xl: 'xl:flex', '2xl': '2xl:flex' }[breakpoint]

  return (
    <div
      ref={ref}
      className={`pointer-events-none absolute hidden select-none ${breakpointClass} ${position}`}
      style={{ animation: 'float-slow 8s ease-in-out infinite', animationDelay: delay }}
    >
      <motion.div
        animate={{ x: offset.x, y: offset.y }}
        transition={{ type: 'spring', stiffness: 160, damping: 14, mass: 0.6 }}
        className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-[#A78BFA] shadow-[0_20px_45px_rgba(139,92,246,0.3)] backdrop-blur-md"
        style={{ width: size, height: size }}
      >
        <Icon size={size * 0.46} strokeWidth={1.6} />
      </motion.div>
    </div>
  )
}
