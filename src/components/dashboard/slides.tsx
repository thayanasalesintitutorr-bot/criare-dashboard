'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useModoSlides } from '@/store/use-zoom'

// Modo "um card por tela" (zoom 350%+): cada card vira um slide do tamanho da
// tela, com o conteúdo reorganizado e escalado pra ocupar o espaço disponível
// (fonte, barras e números crescem juntos). Botões ↑/↓ (e setas ←/→ do
// controle) passam de card em card; a rolagem normal continua funcionando.

const MARGEM_TOPO = 12
const RESERVA_DOCK = 104 // espaço da barra de ícones fixa embaixo
const LARGURAS = [1500, 1300, 1120, 960, 820, 700, 600]
const ESCALA_MAX = 3

const SlidesCtx = createContext<{ ativo: boolean; altura: number }>({ ativo: false, altura: 0 })

export function SlideDeck({ children }: { children: ReactNode }) {
  const ativo = useModoSlides()
  const [altura, setAltura] = useState(800)
  const raiz = useRef<HTMLDivElement>(null)
  const [indice, setIndice] = useState(0)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const medir = () => setAltura(Math.max(window.innerHeight - MARGEM_TOPO - RESERVA_DOCK, 320))
    medir()
    window.addEventListener('resize', medir)
    return () => window.removeEventListener('resize', medir)
  }, [])

  useEffect(() => {
    if (!ativo) return
    document.documentElement.classList.add('slides-snap')
    return () => document.documentElement.classList.remove('slides-snap')
  }, [ativo])

  const slides = useCallback(
    () => Array.from(raiz.current?.querySelectorAll<HTMLElement>('[data-slide]') ?? []),
    [],
  )

  // Qual card está na tela (o mais próximo do topo)
  useEffect(() => {
    if (!ativo) return
    const atualizar = () => {
      const lista = slides()
      setTotal(lista.length)
      let melhor = -1
      let menor = Infinity
      lista.forEach((el, i) => {
        const d = Math.abs(el.getBoundingClientRect().top - MARGEM_TOPO)
        if (d < menor) {
          menor = d
          melhor = i
        }
      })
      // Ainda no cabeçalho (antes do primeiro card)
      if (lista[0] && lista[0].getBoundingClientRect().top > window.innerHeight * 0.55) melhor = -1
      setIndice(melhor)
    }
    atualizar()
    window.addEventListener('scroll', atualizar, { passive: true })
    window.addEventListener('resize', atualizar)
    const t = setInterval(atualizar, 1500) // cards chegam depois dos dados
    return () => {
      window.removeEventListener('scroll', atualizar)
      window.removeEventListener('resize', atualizar)
      clearInterval(t)
    }
  }, [ativo, slides])

  const irPara = useCallback(
    (i: number) => {
      const lista = slides()
      if (i < 0) {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
      const el = lista[Math.min(i, lista.length - 1)]
      if (!el) return
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - MARGEM_TOPO, behavior: 'smooth' })
    },
    [slides],
  )

  // Controle de apresentação (setas ←/→ e PageUp/PageDown)
  useEffect(() => {
    if (!ativo) return
    const onKey = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement | null
      if (alvo && (/^(INPUT|TEXTAREA|SELECT)$/.test(alvo.tagName) || alvo.isContentEditable)) return
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault()
        irPara(indice + 1)
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        irPara(indice - 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ativo, indice, irPara])

  return (
    <SlidesCtx.Provider value={{ ativo, altura }}>
      <div ref={raiz}>{children}</div>

      {ativo && (
        <div className="fixed right-4 top-1/2 z-[60] flex -translate-y-1/2 flex-col items-center gap-2 rounded-full border border-white/15 bg-[#0B1A2B]/85 p-2 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-md">
          <button
            type="button"
            onClick={() => irPara(indice - 1)}
            disabled={indice < 0}
            title="Card anterior"
            className="flex h-12 w-12 items-center justify-center rounded-full text-[var(--foreground)] transition-colors hover:bg-white/10 disabled:opacity-30"
          >
            <ChevronUp size={26} />
          </button>
          <span className="text-[13px] font-bold tabular-nums text-[var(--muted-foreground)]">
            {indice < 0 ? '–' : indice + 1}/{total}
          </span>
          <button
            type="button"
            onClick={() => irPara(indice + 1)}
            disabled={total > 0 && indice >= total - 1}
            title="Próximo card"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#3B82F6] to-[#A855F7] text-white shadow-[0_6px_18px_rgba(99,102,241,0.5)] transition-transform hover:scale-105 disabled:opacity-30"
          >
            <ChevronDown size={26} />
          </button>
        </div>
      )}
    </SlidesCtx.Provider>
  )
}

// Envolve um card: fora do modo apresentação não faz nada; dentro dele o card
// ocupa a tela inteira, na largura de projeto em que o conteúdo rende mais.
export function Slide({ children }: { children: ReactNode }) {
  const { ativo, altura } = useContext(SlidesCtx)
  if (!ativo) return <>{children}</>
  return <FitSlide altura={altura}>{children}</FitSlide>
}

function FitSlide({ children, altura }: { children: ReactNode; altura: number }) {
  const fora = useRef<HTMLDivElement>(null)
  const dentro = useRef<HTMLDivElement>(null)
  const [ajuste, setAjuste] = useState<{ w: number; escala: number }>({ w: LARGURAS[0], escala: 0.6 })
  const ultimaAltura = useRef(0)

  const calcular = useCallback(() => {
    const f = fora.current
    const d = dentro.current
    if (!f || !d) return
    const largura = f.clientWidth
    if (!largura) return

    let melhor = { w: LARGURAS[0], escala: 0 }
    let alturaMelhor = 0
    // Testa cada largura de projeto: o conteúdo reflui (colunas viram linhas)
    // e a gente fica com a que dá a maior escala cabendo na tela.
    for (const w of LARGURAS) {
      d.style.width = `${w}px`
      const h = d.offsetHeight
      if (!h) continue
      const escala = Math.min(largura / w, altura / h, ESCALA_MAX)
      if (escala > melhor.escala + 0.001) {
        melhor = { w, escala }
        alturaMelhor = h
      }
    }
    d.style.width = `${melhor.w}px`
    ultimaAltura.current = alturaMelhor
    setAjuste((a) => (a.w === melhor.w && Math.abs(a.escala - melhor.escala) < 0.002 ? a : melhor))
  }, [altura])

  useLayoutEffect(() => {
    calcular()
  }, [calcular])

  useEffect(() => {
    const d = dentro.current
    const f = fora.current
    if (!d || !f) return
    // Recalcula quando o conteúdo muda de altura (dados chegando, hover…) ou a tela muda
    const ro = new ResizeObserver(() => {
      if (Math.abs(d.offsetHeight - ultimaAltura.current) > 2) calcular()
    })
    ro.observe(d)
    const rf = new ResizeObserver(calcular)
    rf.observe(f)
    return () => {
      ro.disconnect()
      rf.disconnect()
    }
  }, [calcular])

  return (
    <div
      data-slide
      ref={fora}
      className="relative w-full"
      style={{ height: altura, marginBottom: 12 }}
    >
      <div
        ref={dentro}
        className="@container absolute left-1/2 top-1/2"
        style={{
          width: ajuste.w,
          transform: `translate(-50%, -50%) scale(${ajuste.escala})`,
          transformOrigin: 'center center',
        }}
      >
        {children}
      </div>
    </div>
  )
}
