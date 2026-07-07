import {
  Users,
  Eye,
  Heart,
  Percent,
  PlaySquare,
  MessageCircle,
  Image,
  Film,
  GalleryHorizontal,
  Radio,
  type LucideIcon,
} from 'lucide-react'

export const PROJECAO_METRICAS = [
  { chave: 'seguidores', label: 'Seguidores', formatar: (v: number) => v.toLocaleString('pt-BR') },
  { chave: 'alcance', label: 'Alcance/mês', formatar: (v: number) => v.toLocaleString('pt-BR') },
  { chave: 'engajamento', label: 'Engajamento', formatar: (v: number) => v.toLocaleString('pt-BR') },
  { chave: 'taxaEngaj', label: 'Taxa Engaj.', formatar: (v: number) => `${v.toFixed(2)}%` },
  { chave: 'views', label: 'Views/mês', formatar: (v: number) => v.toLocaleString('pt-BR') },
  { chave: 'interacoes', label: 'Interações', formatar: (v: number) => v.toLocaleString('pt-BR') },
  { chave: 'posts', label: 'Posts', formatar: (v: number) => String(v) },
  { chave: 'reels', label: 'Reels', formatar: (v: number) => String(v) },
  { chave: 'carrosseis', label: 'Carrosséis', formatar: (v: number) => String(v) },
  { chave: 'storiesSemana', label: 'Stories/sem', formatar: (v: number) => String(v) },
] as const

// Subconjunto exibido nesta seção — o cálculo e os dados das demais métricas
// continuam disponíveis na API, apenas não são exibidos aqui.
export const METRICAS_PRINCIPAIS = [
  { chave: 'seguidores', cor: 'var(--accent)' },
  { chave: 'posts', cor: 'var(--accent)' },
  { chave: 'engajamento', cor: 'var(--accent)' },
] as const

export const FILTROS_MES = [
  ['anterior', 'Mês anterior'],
  ['atual', 'Mês atual'],
  ['seguinte', 'Mês seguinte'],
  ['todos', 'Projeção meses'],
] as const

export const ICONES_METRICA: Record<string, LucideIcon> = {
  seguidores: Users,
  alcance: Eye,
  engajamento: Heart,
  taxaEngaj: Percent,
  views: PlaySquare,
  interacoes: MessageCircle,
  posts: Image,
  reels: Film,
  carrosseis: GalleryHorizontal,
  storiesSemana: Radio,
}

export const FOTOS_MEDICO: Record<'rodolpho' | 'breno' | 'claudia', string> = {
  rodolpho: '/medicos/rodolpho.png',
  breno: '/medicos/breno.png',
  claudia: '/medicos/claudia.png',
}
