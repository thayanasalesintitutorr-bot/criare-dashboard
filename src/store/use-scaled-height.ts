'use client'

import { useEffect, useRef, useState } from 'react'

// `transform: scale()` amplia visualmente um elemento, mas não muda o
// espaço que ele ocupa no layout dos vizinhos (isso é decidido antes do
// transform ser aplicado, na hora do reflow). Por isso, ao usar scale pra
// zoom, o elemento seguinte na página fica na posição de "como se o
// elemento zoomado ainda fosse do tamanho original" — sobrepondo o
// conteúdo zoomado por cima de quem vem depois.
//
// Esse hook mede a altura já pintada (pós-transform, via
// getBoundingClientRect — por isso já inclui padding/borda e o próprio
// scale, sem precisar multiplicar por escala de novo) do elemento
// referenciado, pra um wrapper em volta reservar esse espaço no fluxo da
// página. Remede sempre que a escala muda e também quando o conteúdo em
// si muda de tamanho (ex: expandir uma categoria de filtro).
export function useScaledHeight(escala: number) {
  const ref = useRef<HTMLDivElement>(null)
  const [altura, setAltura] = useState<number>()

  useEffect(() => {
    const el = ref.current

    if (!el || escala === 1) {
      setAltura(undefined)
      return
    }

    const medir = () => setAltura(el.getBoundingClientRect().height)

    medir()

    const observer = new ResizeObserver(medir)
    observer.observe(el)

    return () => observer.disconnect()
  }, [escala])

  return { ref, altura }
}
