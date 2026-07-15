'use client'

import { useEffect, useState, type ReactNode } from 'react'


import { AppShell } from '@/components/layout/app-shell'

import { useFilters } from '@/store/use-filters'

import { ProjecaoMedicosCard } from '@/components/marketing/projecao-medicos/projecao-medicos-card'

import {
  CircleDot,
  UserX,
  UserCheck,
  CalendarCheck,
  BadgeDollarSign,
  BriefcaseMedical,
  BarChart3,
  Wallet,
  Target,
  Receipt,
  MousePointerClick,
  AlertTriangle,
  Trash2,
} from 'lucide-react'

const INVESTIMENTO_STORAGE_KEY = 'criare-marketing-investimentos-por-origem'

type OrigemItem = {
  nome: string
  quantidade?: number
  qtd?: number
  valor?: number
}

type UtmLink = {
  id: string
  nome: string
  slug: string
  clicks?: number
  utm_campaign?: string
}

type MarketingResponse = {
  ok: boolean
  error?: string
  kpis?: {
    marketing?: {
      totalEntradas: number
      naoQualificados: number
      naoQualificadosPercent: number
      leadsAceitos: number
      leadsAceitosPercent: number
      convertidos: number
      convertidosPercent: number
      leadA: number
      leadB: number
      leadC: number
      leadD: number
    }
    comercialConsulta?: {
      valorTotalConsulta: number
    }
    comercialVendas?: {
      valorTotalVendas: number
    }
  }
  origensPorEtapa?: {
    entrada: OrigemItem[]
    naoQualificado: OrigemItem[]
    qualificado: OrigemItem[]
    agendado: OrigemItem[]
  }
  origensQualificadosPorTag?: {
    todas: OrigemItem[]
    A: OrigemItem[]
    B: OrigemItem[]
    C: OrigemItem[]
    D: OrigemItem[]
  }
  origensVendaConsulta?: OrigemItem[]
  origensPropostasFechadas?: OrigemItem[]
}

function LiveIndicator({ lastUpdated, now }: { lastUpdated: Date | null; now: Date }) {
  if (!lastUpdated) return null

  const seconds = Math.max(0, Math.floor((now.getTime() - lastUpdated.getTime()) / 1000))
  const label =
    seconds < 5
      ? 'atualizado agora mesmo'
      : seconds < 60
        ? `atualizado há ${seconds}s`
        : `atualizado há ${Math.floor(seconds / 60)}min`

  const stale = seconds > 30

  return (
    <div className="flex items-start gap-2 text-[12px] font-semibold text-[var(--muted-foreground)]">
      <span
        className={`mt-1 inline-flex h-2 w-2 shrink-0 rounded-full ${
          stale ? 'bg-[var(--warning)]' : 'bg-[var(--success)]'
        }`}
      />
      <span className="min-w-0">{label}</span>
    </div>
  )
}

const ORIGENS_COLORS = [
  '#22D3EE',
  '#34d399',
  '#f59e0b',
  '#f87171',
  '#a78bfa',
  '#fb923c',
  '#38bdf8',
  '#e879f9',
]

function formatMoneyBR(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function parseMoney(value: string) {
  return Number(
    value
      .replace(/\D/g, '')
      .replace(/^0+/, '')
  ) / 100 || 0
}

function formatMoneyInput(value: string) {
  const number = parseMoney(value)

  return number.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function getInvestimentosSalvos() {
  if (typeof window === 'undefined') return {}

  try {
    return JSON.parse(localStorage.getItem(INVESTIMENTO_STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function sumQtd(items: OrigemItem[]) {
  return items.reduce(
    (total, item) => total + (item.quantidade ?? item.qtd ?? 0),
    0
  )
}

function sumValor(items: OrigemItem[]) {
  return items.reduce((total, item) => total + (item.valor ?? 0), 0)
}

function useHoverCapaz() {
  const [hoverCapaz, setHoverCapaz] = useState(() =>
    typeof window === 'undefined'
      ? true
      : window.matchMedia('(hover: hover) and (pointer: fine)').matches
  )

  useEffect(() => {
    const media = window.matchMedia('(hover: hover) and (pointer: fine)')

    const atualizar = (event: MediaQueryListEvent) => setHoverCapaz(event.matches)
    media.addEventListener('change', atualizar)
    return () => media.removeEventListener('change', atualizar)
  }, [])

  return hoverCapaz
}

function normalizeTexto(value: unknown) {
  return String(value || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toUpperCase()
}

function metaPercentBadge(
  atual: number,
  meta: number,
  tipo: 'minimo' | 'maximo' = 'minimo'
): { text: string; positive: boolean } {
  const diferenca = tipo === 'maximo' ? meta - atual : atual - meta
  const rounded = Math.round(diferenca)

  return {
    text: `${rounded >= 0 ? '+' : ''}${rounded}%`,
    positive: rounded >= 0,
  }
}

function MarketingMetricCard({
  title,
  value,
  icon,
  percentBadge,
  children,
  extra,
  extraAoLado,
}: {
  title: string
  value: number
  icon: 'entrada' | 'naoQualificado' | 'qualificado' | 'agendado' | 'consulta' | 'procedimento'
  status: 'green' | 'red' | 'blue'
  percentBadge?: { text: string; positive: boolean }
children?: ReactNode
extra?: ReactNode
extraAoLado?: ReactNode
}) {
  const Icon =
  icon === 'entrada'
    ? CircleDot
    : icon === 'naoQualificado'
      ? UserX
      : icon === 'qualificado'
        ? UserCheck
        : icon === 'agendado'
          ? CalendarCheck
          : icon === 'consulta'
            ? BadgeDollarSign
            : BriefcaseMedical

  const hoverCapaz = useHoverCapaz()
  const [detalheAberto, setDetalheAberto] = useState(false)

 return (
  <div className="h-full rounded-[18px] border border-[color:var(--border)] bg-[var(--card)] p-4 flex flex-col overflow-visible shadow-[var(--card-shadow)]">
  <div className="mb-1 flex min-h-[40px] items-center gap-3">
  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--metric-card)]">
    <Icon
      size={18}
      strokeWidth={2.2}
      className="text-[var(--accent)]"
    />
  </div>

 <div
  className="
  pt-0
  flex-1
  min-w-0
  whitespace-normal
  break-words
  text-[14px]
  font-black
  uppercase
  leading-[1.12]
  tracking-[0.08em]
  text-[var(--foreground)]
"
>
  {title}
</div>
</div>

<div className="mt-1 flex flex-1 items-center justify-between gap-3">
  <div
    className={`relative flex flex-wrap items-center gap-2 ${hoverCapaz ? 'cursor-default' : 'cursor-pointer'}`}
    onMouseEnter={hoverCapaz ? () => setDetalheAberto(true) : undefined}
    onMouseLeave={hoverCapaz ? () => setDetalheAberto(false) : undefined}
    onClick={!hoverCapaz ? () => setDetalheAberto((aberto) => !aberto) : undefined}
  >
    <span className="text-2xl font-medium tracking-[-0.06em] text-[var(--foreground)]">
      {value}
    </span>

    {percentBadge && (
      <span
        className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${
          percentBadge.positive
            ? 'bg-[var(--success)]/10 text-[var(--success)]'
            : 'bg-[var(--danger)]/10 text-[var(--danger)]'
        }`}
      >
        <span>{percentBadge.positive ? '▲' : '▼'}</span>
        {percentBadge.text.replace(/^[+-]/, '')}
      </span>
    )}

    {extraAoLado && (
      <div onClick={(event) => event.stopPropagation()} className="flex items-center">
        {extraAoLado}
      </div>
    )}

    {children && detalheAberto && (
      <div className="absolute left-0 top-full z-50 mt-2 max-h-[70vh] w-[320px] max-w-[calc(100vw-2.5rem)] overflow-y-auto rounded-[18px] border border-[color:var(--border)] bg-[var(--card)] p-3 shadow-[var(--card-shadow)]">
        {children}
      </div>
    )}
  </div>

  {extra && (
    <div className="shrink-0">
      {extra}
    </div>
  )}
</div>
  </div>
)
}
function OrigemStageCard({
  items,
  status,
  tooltipType = 'origem',
}: {
  items: {
    nome: string
    quantidade?: number
    qtd?: number
    valor?: number
    detalhes?: {
      nome?: string
      quantidade?: number
      medico?: string
      atendimento?: string
      convenio?: string
      produto?: string
      valor?: number
    }[]
  }[]
  status: 'green' | 'red' | 'blue'
  tooltipType?: 'origem' | 'consulta' | 'procedimento'
}) {
  const formatMoney = (value?: number) =>
    (value || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })

  const hoverCapaz = useHoverCapaz()
  const [indiceAberto, setIndiceAberto] = useState<number | null>(null)

  return (
    <div className="space-y-3 border-t border-[color:var(--border)] pt-4">
      {items.length === 0 && (
        <div className="flex h-[42px] items-center rounded-[18px] border border-[color:var(--border)] bg-transparent px-5 text-sm font-semibold text-[var(--muted-foreground)]">
          Sem dados
        </div>
      )}

      {items.slice(0, 3).map((item, index) => {
        const temDetalhes = item.detalhes && item.detalhes.length > 0
        const aberto = temDetalhes && indiceAberto === index

        return (
          <div
            key={`${item.nome}-${index}`}
            className={temDetalhes ? 'rounded-xl' : undefined}
          >
            <div
              className="flex cursor-pointer items-center justify-between gap-3"
              onMouseEnter={hoverCapaz ? () => setIndiceAberto(index) : undefined}
              onMouseLeave={
                hoverCapaz
                  ? () => setIndiceAberto((atual) => (atual === index ? null : atual))
                  : undefined
              }
              onClick={
                !hoverCapaz
                  ? () => setIndiceAberto((atual) => (atual === index ? null : index))
                  : undefined
              }
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor:
                      ORIGENS_COLORS[index % ORIGENS_COLORS.length],
                  }}
                />

                <span className="truncate text-sm font-semibold text-[var(--foreground)]">
                  {item.nome}
                </span>
              </div>

              <div className="ml-auto shrink-0 text-right">
                <div className="text-base font-black text-[var(--foreground)]">
                  {item.quantidade ?? item.qtd ?? 0}
                </div>

                {item.valor !== undefined && (
                  <div className="text-xs font-bold text-[var(--muted-foreground)]">
                    {formatMoney(item.valor)}
                  </div>
                )}
              </div>
            </div>

            {aberto && (
              <div className="mt-2 max-h-[260px] overflow-y-auto rounded-xl border border-[color:var(--border)] bg-[var(--metric-card)] p-2.5">
                <div className="mb-2 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                  {tooltipType === 'consulta'
                    ? 'Detalhes da consulta'
                    : tooltipType === 'procedimento'
                      ? 'Detalhes do procedimento'
                      : 'Detalhes'}
                </div>

                <div className="space-y-1.5">
                  {item.detalhes!.slice(0, 8).map((detalhe, detalheIndex) => {
                    if (tooltipType === 'consulta') {
                      return (
                        <div
                          key={`${detalhe.medico}-${detalheIndex}`}
                          className="flex items-center justify-between gap-2 rounded-lg bg-[var(--card)] p-2 text-xs"
                        >
                          <div className="min-w-0">
                            <div className="truncate font-black text-[var(--foreground)]">
                              {detalhe.medico || 'Sem médico'}
                            </div>
                            <div className="truncate font-bold text-[var(--muted-foreground)]">
                              {detalhe.atendimento || detalhe.convenio || 'Sem atendimento'}
                            </div>
                          </div>

                          <div className="shrink-0 text-right font-black text-[var(--foreground)]">
                            {formatMoney(detalhe.valor)}
                          </div>
                        </div>
                      )
                    }

                    if (tooltipType === 'procedimento') {
                      return (
                        <div
                          key={`${detalhe.medico}-${detalheIndex}`}
                          className="flex items-center justify-between gap-2 rounded-lg bg-[var(--card)] p-2 text-xs"
                        >
                          <div className="min-w-0">
                            <div className="truncate font-black text-[var(--foreground)]">
                              {detalhe.medico || 'Sem médico'}
                            </div>
                            <div className="truncate font-bold text-[var(--muted-foreground)]">
                              {detalhe.produto || 'Sem produto'}
                            </div>
                          </div>

                          <div className="shrink-0 text-right font-black text-[var(--foreground)]">
                            {formatMoney(detalhe.valor)}
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div
                        key={detalhe.nome || detalheIndex}
                        className="flex items-center justify-between gap-3 text-xs"
                      >
                        <span className="truncate font-bold text-[var(--foreground)]">
                          {detalhe.nome}
                        </span>

                        <span className="shrink-0 font-black text-[var(--foreground)]">
                          {detalhe.quantidade}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function RoiPorOrigemCard({
  items,
  modo,
}: {
  items: {
    origem: string
    retorno: number
    investimento: number
    roi: number
  }[]
  modo: 'campanha' | 'anuncio'
}) {
  const maiorRoi = Math.max(...items.map((item) => item.roi), 1)

  return (
    <div className="flex flex-col rounded-[18px] border border-[color:var(--border)] bg-[var(--card)] p-4 overflow-hidden shadow-[var(--card-shadow)]">
      <div className="mb-5 flex shrink-0 items-center justify-between">
        <div>
          <div className="text-[16px] font-black uppercase leading-[1.12] tracking-[0.08em] text-[var(--foreground)]">
            ROI por {modo === 'anuncio' ? 'anúncio' : 'campanha'}
          </div>
          <div className="mt-1 text-xs font-bold text-[var(--muted-foreground)]">
            Retorno sobre investimento
          </div>
        </div>

        <div className="rounded-xl bg-[var(--metric-card)] px-3 py-2 text-xs font-black text-[var(--accent)]">
          ROI
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {items.slice(0, 5).map((item, index) => {
          const largura = item.roi > 0 ? (item.roi / maiorRoi) * 100 : 4

          return (
            <div key={item.origem} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor:
                        ORIGENS_COLORS[index % ORIGENS_COLORS.length],
                    }}
                  />

                  <span className="truncate text-sm font-black text-[var(--foreground)]">
                    {item.origem}
                  </span>
                </div>

                <div className="text-sm font-black text-[var(--foreground)]">
                  {item.roi.toFixed(2)}x
                </div>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--metric-card)]">
                <div
                  className="h-full rounded-full bg-[var(--accent)]"
                  style={{ width: `${Math.min(Math.max(largura, 4), 100)}%` }}
                />
              </div>

             <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-[var(--muted-foreground)]">
  <div>
    <div className="uppercase text-[var(--muted-foreground)]">Retorno</div>
    <div className="text-[var(--foreground)]">{formatMoneyBR(item.retorno)}</div>
  </div>

  <div className="text-right">
    <div className="uppercase text-[var(--muted-foreground)]">Investimento</div>
    <div className="text-[var(--foreground)]">{formatMoneyBR(item.investimento)}</div>
  </div>
</div>
            </div>
          )
        })}

        {items.length === 0 && (
          <div className="flex h-[42px] items-center rounded-[18px] border border-[color:var(--border)] bg-transparent px-5 text-sm font-semibold text-[var(--muted-foreground)]">
            Sem dados de ROI
          </div>
        )}
      </div>
    </div>
  )
}

function UtmLinksCard({
  leadsOrigemTotais,
}: {
  leadsOrigemTotais: { nome: string; quantidade?: number; qtd?: number }[]
}) {
  const [links, setLinks] = useState<UtmLink[]>([])
  const [loadingLinks, setLoadingLinks] = useState(true)
  const [criando, setCriando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [copiadoSlug, setCopiadoSlug] = useState<string | null>(null)
  const [linkParaExcluir, setLinkParaExcluir] = useState<{ id: string; nome: string } | null>(null)
  const [confirmacaoExclusao, setConfirmacaoExclusao] = useState('')
  const [excluindo, setExcluindo] = useState(false)
  const [form, setForm] = useState({
    nome: '',
    destinoUrl: 'https://linktr.ee/altuusclinic',
    utmSource: 'ig',
    utmMedium: 'social',
    utmCampaign: '',
    utmContent: 'link_in_bio',
  })

  async function carregarLinks() {
    setLoadingLinks(true)

    try {
      const res = await fetch('/api/utm-links')
      const data = await res.json()
      setLinks(data.links || [])
    } finally {
      setLoadingLinks(false)
    }
  }

  useEffect(() => {
    carregarLinks()
  }, [])

  async function criarLink(e: React.FormEvent) {
    e.preventDefault()

    if (!form.nome.trim() || !form.destinoUrl.trim()) return

    setCriando(true)
    setErro(null)

    try {
      const res = await fetch('/api/utm-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json()
        setErro(data.error || 'Falha ao criar link')
        return
      }

      setForm((atual) => ({ ...atual, nome: '', utmCampaign: '' }))
      await carregarLinks()
    } finally {
      setCriando(false)
    }
  }

  async function excluirLink() {
    if (!linkParaExcluir || confirmacaoExclusao !== 'EXCLUIR') return

    setExcluindo(true)

    try {
      const res = await fetch(`/api/utm-links?id=${linkParaExcluir.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        setErro(data.error || 'Falha ao excluir link')
        return
      }

      setLinkParaExcluir(null)
      setConfirmacaoExclusao('')
      await carregarLinks()
    } finally {
      setExcluindo(false)
    }
  }

  function copiarLink(slug: string) {
    const url = `${window.location.origin}/l/${slug}`
    navigator.clipboard.writeText(url)
    setCopiadoSlug(slug)
    setTimeout(() => setCopiadoSlug(null), 1500)
  }

  function leadsDoLink(link: UtmLink) {
    const alvo = normalizeTexto(link.utm_campaign || link.nome)

    if (!alvo) return 0

    return leadsOrigemTotais
      .filter((item) => {
        const nomeOrigem = normalizeTexto(item.nome)
        return nomeOrigem.includes(alvo) || alvo.includes(nomeOrigem)
      })
      .reduce((total, item) => total + (item.quantidade ?? item.qtd ?? 0), 0)
  }

  const totalCliques = links.reduce(
    (total, link) => total + (link.clicks || 0),
    0
  )

  return (
    <div className="rounded-[18px] border border-[color:var(--border)] bg-[var(--card)] p-5 shadow-[var(--card-shadow)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[16px] font-black uppercase leading-[1.12] tracking-[0.08em] text-[var(--foreground)]">
            <MousePointerClick size={18} className="text-[var(--accent)]" />
            Rastreamento de links (UTM)
          </div>
          <div className="mt-1 text-xs font-bold text-[var(--muted-foreground)]">
            Crie links para o link da bio / redes sociais e acompanhe cliques e leads gerados
          </div>
        </div>

        <div className="flex gap-5 text-right">
          <div>
            <div className="text-[11px] font-bold uppercase text-[var(--muted-foreground)]">
              Links criados
            </div>
            <div className="text-xl font-black text-[var(--foreground)]">
              {links.length}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase text-[var(--muted-foreground)]">
              Cliques totais
            </div>
            <div className="text-xl font-black text-[var(--accent)]">
              {totalCliques}
            </div>
          </div>
        </div>
      </div>

      <form
        onSubmit={criarLink}
        className="mb-5 grid gap-2 rounded-[18px] bg-[var(--metric-card)] p-3 md:grid-cols-4"
      >
        <input
          value={form.nome}
          onChange={(e) =>
            setForm((atual) => ({ ...atual, nome: e.target.value }))
          }
          placeholder="Nome (ex: Bio Instagram - Promo Botox)"
          className="rounded-xl border border-[color:var(--border)] bg-[var(--card)] px-3 py-2 text-xs font-bold text-[var(--foreground)] outline-none md:col-span-2"
        />

        <input
          value={form.destinoUrl}
          onChange={(e) =>
            setForm((atual) => ({ ...atual, destinoUrl: e.target.value }))
          }
          placeholder="URL de destino"
          className="rounded-xl border border-[color:var(--border)] bg-[var(--card)] px-3 py-2 text-xs font-bold text-[var(--foreground)] outline-none md:col-span-2"
        />

        <input
          value={form.utmSource}
          onChange={(e) =>
            setForm((atual) => ({ ...atual, utmSource: e.target.value }))
          }
          placeholder="utm_source"
          className="rounded-xl border border-[color:var(--border)] bg-[var(--card)] px-3 py-2 text-xs font-bold text-[var(--foreground)] outline-none"
        />

        <input
          value={form.utmMedium}
          onChange={(e) =>
            setForm((atual) => ({ ...atual, utmMedium: e.target.value }))
          }
          placeholder="utm_medium"
          className="rounded-xl border border-[color:var(--border)] bg-[var(--card)] px-3 py-2 text-xs font-bold text-[var(--foreground)] outline-none"
        />

        <input
          value={form.utmCampaign}
          onChange={(e) =>
            setForm((atual) => ({ ...atual, utmCampaign: e.target.value }))
          }
          placeholder="utm_campaign (identificador único)"
          className="rounded-xl border border-[color:var(--border)] bg-[var(--card)] px-3 py-2 text-xs font-bold text-[var(--foreground)] outline-none"
        />

        <input
          value={form.utmContent}
          onChange={(e) =>
            setForm((atual) => ({ ...atual, utmContent: e.target.value }))
          }
          placeholder="utm_content"
          className="rounded-xl border border-[color:var(--border)] bg-[var(--card)] px-3 py-2 text-xs font-bold text-[var(--foreground)] outline-none"
        />

        {erro && (
          <div className="text-xs font-bold text-[var(--danger)] md:col-span-4">
            {erro}
          </div>
        )}

        <button
          type="submit"
          disabled={criando}
          className="rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-black text-[var(--background)] transition disabled:opacity-50 md:col-span-4"
        >
          {criando ? 'Criando...' : 'Criar link de rastreamento'}
        </button>
      </form>

      {loadingLinks ? (
        <div className="text-xs font-semibold text-[var(--muted-foreground)]">
          Carregando links...
        </div>
      ) : links.length === 0 ? (
        <div className="flex h-[42px] items-center rounded-[18px] border border-[color:var(--border)] bg-transparent px-5 text-sm font-semibold text-[var(--muted-foreground)]">
          Nenhum link criado ainda
        </div>
      ) : (
        <div className="max-h-[260px] space-y-2 overflow-y-auto pr-1">
          {links.map((link) => (
            <div
              key={link.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-[color:var(--border)] bg-[var(--metric-card)] px-4 py-3"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-black text-[var(--foreground)]">
                  {link.nome}
                </div>

                <button
                  type="button"
                  onClick={() => copiarLink(link.slug)}
                  className="mt-0.5 truncate text-xs font-bold text-[var(--accent)] hover:underline"
                >
                  {copiadoSlug === link.slug
                    ? 'Copiado!'
                    : `${typeof window !== 'undefined' ? window.location.origin : ''}/l/${link.slug}`}
                </button>
              </div>

              <div className="flex gap-5 text-right">
                <div>
                  <div className="text-[10px] font-bold uppercase text-[var(--muted-foreground)]">
                    Cliques
                  </div>
                  <div className="text-base font-black text-[var(--foreground)]">
                    {link.clicks || 0}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase text-[var(--muted-foreground)]">
                    Leads (aprox.)
                  </div>
                  <div className="text-base font-black text-[var(--success)]">
                    {leadsDoLink(link)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setLinkParaExcluir({ id: link.id, nome: link.nome })
                    setConfirmacaoExclusao('')
                  }}
                  title="Excluir link"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-[var(--muted-foreground)] transition hover:bg-[var(--danger)]/10 hover:text-[var(--danger)]"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {linkParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-[18px] border border-[color:var(--border)] bg-[var(--card)] p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[var(--danger)]/10 text-[var(--danger)]">
                <AlertTriangle size={18} />
              </div>
              <h3 className="text-[16px] font-black text-[var(--foreground)]">
                Excluir link de rastreamento
              </h3>
            </div>

            <p className="text-sm font-semibold text-[var(--muted-foreground)]">
              Você está prestes a excluir o link{' '}
              <span className="text-[var(--foreground)]">
                &ldquo;{linkParaExcluir.nome}&rdquo;
              </span>
              . Todas as informações de cliques e leads associadas a ele serão perdidas
              permanentemente e essa ação não pode ser desfeita.
            </p>

            <p className="mt-4 text-xs font-bold uppercase text-[var(--muted-foreground)]">
              Digite EXCLUIR para confirmar
            </p>

            <input
              value={confirmacaoExclusao}
              onChange={(e) => setConfirmacaoExclusao(e.target.value)}
              placeholder="EXCLUIR"
              className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-[var(--metric-card)] px-3 py-2 text-sm font-bold text-[var(--foreground)] outline-none focus:border-[var(--danger)]"
            />

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setLinkParaExcluir(null)
                  setConfirmacaoExclusao('')
                }}
                className="rounded-xl px-4 py-2 text-xs font-black text-[var(--muted-foreground)] transition hover:bg-[var(--metric-card)]"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={excluirLink}
                disabled={confirmacaoExclusao !== 'EXCLUIR' || excluindo}
                className="rounded-xl bg-[var(--danger)] px-4 py-2 text-xs font-black text-white transition disabled:cursor-not-allowed disabled:opacity-40"
              >
                {excluindo ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

type Insight = {
  severidade: 'critico' | 'atencao' | 'bom'
  titulo: string
  descricao: string
}

function buildInsights(params: {
  investimento: number
  roi: number
  naoQualificadosPercent: number
  leadsAceitosPercent: number
  conversaoAgendados: number
  retornoPorOrigem: { origem: string; retorno: number; investimento: number; roi: number }[]
  todasOrigens: string[]
  entradaFiltrada: { nome: string; quantidade?: number; qtd?: number }[]
  investimentosPorOrigem: Record<string, string>
}): Insight[] {
  const {
    investimento,
    roi,
    naoQualificadosPercent,
    leadsAceitosPercent,
    conversaoAgendados,
    retornoPorOrigem,
    todasOrigens,
    entradaFiltrada,
    investimentosPorOrigem,
  } = params

  const insights: Insight[] = []

  if (investimento === 0) {
    insights.push({
      severidade: 'atencao',
      titulo: 'Investimento não informado',
      descricao:
        'Adicione o valor investido por origem na barra lateral para calcular ROI, CAC e CPL reais.',
    })
  } else if (roi < 1) {
    insights.push({
      severidade: 'critico',
      titulo: 'Marketing no prejuízo',
      descricao: `Cada R$ 1 investido está retornando R$ ${roi.toFixed(2)}. Revise as origens com pior ROI abaixo.`,
    })
  } else if (roi < 2) {
    insights.push({
      severidade: 'atencao',
      titulo: 'ROI abaixo do ideal',
      descricao: `ROI atual de ${roi.toFixed(2)}x. Concentre a verba nas origens com melhor retorno para chegar a 2x ou mais.`,
    })
  } else {
    insights.push({
      severidade: 'bom',
      titulo: 'Bom retorno sobre investimento',
      descricao: `ROI de ${roi.toFixed(2)}x. Considere aumentar o investimento nas origens que mais convertem.`,
    })
  }

  if (naoQualificadosPercent > 25) {
    insights.push({
      severidade: 'critico',
      titulo: 'Muitos leads não qualificados',
      descricao: `${Math.round(naoQualificadosPercent)}% dos leads que entram não são qualificados. Revise a segmentação dos anúncios e o texto de captação.`,
    })
  } else if (naoQualificadosPercent > 10) {
    insights.push({
      severidade: 'atencao',
      titulo: 'Taxa de não qualificados acima da meta',
      descricao: `${Math.round(naoQualificadosPercent)}% dos leads não são qualificados (meta: até 10%).`,
    })
  }

  if (leadsAceitosPercent > 0 && leadsAceitosPercent < 90) {
    insights.push({
      severidade: 'atencao',
      titulo: 'Qualificação abaixo da meta',
      descricao: `Apenas ${Math.round(leadsAceitosPercent)}% dos leads são aceitos como qualificados (meta: 90%).`,
    })
  }

  if (conversaoAgendados > 0 && conversaoAgendados < 30) {
    insights.push({
      severidade: 'atencao',
      titulo: 'Conversão para agendamento baixa',
      descricao: `Só ${Math.round(conversaoAgendados)}% dos qualificados viram agendamento (meta: 30%). Reforce o follow-up.`,
    })
  }

  retornoPorOrigem
    .filter((item) => item.investimento > 0 && item.roi < 1)
    .slice(0, 3)
    .forEach((item) => {
      insights.push({
        severidade: 'critico',
        titulo: `Origem "${item.origem}" no prejuízo`,
        descricao: `Retorno de ${item.roi.toFixed(2)}x sobre o investimento. Considere pausar ou revisar essa campanha.`,
      })
    })

  const origensSemInvestimento = todasOrigens.filter((origem) => {
    const temEntrada = entradaFiltrada.some(
      (item) => item.nome === origem && (item.quantidade ?? item.qtd ?? 0) > 0
    )
    const temInvestimento = parseMoney(investimentosPorOrigem[origem] || '') > 0

    return temEntrada && !temInvestimento
  })

  if (origensSemInvestimento.length > 0) {
    insights.push({
      severidade: 'atencao',
      titulo: 'Origens sem investimento registrado',
      descricao: `${origensSemInvestimento.slice(0, 3).join(', ')}${
        origensSemInvestimento.length > 3 ? ' e outras' : ''
      } estão gerando leads mas sem custo informado — o ROI e o CAC gerais podem estar distorcidos.`,
    })
  }

  const ordem = { critico: 0, atencao: 1, bom: 2 }
  return insights.sort((a, b) => ordem[a.severidade] - ordem[b.severidade])
}

function IndicadoresCard({ insights }: { insights: Insight[] }) {
  const criticos = insights.filter((item) => item.severidade === 'critico').length
  const atencoes = insights.filter((item) => item.severidade === 'atencao').length

  return (
    <div className="rounded-[18px] border border-[color:var(--border)] bg-[var(--card)] p-5 shadow-[var(--card-shadow)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[16px] font-black uppercase leading-[1.12] tracking-[0.08em] text-[var(--foreground)]">
            <AlertTriangle size={18} className="text-[var(--accent)]" />
            Painel de indicadores
          </div>
          <div className="mt-1 text-xs font-bold text-[var(--muted-foreground)]">
            O que está bom e o que dá para melhorar agora
          </div>
        </div>

        <div className="flex gap-5 text-right">
          <div>
            <div className="text-[11px] font-bold uppercase text-[var(--muted-foreground)]">
              Críticos
            </div>
            <div className="text-xl font-black text-[var(--danger)]">{criticos}</div>
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase text-[var(--muted-foreground)]">
              Atenção
            </div>
            <div className="text-xl font-black text-[var(--warning)]">{atencoes}</div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 rounded-[18px] border p-3 ${
              insight.severidade === 'critico'
                ? 'border-[var(--danger)]/30 bg-[var(--danger)]/10'
                : insight.severidade === 'atencao'
                  ? 'border-[var(--warning)]/30 bg-[var(--warning)]/10'
                  : 'border-[var(--success)]/30 bg-[var(--success)]/10'
            }`}
          >
            <span
              className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                insight.severidade === 'critico'
                  ? 'bg-[var(--danger)]'
                  : insight.severidade === 'atencao'
                    ? 'bg-[var(--warning)]'
                    : 'bg-[var(--success)]'
              }`}
            />

            <div className="min-w-0">
              <div
                className={`text-xs font-black uppercase tracking-wide ${
                  insight.severidade === 'critico'
                    ? 'text-[var(--danger)]'
                    : insight.severidade === 'atencao'
                      ? 'text-[var(--warning)]'
                      : 'text-[var(--success)]'
                }`}
              >
                {insight.titulo}
              </div>
              <div className="mt-0.5 text-xs font-semibold text-[var(--muted-foreground)]">
                {insight.descricao}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function MarketingPage() {

    const { periodo, tipoData, segmento, dataInicio, dataFim } = useFilters()

const [data, setData] = useState<MarketingResponse | null>(null)
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)
const [tagsSelecionadas, setTagsSelecionadas] = useState<('A' | 'B' | 'C' | 'D')[]>([])
const [origemModo, setOrigemModo] = useState<'campanha' | 'anuncio'>('campanha')
const [origensSelecionadas, setOrigensSelecionadas] = useState<string[]>([])
const [investimentosPorOrigem, setInvestimentosPorOrigem] = useState<Record<string, string>>(
  () => getInvestimentosSalvos()
)
const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
const [now, setNow] = useState<Date>(new Date())

useEffect(() => {
  const tick = setInterval(() => setNow(new Date()), 1000)
  return () => clearInterval(tick)
}, [])

useEffect(() => {
  async function loadData() {
    try {
      setLoading(true)
      setError(null)

      let url = `/api/test?periodo=${periodo}&tipo=${tipoData}&segmento=${segmento}&origemModo=${origemModo}`

      if (periodo === 'personalizado' && dataInicio && dataFim) {
        url += `&inicio=${dataInicio}&fim=${dataFim}`
      }

      const token = localStorage.getItem('access_token')

const res = await fetch(url, {
  cache: 'no-store',
  headers: {
    Authorization: `Bearer ${token}`,
  },
})

      const json = await res.json()

      if (!json.ok) throw new Error(json.error || 'Erro ao buscar dados')

      setData(json)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  loadData()

const interval = setInterval(() => {
  loadData()
}, 60000)

return () => clearInterval(interval)
}, [periodo, tipoData, segmento, dataInicio, dataFim, origemModo])

useEffect(() => {
  setOrigensSelecionadas([])
}, [origemModo])

useEffect(() => {
  localStorage.setItem(
    INVESTIMENTO_STORAGE_KEY,
    JSON.stringify(investimentosPorOrigem)
  )
}, [investimentosPorOrigem])

function atualizarInvestimentoOrigem(origem: string, valor: string) {
  setInvestimentosPorOrigem((atual) => ({
    ...atual,
    [origem]: formatMoneyInput(valor),
  }))
}

const marketing = data?.kpis?.marketing
const origensPorEtapa = data?.origensPorEtapa || {
  entrada: [],
  naoQualificado: [],
  qualificado: [],
  agendado: [],
}
const origensQualificadosPorTag =
  data?.origensQualificadosPorTag || {
    todas: [],
    A: [],
    B: [],
    C: [],
    D: [],
  }

const totalQualificadosSelecionados =
  tagsSelecionadas.length === 0
    ? marketing?.leadsAceitos || 0
    : tagsSelecionadas.reduce((total, tag) => {
        if (tag === 'A') return total + (marketing?.leadA || 0)
        if (tag === 'B') return total + (marketing?.leadB || 0)
        if (tag === 'C') return total + (marketing?.leadC || 0)
        return total + (marketing?.leadD || 0)
      }, 0)

const qualificadosFiltrados =
  tagsSelecionadas.length === 0
    ? origensQualificadosPorTag.todas
    : tagsSelecionadas.flatMap((tag) => origensQualificadosPorTag[tag])


   
const origensVendaConsulta: { nome: string; quantidade?: number; qtd?: number; valor?: number }[] =
  data?.origensVendaConsulta || []


const origensPropostasFechadas: { nome: string; quantidade?: number; qtd?: number; valor?: number }[] =
  data?.origensPropostasFechadas || []


const formatMoney = (value: number) =>
  value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

const valorVendaConsulta =
  data?.kpis?.comercialConsulta?.valorTotalConsulta || 0

const valorProcedimentos =
  data?.kpis?.comercialVendas?.valorTotalVendas || 0

  const todasOrigens = Array.from(
  new Set([
    ...origensPorEtapa.entrada.map((item) => item.nome),
    ...origensPorEtapa.naoQualificado.map((item) => item.nome),
    ...origensPorEtapa.agendado.map((item) => item.nome),
    ...origensVendaConsulta.map((item) => item.nome),
    ...origensPropostasFechadas.map((item) => item.nome),
  ])
).filter(Boolean)

const origemAtiva = (nome: string) => {
  if (origensSelecionadas.length === 0) return true
  return origensSelecionadas.includes(nome)
}

const filtrarOrigem = (items: OrigemItem[]) =>
  items.filter((item) => origemAtiva(item.nome))
const qualificadosFiltradosPorOrigem =
  filtrarOrigem(qualificadosFiltrados)
const entradaFiltrada = filtrarOrigem(origensPorEtapa.entrada)
const naoQualificadosFiltrado = filtrarOrigem(origensPorEtapa.naoQualificado)
const agendadosFiltrado = filtrarOrigem(origensPorEtapa.agendado)
const consultasFiltrado = filtrarOrigem(origensVendaConsulta)
const procedimentosFiltrado = filtrarOrigem(origensPropostasFechadas)

const totalEntradaFiltrada = sumQtd(entradaFiltrada)
const totalNaoQualificadosFiltrado = sumQtd(naoQualificadosFiltrado)
const totalAgendadosFiltrado = sumQtd(agendadosFiltrado)
const conversaoAgendados =
  totalQualificadosSelecionados > 0
    ? (totalAgendadosFiltrado / totalQualificadosSelecionados) * 100
    : 0
const valorConsultasFiltrado = sumValor(consultasFiltrado)
const valorProcedimentosFiltrado = sumValor(procedimentosFiltrado)
const retornoMarketing = valorConsultasFiltrado + valorProcedimentosFiltrado

const origensRoi =
  origensSelecionadas.length === 0 ? todasOrigens : origensSelecionadas
const retornoPorOrigem = origensRoi
  .map((origem) => {
    const consulta = origensVendaConsulta.find(
      (item) => item.nome === origem
    )

    const procedimento = origensPropostasFechadas.find(
      (item) => item.nome === origem
    )

    const retorno = (consulta?.valor || 0) + (procedimento?.valor || 0)

    const investimentoOrigem = parseMoney(
      investimentosPorOrigem[origem] || ''
    )

    const roiOrigem =
      investimentoOrigem > 0 ? retorno / investimentoOrigem : 0

    return {
      origem,
      retorno,
      investimento: investimentoOrigem,
      roi: roiOrigem,
    }
  })
  .filter((item) => item.retorno > 0 || item.investimento > 0)
  .sort((a, b) => b.roi - a.roi)
const origensParaInvestimento =
  origensSelecionadas.length === 0 ? todasOrigens : origensSelecionadas

const investimento = origensParaInvestimento.reduce((total, origem) => {
  return total + parseMoney(investimentosPorOrigem[origem] || '')
}, 0)
const lucroMarketing = retornoMarketing - investimento

const roi =
  investimento > 0 ? retornoMarketing / investimento : 0

const cac =
  totalAgendadosFiltrado > 0 ? investimento / totalAgendadosFiltrado : 0

const cpl =
  totalEntradaFiltrada > 0 ? investimento / totalEntradaFiltrada : 0

const insights = buildInsights({
  investimento,
  roi,
  naoQualificadosPercent: marketing?.naoQualificadosPercent || 0,
  leadsAceitosPercent: marketing?.leadsAceitosPercent || 0,
  conversaoAgendados,
  retornoPorOrigem,
  todasOrigens,
  entradaFiltrada,
  investimentosPorOrigem,
})

return (
  <AppShell title="Marketing" statusIndicator={<LiveIndicator lastUpdated={lastUpdated} now={now} />}>
  <div className="space-y-5">
    <div className="grid gap-5 xl:grid-cols-[230px_1fr]">
  <aside className="flex flex-col rounded-[18px] border border-[color:var(--border)] bg-[var(--card)] p-5 shadow-[var(--card-shadow)] xl:sticky xl:top-5 xl:max-h-[calc(100vh-40px)]">
  <div className="min-h-0 flex-1 overflow-y-auto pr-2">
    <div className="mb-4">
      <div className="text-sm font-black uppercase tracking-[0.08em] text-[var(--foreground)]">
        Origens
      </div>

      <div className="mt-1 text-xs font-semibold text-[var(--muted-foreground)]">
        Filtre campanhas para calcular o ROI
      </div>

      <div className="mt-3 flex overflow-hidden rounded-xl border border-[color:var(--border)]">
        <button
          type="button"
          onClick={() => setOrigemModo('campanha')}
          className={`flex-1 px-3 py-2 text-xs font-black uppercase tracking-[0.04em] transition-colors ${
            origemModo === 'campanha'
              ? 'bg-[var(--accent)] text-[var(--background)]'
              : 'bg-transparent text-[var(--muted-foreground)] hover:bg-[var(--metric-card)]'
          }`}
        >
          Campanha
        </button>

        <button
          type="button"
          onClick={() => setOrigemModo('anuncio')}
          className={`flex-1 px-3 py-2 text-xs font-black uppercase tracking-[0.04em] transition-colors ${
            origemModo === 'anuncio'
              ? 'bg-[var(--accent)] text-[var(--background)]'
              : 'bg-transparent text-[var(--muted-foreground)] hover:bg-[var(--metric-card)]'
          }`}
        >
          Anúncio
        </button>
      </div>
    </div>

    <div className="mt-1 text-[11px] font-semibold text-[var(--muted-foreground)]">
      Selecione uma origem para informar o investimento
    </div>

    <div className="mt-3 space-y-3">
      <button
        type="button"
        onClick={() => setOrigensSelecionadas([])}
        className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-black transition-colors ${
          origensSelecionadas.length === 0
            ? 'border-[color:var(--accent)] bg-[var(--metric-card)] text-[var(--accent)]'
            : 'border-[color:var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--metric-card)]'
        }`}
      >
        Todas as origens
      </button>

      {todasOrigens.map((origem) => {
        const ativo = origensSelecionadas.includes(origem)

        return (
          <div
            key={origem}
            className={`overflow-hidden rounded-xl border transition-colors ${
              ativo
                ? 'border-[color:var(--accent)] bg-[var(--metric-card)]'
                : 'border-[color:var(--border)] hover:bg-[var(--metric-card)]'
            }`}
          >
            <button
              type="button"
              onClick={() =>
                setOrigensSelecionadas((atual) =>
                  atual.includes(origem)
                    ? atual.filter((item) => item !== origem)
                    : [...atual, origem]
                )
              }
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-bold transition-colors ${
                ativo ? 'text-[var(--accent)]' : 'text-[var(--muted-foreground)]'
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                  ativo
                    ? 'border-[color:var(--accent)] bg-[var(--accent)]'
                    : 'border-[color:var(--border)] bg-transparent'
                }`}
              />

              <span className="truncate">{origem}</span>
            </button>

            {ativo && (
              <div className="border-t border-[color:var(--accent)]/20 px-3 py-2.5">
                <div className="mb-1.5 text-[10px] font-black uppercase tracking-[0.06em] text-[var(--muted-foreground)]">
                  Investimento nessa origem
                </div>

                <div className="flex overflow-hidden rounded-xl border border-[color:var(--border)] bg-[var(--card)]">
                  <div className="flex items-center bg-[var(--metric-card)] px-2 text-xs font-black text-[var(--muted-foreground)]">
                    R$
                  </div>

                  <input
                    value={investimentosPorOrigem[origem] || ''}
                    onChange={(e) =>
                      atualizarInvestimentoOrigem(origem, e.target.value)
                    }
                    placeholder="0,00"
                    className="w-full px-2 py-2 text-xs font-black text-[var(--foreground)] outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  </div>

  <div className="mt-4 shrink-0 rounded-[18px] border border-[var(--success)]/30 bg-[var(--success)]/10 p-4">
    <div className="text-xs font-bold text-[var(--success)]">
      Investimento selecionado
    </div>

    <div className="mt-1 text-lg font-black text-[var(--success)]">
      {formatMoneyBR(investimento)}
    </div>
  </div>
</aside>

      <section className="flex flex-col space-y-4">
        <div className="grid rounded-[18px] border border-[color:var(--border)] bg-[var(--card)] p-4 shadow-[var(--card-shadow)] xl:grid-cols-6">
          <div className="flex items-center gap-3 border-r border-[color:var(--border)] px-3">
            <Wallet className="text-[var(--accent)]" size={28} />
            <div>
              <div className="metric-label">Investimento</div>
              <div className="text-xl font-medium text-[var(--foreground)]">{formatMoneyBR(investimento)}</div>
            </div>
          </div>

          <div className="border-r border-[color:var(--border)] px-4">
            <div className="metric-label">Retorno</div>
            <div className="text-xl font-medium text-[var(--foreground)]">{formatMoneyBR(retornoMarketing)}</div>
          </div>

          <div className="border-r border-[color:var(--border)] px-4">
            <div className="metric-label">Lucro</div>
            <div className="text-xl font-medium text-[var(--foreground)]">{formatMoneyBR(lucroMarketing)}</div>
          </div>

          <div className="border-r border-[color:var(--border)] px-4">
            <div className="metric-label">ROI</div>
            <div className="text-xl font-medium text-[var(--accent)]">{roi.toFixed(2)}x</div>
          </div>

          <div className="border-r border-[color:var(--border)] px-4">
            <div className="metric-label">CAC</div>
            <div className="text-xl font-medium text-[var(--foreground)]">{formatMoneyBR(cac)}</div>
          </div>

          <div className="px-4">
            <div className="metric-label">CPL</div>
            <div className="text-xl font-medium text-[var(--foreground)]">{formatMoneyBR(cpl)}</div>
          </div>
        </div>

        <div className="rounded-[18px] border border-[color:var(--border)] bg-[var(--card)] p-4 shadow-[var(--card-shadow)]">
<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">

<MarketingMetricCard
          title="Entrada"
          value={totalEntradaFiltrada}
          icon="entrada"
          status="blue"
        >
          <OrigemStageCard items={entradaFiltrada} status="blue" />
        </MarketingMetricCard>

        <MarketingMetricCard
          title="Não qualificados"
          value={totalNaoQualificadosFiltrado}
          icon="naoQualificado"
          status={(marketing?.naoQualificadosPercent || 0) > 10 ? 'red' : 'green'}
          percentBadge={metaPercentBadge(marketing?.naoQualificadosPercent || 0, 10, 'maximo')}
        >
          <OrigemStageCard
            items={naoQualificadosFiltrado}
            status={(marketing?.naoQualificadosPercent || 0) > 10 ? 'red' : 'green'}
          />
        </MarketingMetricCard>

        <MarketingMetricCard
          title="Qualificados"
          value={
  tagsSelecionadas.length === 0
    ? marketing?.leadsAceitos || 0
    : tagsSelecionadas.reduce((total, tag) => {
        if (tag === 'A') return total + (marketing?.leadA || 0)
        if (tag === 'B') return total + (marketing?.leadB || 0)
        if (tag === 'C') return total + (marketing?.leadC || 0)
        return total + (marketing?.leadD || 0)
      }, 0)
}
          icon="qualificado"
          status={(marketing?.leadsAceitosPercent || 0) >= 90 ? 'green' : 'red'}
          percentBadge={metaPercentBadge(marketing?.leadsAceitosPercent || 0, 90)}
          extraAoLado={
            <div className="flex gap-1">
              {(['A', 'B', 'C', 'D'] as const).map((tag) => {
                const ativo = tagsSelecionadas.includes(tag)

                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      setTagsSelecionadas((atual) =>
                        atual.includes(tag)
                          ? atual.filter((item) => item !== tag)
                          : [...atual, tag]
                      )
                    }
                    className={`h-6 w-6 rounded-lg border text-[11px] font-black transition ${
                      ativo
                        ? 'border-[var(--success)]/60 bg-[var(--success)]/10 text-[var(--success)]'
                        : 'border-[color:var(--border)] bg-[var(--metric-card)] text-[var(--muted-foreground)]'
                    }`}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          }
        >
          <OrigemStageCard
            items={qualificadosFiltradosPorOrigem}
            status={(marketing?.leadsAceitosPercent || 0) >= 90 ? 'green' : 'red'}
          />
        </MarketingMetricCard>

        <MarketingMetricCard
          title="Agendados"
          value={totalAgendadosFiltrado}
          icon="agendado"
          status={conversaoAgendados >= 30 ? 'green' : 'red'}
          percentBadge={metaPercentBadge(conversaoAgendados, 30)}
        >
          <OrigemStageCard
            items={agendadosFiltrado}
            status={conversaoAgendados >= 30 ? 'green' : 'red'}
          />
        </MarketingMetricCard>
</div>

<div className="mt-3 grid gap-3 md:grid-cols-2">

       <MarketingMetricCard
  title="Consultas Ganhas"
 value={sumQtd(consultasFiltrado)}
  icon="consulta"
  status="blue"
 extra={
  <div className="space-y-1 text-right">
    <div className="flex items-baseline justify-end gap-1.5">
      <span className="text-[9px] font-black uppercase text-[var(--muted-foreground)]">
        Valor
      </span>
      <span className="text-xs font-medium text-[var(--foreground)]">
        {formatMoney(valorConsultasFiltrado)}
      </span>
    </div>

    <div className="flex items-baseline justify-end gap-1.5">
      <span className="text-[9px] font-black uppercase text-[var(--muted-foreground)]">
        TM
      </span>
      <span className="text-xs font-medium text-[var(--foreground)]">
        {formatMoney(
          sumQtd(consultasFiltrado) > 0
            ? valorConsultasFiltrado / sumQtd(consultasFiltrado)
            : 0
        )}
      </span>
    </div>
  </div>
}
>
  <OrigemStageCard
items={consultasFiltrado}
  status="blue"
  tooltipType="consulta"
/>
</MarketingMetricCard>

<MarketingMetricCard
  title="Procedimentos"
  value={sumQtd(procedimentosFiltrado)}
  icon="procedimento"
  status="blue"
  extra={
  <div className="space-y-1 text-right">
    <div className="flex items-baseline justify-end gap-1.5">
      <span className="text-[9px] font-black uppercase text-[var(--muted-foreground)]">
        Valor
      </span>
      <span className="text-xs font-medium text-[var(--foreground)]">
        {formatMoney(valorProcedimentosFiltrado)}
      </span>
    </div>

    <div className="flex items-baseline justify-end gap-1.5">
      <span className="text-[9px] font-black uppercase text-[var(--muted-foreground)]">
        TM
      </span>
      <span className="text-xs font-medium text-[var(--foreground)]">
        {formatMoney(
          sumQtd(procedimentosFiltrado) > 0
            ? valorProcedimentosFiltrado / sumQtd(procedimentosFiltrado)
            : 0
        )}
      </span>
    </div>
  </div>
}
>
  <OrigemStageCard
  items={procedimentosFiltrado}
  status="blue"
  tooltipType="procedimento"
/>
</MarketingMetricCard>
</div>

<div className="mt-3">
<RoiPorOrigemCard items={retornoPorOrigem} modo={origemModo} />
</div>
        </div>
      </section>
    </div>

    <IndicadoresCard insights={insights} />

    <UtmLinksCard leadsOrigemTotais={origensPorEtapa.entrada} />

    <ProjecaoMedicosCard />
  </div>
</AppShell>
)
}