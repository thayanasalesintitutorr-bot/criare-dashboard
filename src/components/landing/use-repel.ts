'use client'

import { useEffect, useRef, useState } from 'react'

// Faz um elemento se afastar suavemente do cursor quando ele chega perto
// (dentro de `radius`), com a força do empurrão caindo conforme a
// distância aumenta. Usado nos cards e ícones fantasma do fundo do hero —
// é o que dá a sensação de "pontos interativos" no fundo da página.
export function useRepel(radius: number, strength: number) {
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

        if (distance < radius) {
          const s = (1 - distance / radius) * strength
          const angle = Math.atan2(dy, dx)
          setOffset({ x: Math.cos(angle) * s, y: Math.sin(angle) * s })
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
  }, [radius, strength])

  return { ref, offset }
}
