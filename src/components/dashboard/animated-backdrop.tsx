// Fundo vivo da Visão Geral — mesma pegada da entrada/login: blobs de luz
// azul/roxo/rosa à deriva, grade que desliza devagar e estrelinhas piscando.
// Tudo decorativo (-z-10, sem pointer-events) e feito só com transform/opacity
// pra não pesar (nada de blur em elemento grande).
const BLOBS = [
  { pos: 'left-[-8%] top-[0%]', size: 'h-[620px] w-[620px]', cor: 'rgba(59,130,246,0.40)', anim: 'aurora-drift-1 22s' },
  { pos: 'right-[-10%] top-[16%]', size: 'h-[640px] w-[640px]', cor: 'rgba(168,85,247,0.34)', anim: 'aurora-drift-2 26s' },
  { pos: 'left-[22%] top-[40%]', size: 'h-[520px] w-[520px]', cor: 'rgba(236,72,153,0.22)', anim: 'aurora-drift-3 24s' },
  { pos: 'right-[2%] top-[62%]', size: 'h-[600px] w-[600px]', cor: 'rgba(59,130,246,0.30)', anim: 'aurora-drift-1 28s' },
  { pos: 'left-[-6%] top-[82%]', size: 'h-[560px] w-[560px]', cor: 'rgba(168,85,247,0.28)', anim: 'aurora-drift-2 25s' },
]

const ESTRELAS = [
  { top: '4%', left: '12%', s: 12, d: 0 },
  { top: '9%', left: '78%', s: 16, d: 1.2 },
  { top: '22%', left: '92%', s: 10, d: 2.4 },
  { top: '31%', left: '6%', s: 14, d: 0.6 },
  { top: '47%', left: '85%', s: 10, d: 1.8 },
  { top: '58%', left: '15%', s: 12, d: 3 },
  { top: '72%', left: '90%', s: 14, d: 0.9 },
  { top: '88%', left: '8%', s: 10, d: 2.1 },
]

export function AnimatedBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {BLOBS.map((b, i) => (
        <div
          key={i}
          className={`absolute rounded-full ${b.pos} ${b.size}`}
          style={{
            background: `radial-gradient(circle, ${b.cor}, transparent 70%)`,
            animation: `${b.anim} ease-in-out infinite`,
          }}
        />
      ))}

      <div
        className="absolute inset-x-0 -top-[60px] bottom-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(148,163,184,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.9) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          animation: 'grid-slide 32s linear infinite',
        }}
      />

      {ESTRELAS.map((e, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          fill="currentColor"
          className="absolute hidden text-[#A5B4FC] sm:block"
          style={{
            top: e.top,
            left: e.left,
            width: e.s,
            height: e.s,
            animation: `twinkle 4.5s ease-in-out ${e.d}s infinite`,
          }}
        >
          <path d="M12 0l1.8 8.2L22 10l-8.2 1.8L12 20l-1.8-8.2L2 10l8.2-1.8z" />
        </svg>
      ))}
    </div>
  )
}
