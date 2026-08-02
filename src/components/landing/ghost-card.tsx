'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

// Raio de influência do mouse e o quanto o card empurra pra longe no pico (bem perto do cursor).
const REPEL_RADIUS = 190
const REPEL_STRENGTH = 46

export const CARD_LABEL = 'text-[10px] font-semibold uppercase tracking-[0.1em] text-[#64748B]'

export function Sparkle({ className, delay }: { className: string; delay: string }) {
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
  const ref = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const frame = useRef<number | null>(null)

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (frame.current) cancelAnimationFrame(frame.current)

      frame.current = requestAnimationFrame(() => {
        const el = ref.current
        if (!el) return

        const rect = el.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        const dx = centerX - e.clientX
        const dy = centerY - e.clientY
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < REPEL_RADIUS) {
          const strength = (1 - distance / REPEL_RADIUS) * REPEL_STRENGTH
          const angle = Math.atan2(dy, dx)
          setOffset({ x: Math.cos(angle) * strength, y: Math.sin(angle) * strength })
        } else {
          setOffset((prev) => (prev.x === 0 && prev.y === 0 ? prev : { x: 0, y: 0 }))
        }
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (frame.current) cancelAnimationFrame(frame.current)
    }
  }, [])

  const breakpointClass = { lg: 'lg:block', xl: 'xl:block', '2xl': '2xl:block' }[breakpoint]

  return (
    <div
      ref={ref}
      className={`pointer-events-none absolute hidden select-none ${breakpointClass} ${position}`}
      style={{ animation: 'float-slow 7s ease-in-out infinite', animationDelay: delay }}
    >
      <motion.div
        animate={{ x: offset.x, y: offset.y }}
        transition={{ type: 'spring', stiffness: 160, damping: 14, mass: 0.6 }}
        className={`${width} rounded-[20px] border border-white/70 bg-white/50 p-4 text-left opacity-45 shadow-[0_20px_50px_rgba(37,99,235,0.10)] backdrop-blur-sm ${rotate}`}
      >
        {children}
      </motion.div>
    </div>
  )
}
