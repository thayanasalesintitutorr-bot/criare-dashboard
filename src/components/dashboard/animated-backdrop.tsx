// Fundo vivo da Visão Geral — mesma pegada da entrada/login: luzes azul/roxo/
// rosa à deriva, grade que desliza devagar, dezenas de pontos de luz
// piscando e "dados" (números reais do período) aparecendo e sumindo lá
// atrás. Tudo decorativo (-z-10, sem pointer-events) e feito só com
// transform/opacity pra não pesar (nada de blur em elemento grande).
type Fato = { label: string; valor: string }

const BLOBS = [
  { pos: 'left-[-8%] top-[0%]', size: 'h-[620px] w-[620px]', cor: 'rgba(59,130,246,0.40)', anim: 'aurora-drift-1 22s' },
  { pos: 'right-[-10%] top-[16%]', size: 'h-[640px] w-[640px]', cor: 'rgba(168,85,247,0.34)', anim: 'aurora-drift-2 26s' },
  { pos: 'left-[22%] top-[40%]', size: 'h-[520px] w-[520px]', cor: 'rgba(236,72,153,0.22)', anim: 'aurora-drift-3 24s' },
  { pos: 'right-[2%] top-[62%]', size: 'h-[600px] w-[600px]', cor: 'rgba(59,130,246,0.30)', anim: 'aurora-drift-1 28s' },
  { pos: 'left-[-6%] top-[82%]', size: 'h-[560px] w-[560px]', cor: 'rgba(168,85,247,0.28)', anim: 'aurora-drift-2 25s' },
]

// Gerador determinístico (mesmo resultado no servidor e no cliente, sem
// diferença de hidratação)
function semente(n: number) {
  let t = n + 0x6d2b79f5
  return () => {
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rnd = semente(2026)
const CORES_PONTO = ['#93C5FD', '#C4B5FD', '#F9A8D4', '#A5B4FC', '#FFFFFF']

const PONTOS = Array.from({ length: 46 }, () => ({
  top: `${(rnd() * 98).toFixed(1)}%`,
  left: `${(rnd() * 99).toFixed(1)}%`,
  tam: 2 + Math.round(rnd() * 3),
  cor: CORES_PONTO[Math.floor(rnd() * CORES_PONTO.length)],
  dur: (3 + rnd() * 5).toFixed(1),
  atraso: (rnd() * 6).toFixed(1),
}))

const ESTRELAS = [
  { top: '4%', left: '12%', s: 14, d: 0 },
  { top: '9%', left: '78%', s: 18, d: 1.2 },
  { top: '22%', left: '92%', s: 12, d: 2.4 },
  { top: '31%', left: '6%', s: 16, d: 0.6 },
  { top: '47%', left: '85%', s: 12, d: 1.8 },
  { top: '58%', left: '15%', s: 14, d: 3 },
  { top: '72%', left: '90%', s: 16, d: 0.9 },
  { top: '88%', left: '8%', s: 12, d: 2.1 },
  { top: '38%', left: '50%', s: 12, d: 3.6 },
  { top: '66%', left: '46%', s: 14, d: 1.5 },
]

// Posição dos "cartões de dados" fantasmas (cada um recebe um fato real)
const POSICOES_DADOS = [
  { top: '3%', left: '2%', rot: -5 },
  { top: '7%', right: '3%', rot: 4 },
  { top: '24%', left: '1%', rot: 3 },
  { top: '33%', right: '1%', rot: -4 },
  { top: '51%', left: '3%', rot: -3 },
  { top: '58%', right: '3%', rot: 5 },
  { top: '76%', left: '1%', rot: 4 },
  { top: '84%', right: '2%', rot: -5 },
]

const BARRAS = [0.35, 0.55, 0.42, 0.7, 0.6, 0.85, 0.75]

export function AnimatedBackdrop({ fatos = [] }: { fatos?: Fato[] }) {
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

      {/* Dados lá atrás: números reais do período, aparecendo e sumindo
          devagar, flutuando — igual aos cartões fantasma da entrada */}
      {fatos.slice(0, POSICOES_DADOS.length).map((f, i) => {
        const pos = POSICOES_DADOS[i]
        return (
          <div
            key={f.label}
            className="absolute hidden w-[190px] sm:block"
            style={{
              top: pos.top,
              left: pos.left,
              right: pos.right,
              transform: `rotate(${pos.rot}deg)`,
            }}
          >
            <div
              className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 shadow-[0_18px_40px_rgba(59,130,246,0.14)]"
              style={{
                animation: `float-slow ${8 + (i % 3)}s ease-in-out ${i * 0.7}s infinite, fade-breathe ${11 + i}s ease-in-out ${i * 1.3}s infinite`,
              }}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{f.label}</p>
              <p className="mt-1 text-[26px] font-black leading-none tracking-tight text-slate-100">{f.valor}</p>
              <div className="mt-3 flex h-8 items-end gap-1">
                {BARRAS.map((h, k) => (
                  <span
                    key={k}
                    className="flex-1 rounded-sm bg-gradient-to-t from-[#3B82F6]/70 to-[#A855F7]/70"
                    style={{ height: `${Math.round(h * 70) + ((i * 7 + k * 13) % 25)}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )
      })}

      {/* Pontos de luz */}
      {PONTOS.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            top: p.top,
            left: p.left,
            width: p.tam,
            height: p.tam,
            background: p.cor,
            boxShadow: `0 0 ${p.tam * 4}px ${p.tam}px ${p.cor}66`,
            animation: `twinkle ${p.dur}s ease-in-out ${p.atraso}s infinite`,
          }}
        />
      ))}

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
