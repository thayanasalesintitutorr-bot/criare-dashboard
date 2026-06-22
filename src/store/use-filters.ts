import { create } from 'zustand'

type Periodo =
  | 'hoje'
  | 'ontem'
  | 'semana'
  | 'mes-atual'
  | 'mes-passado'
  | 'personalizado'

type TipoData = 'criado' | 'fechado'

type Segmento = 'geral' | 'vascular' | 'emagrecimento'

type ViewMode = 'desktop' | 'mobile'

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
}

export const useFilters = create<FiltersState>((set) => ({
  periodo: 'hoje',
  tipoData: 'criado',
  segmento: 'geral',
  viewMode: 'desktop',
  dataInicio: '',
  dataFim: '',
  setPeriodo: (periodo) => set({ periodo }),
  setTipoData: (tipoData) => set({ tipoData }),
  setSegmento: (segmento) => set({ segmento }),
  setViewMode: (viewMode) => set({ viewMode }),
  setDataInicio: (dataInicio) => set({ dataInicio }),
  setDataFim: (dataFim) => set({ dataFim }),
}))