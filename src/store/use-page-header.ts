import { create } from 'zustand'
import { useEffect } from 'react'
import type { ReactNode } from 'react'

type PageHeaderState = {
  title: string
  statusIndicator: ReactNode | null
  setHeader: (title: string, statusIndicator?: ReactNode | null) => void
}

export const usePageHeader = create<PageHeaderState>((set) => ({
  title: '',
  statusIndicator: null,
  setHeader: (title, statusIndicator = null) => set({ title, statusIndicator }),
}))

// Cada página chama isso para anunciar seu título/indicador ao Topbar compartilhado
// (que agora vive no layout, fora da árvore da página — não é mais remontado a cada navegação).
export function useSetPageHeader(title: string, statusIndicator: ReactNode = null) {
  const setHeader = usePageHeader((s) => s.setHeader)

  useEffect(() => {
    setHeader(title, statusIndicator)
  })
}
