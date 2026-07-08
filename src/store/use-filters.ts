import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Periodo =
  | 'hoje'
  | 'ontem'
  | 'semana'
  | 'mes-atual'
  | 'mes-passado'
  | 'personalizado'

type TipoData = 'criado' | 'fechado'

type Segmento = 'geral' | 'vascular' | 'emagrecimento'

export type ViewMode = 'desktop' | 'iphone' | 'apresentacao'

type FiltersState = {
  periodo: Periodo
  tipoData: TipoData
  segmento: Segmento
  viewMode: ViewMode
  dataInicio: string
  dataFim: string
  setPeriodo: (periodo: Periodo) => void
  setTipoData: (tipoData: TipoData) => void
  setSegmento: (segmento: Segmento) => void
  setViewMode: (viewMode: ViewMode) => void
  setDataInicio: (dataInicio: string) => void
  setDataFim: (dataFim: string) => void
  comparar: boolean
setComparar: (value: boolean) => void
  compararInicio: string
  compararFim: string
  setCompararInicio: (data: string) => void
  setCompararFim: (data: string) => void
}

export const useFilters = create<FiltersState>()(
  persist(
    (set) => ({
      periodo: 'hoje',
      tipoData: 'criado',
      segmento: 'geral',
      viewMode: 'desktop',
      dataInicio: '',
      dataFim: '',
      comparar: false,
      compararInicio: '',
      compararFim: '',
      setPeriodo: (periodo) => set({ periodo }),
      setTipoData: (tipoData) => set({ tipoData }),
      setSegmento: (segmento) => set({ segmento }),
      setViewMode: (viewMode) => set({ viewMode }),
      setDataInicio: (dataInicio) => set({ dataInicio }),
      setDataFim: (dataFim) => set({ dataFim }),
      setComparar: (comparar) => set({ comparar }),
      setCompararInicio: (compararInicio) => set({ compararInicio }),
      setCompararFim: (compararFim) => set({ compararFim }),
    }),
    {
      name: 'criare-filters',
      partialize: (state) => ({ viewMode: state.viewMode }),
    }
  )
)
