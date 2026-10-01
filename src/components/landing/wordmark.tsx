'use client'

import { motion } from 'framer-motion'

// A entrada da wordmark "Criare": a palavra "cai" no lugar com uma leve
// torção (gira um pouco enquanto cresce e assenta) e, no instante em que
// termina de assentar, um brilho atravessa ela uma única vez — o mesmo
// "shine sweep" já usado nos botões do app, aplicado à palavra em si.
// Depois disso o gradiente continua "vivo" em loop (text-shimmer).
//
// Importante: nada aqui usa `filter`, `rotateX`/`rotateY` 3D ou
// `preserve-3d` no elemento com `background-clip: text` — cada uma dessas
// combinações já se mostrou bugada em algum motor de navegador e deixa o
// texto invisível por um trecho da animação (já caímos nisso). Só
// transform 2D simples (scale/translate/rotateZ) nesse elemento — isso é
// seguro em qualquer lugar. O brilho é um elemento totalmente separado
// por cima, não um filtro no próprio texto.
export function Wordmark({
  as = 'h1',
  className = '',
  delay = 0.1,
}: {
  as?: 'h1' | 'h2'
  className?: string
  delay?: number
}) {
  const Tag = motion[as]

  return (
    <div className="relative block overflow-visible">
      {/* Sem overflow-hidden aqui de propósito: dentro de painéis com
          backdrop-blur (como o do hero), overflow-hidden + transform
          animado nesse wrapper faz o Chromium "engasgar" o compositor e
          o texto simplesmente não pinta — reproduzido e confirmado. O
          brilho (abaixo) é discreto o bastante pra não precisar de clip. */}
      <div className="relative inline-block">
        <Tag
          initial={{ opacity: 0, scale: 0.6, y: 36, rotate: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
          transition={{ duration: 0.85, delay, ease: [0.34, 1.56, 0.64, 1] }}
          className={`bg-gradient-to-r from-[#60A5FA] via-[#C084FC] to-[#F472B6] bg-clip-text pr-2 text-transparent ${className}`}
          style={{
            backgroundSize: '200% 100%',
            animation: 'text-shimmer 4s ease-in-out infinite',
          }}
        >
          Criare
        </Tag>

        {/* Brilho único, logo que a palavra assenta */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-white/80 to-transparent"
          style={{ mixBlendMode: 'overlay' }}
          initial={{ x: '-220%', opacity: 0 }}
          animate={{ x: '520%', opacity: [0, 1, 1, 0] }}
          transition={{
            duration: 1.1,
            delay: delay + 0.55,
            ease: 'easeInOut',
            times: [0, 0.2, 0.75, 1],
          }}
        />
      </div>
    </div>
  )
}
