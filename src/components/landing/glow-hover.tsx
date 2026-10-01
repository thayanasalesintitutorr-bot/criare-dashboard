'use client'

import { useRef, useState, type CSSProperties, type ReactNode } from 'react'

type GlowStyle = CSSProperties & { '--mx'?: string; '--my'?: string }

// Efeito de hover "premium": uma luz segue o cursor dentro do elemento
// (spotlight) e, quando `magnetic` está ligado, o elemento inteiro é puxado
// um pouco em direção ao cursor (efeito "magnético"). Usado nos CTAs e nos
// cards de escolha da tela inicial — mantém o resto do estilo do filho
// intacto, só acrescenta o brilho por cima via --mx/--my.
export function GlowHover({
  children,
  className = '',
  magnetic = false,
  strength = 14,
}: {
  children: ReactNode
  className?: string
  magnetic?: boolean
  strength?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [style, setStyle] = useState<GlowStyle>({
    transform: 'translate(0px, 0px)',
    '--mx': '50%',
    '--my': '50%',
  })

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const relX = e.clientX - rect.left
    const relY = e.clientY - rect.top

    const next: GlowStyle = {
      '--mx': `${(relX / rect.width) * 100}%`,
      '--my': `${(relY / rect.height) * 100}%`,
      transform: 'translate(0px, 0px)',
    }

    if (magnetic) {
      const dx = ((relX - rect.width / 2) / (rect.width / 2)) * strength
      const dy = ((relY - rect.height / 2) / (rect.height / 2)) * strength
      next.transform = `translate(${dx}px, ${dy}px)`
    }

    setStyle(next)
  }

  function handleLeave() {
    setStyle({ transform: 'translate(0px, 0px)', '--mx': '50%', '--my': '50%' })
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={style}
      className={`group relative [will-change:transform] ${
        magnetic ? 'transition-transform duration-300 ease-out' : ''
      } ${className}`}
    >
      {children}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(circle at var(--mx) var(--my), rgba(255,255,255,0.4), transparent 60%)',
          mixBlendMode: 'overlay',
        }}
      />
    </div>
  )
}
