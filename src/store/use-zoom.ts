import { create } from 'zustand'

// Não usa persist de propósito: ao atualizar a página o zoom deve voltar
// para 100% (pedido explícito do usuário), então o estado fica só em memória.
export const NIVEIS_ZOOM = [1, 1.1, 1.2, 1.35, 1.5, 1.75, 2, 2.5, 3, 3.5, 4] as const

// A partir daqui (350%) a Visão Geral deixa de só ampliar tudo e passa a mostrar
// um card por tela, cada um encaixado no tamanho do dispositivo.
export const ZOOM_SLIDES = 3.5

type ZoomState = {
  indice: number
  aumentar: () => void
  diminuir: () => void
  resetar: () => void
}

export const useZoom = create<ZoomState>((set) => ({
  indice: 0,
  aumentar: () => set((s) => ({ indice: Math.min(s.indice + 1, NIVEIS_ZOOM.length - 1) })),
  diminuir: () => set((s) => ({ indice: Math.max(s.indice - 1, 0) })),
  resetar: () => set({ indice: 0 }),
}))

export function useModoSlides() {
  return NIVEIS_ZOOM[useZoom((s) => s.indice)] >= ZOOM_SLIDES
}
