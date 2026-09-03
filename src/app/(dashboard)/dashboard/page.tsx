'use client'

import { ReactNode, useEffect, useState } from 'react'
import {
  Funnel,
  Star,
  Stethoscope,
  Users,
  ChartNoAxesCombined,
  UserRound,
} from 'lucide-react'
import { useFilters } from '@/store/use-filters'
import { useSetPageHeader } from '@/store/use-page-header'
import { ProjecaoMedicosResumoCard } from '@/components/marketing/projecao-medicos/projecao-medicos-resumo-card'
import { PrimeiraMensagemTile } from '@/components/marketing/primeira-mensagem-tile'
import { OrigensPrimeiraMensagemCard } from '@/components/marketing/origens-primeira-mensagem-card'
import { deepEqual } from '@/lib/deep-equal'

type EvolucaoDiariaItem = {
  data: string
  label: string
  leads: number
  vendasValor: number
  desqualificados: number
}

type OrigemItem = {
  nome: string
  quantidade: number
}

type DashboardResponse = {
  ok: boolean
  kpis?: {
    marketing: {
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
  convertidoLeadA: number
  convertidoLeadB: number
  convertidoLeadC: number
  convertidoLeadD: number
}
    comercialConsulta: {
  quantidadeConsulta: number
  valorTotalConsulta: number
  ticketMedioConsulta: number

  quantidadeReabord: number
  valorTotalReabord: number
  ticketMedioReabord: number

  quantidadeTotal: number
  valorTotal: number
  ticketMedioTotal: number
}
    comercialVendas: {
      propostasEnviadas: number
      propostasFechadas: number
      propostasFechadasPercent: number
      valorTotalVendas: number
      ticketMedioVendas: number
      cicloVendaDias: number
      metaPropostasFechadasPercent: number
      metaValorTotalVendas: number
      metaTicketMedio: number
    }
    experienciaCliente?: {
      noShow: number
      noShowPercent: number
      metaNoShowPercent: number
      metaNoShowQuantidade: number
      reagendados: number
      reagendadosPercent: number
      cancelados: number
      canceladosPercent: number
      npsGoogle: number
      npsGooglePercent: number
      metaNpsGoogle: number
    }
    atendimentoConsulta?: {
  nome: string
  qtd: number
  valor: number
}[]

conveniosConsulta?: {
  nome: string
  qtd: number
  valor: number
}[]

  }
  consolidado?: {
    qtdVendas: number
    valorVendas: number
    ticketMedio: number
    metaValorVendas: number
    metaTicketMedio: number
  }

  comparativo?: {
    marketing?: {
      totalEntradasAnterior?: number
      leadsAceitosAnterior?: number
    }
    comercialConsulta?: {
      quantidadeConsultaAnterior?: number
      valorTotalConsultaAnterior?: number
      ticketMedioConsultaAnterior?: number
      quantidadeReabordAnterior?: number
      valorTotalReabordAnterior?: number
      ticketMedioReabordAnterior?: number
      quantidadeTotalAnterior?: number
      valorTotalAnterior?: number
      ticketMedioTotalAnterior?: number
    }
    comercialVendas?: {
      propostasEnviadasAnterior?: number
      valorTotalVendasAnterior?: number
      ticketMedioVendasAnterior?: number
    }
    consolidado?: {
      qtdVendasAnterior?: number
      valorVendasAnterior?: number
      ticketMedioAnterior?: number
    }
    statusAgenda?: {
      finalizadosAnterior?: number
      noShowAnterior?: number
      reagendadosAnterior?: number
      canceladosAnterior?: number
    }
  }

  funil?: {
    entrada: number
    primeiroContato: number
    formulario: number
    followUp: number
    naoQualificado: number
    qualificado: number
    agendado: number
    ganhou: number
    perdeu: number
  }
  funilVendas?: {
    total: number
    orcamentoEntregue: number
    solicitacaoCirurgia: number
    marcado: number
    vendaGanha: number
    vendaPerdida: number
  }
  funilReabord?: {
    total: number
    contato: number
    oferta: number
    agendado: number
    fechadoGanho: number
    fechadoPerdido: number
    emConversa: number
    semConversa: number
    
    consolidado?: {
  qtdVendas: number
  valorVendas: number
  ticketMedio: number
  metaValorVendas: number
  metaTicketMedio: number
}

  }

  evolucaoDiaria?: EvolucaoDiariaItem[]
  origens?: OrigemItem[]
  primeiraMensagem?: {
    total: number
    origens: OrigemItem[]
  }
  consultaPorMedico?: {
  medico: string
  atendimentos: number
  noShow: number
  noShowPercent: number
  cancelados: number
  reagendados: number
  consultasPrimeiraVez: number
  retornos: number
  quantidadeConsulta: number
  valorConsulta: number
  ticketMedio: number
  proximosAtendimentos: number
  capacidadeAgenda?: number
  atendimentosAnterior?: number
  faturamentoConsolidadoAnterior?: number
  consultasPrimeiraVezAnterior?: number
  retornosAnterior?: number
  noShowAnterior?: number
  canceladosAnterior?: number
  reagendadosAnterior?: number
}[]
campanhasConsulta?: {
  nome: string
  qtd: number
  valor: number
  percentual: number
}[]

vendasPorMedico?: {
  nome: string
  valor: number
  meta: number
  percentual: number
  propostasEnviadas?: number
  vendasFechadas?: number
  taxaConversao?: number
  produtos?: {
    produto: string
    qtd: number
  }[]
}[]

  error?: string

campanhaSiteRodolpho?: {
  total: number
  porStatus: Record<string, number>
}
}

function formatMoney(v: number) {
  return v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })
}

function formatMoneyShort(v: number) {
  if (v >= 1000000) {
    const x = v / 1000000
    return `R$ ${x % 1 === 0 ? x.toFixed(0) : x.toFixed(1)} mi`
  }
  if (v >= 1000) {
    const x = v / 1000
    return `R$ ${x % 1 === 0 ? x.toFixed(0) : x.toFixed(1)} mil`
  }
  return formatMoney(v)
}

function formatPercent(v: number) {
  return `${Math.round(v)}%`
}

function getMetricStatus(vp: number, tp: number, mode: 'max' | 'min') {
  const isGood = mode === 'max' ? vp <= tp : vp >= tp
  return {
    isGood,
    barClass: isGood ? 'bg-[var(--success)]' : 'bg-[var(--danger)]',
    textClass: isGood ? 'text-[var(--success)]' : 'text-[var(--danger)]',
  }
}

function clampPercent(v: number) {
  return Math.max(0, Math.min(v, 100))
}

function textPrimary() {
  return 'text-[var(--foreground)]'
}

function textSecondary() {
  return 'text-[var(--muted-foreground)]'
}

function cardBg() {
  return 'rounded-[24px] border border-[color:var(--border)] bg-[var(--card)] shadow-[var(--card-shadow)] transition-colors duration-200 hover:border-[var(--accent)]/30'
}

function metricCardBg() {
  return 'rounded-[22px] border border-[color:var(--border)] bg-[var(--metric-card)] px-4 py-2 transition-colors duration-200 hover:border-[var(--accent)]/30'
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
    <div className={`flex items-start gap-2 text-[12px] font-semibold ${textSecondary()}`}>
      <span
        className={`mt-1 inline-flex h-2 w-2 shrink-0 rounded-full ${
          stale ? 'bg-[var(--warning)]' : 'bg-[var(--success)]'
        }`}
      />
      <span className="min-w-0">{label}</span>
    </div>
  )
}

function GroupCard({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  const { viewMode } = useFilters()
  const isApresentacao = viewMode === 'apresentacao'

  return (
    <section className={`relative z-0 min-w-0 overflow-hidden hover:z-20 ${isApresentacao ? 'p-6' : viewMode === 'iphone' ? 'p-4' : 'px-4 py-2'} ${cardBg()}`}>
      <div className={`${isApresentacao ? 'mb-5' : viewMode === 'iphone' ? 'mb-3' : 'mb-2'} flex items-center gap-3`}>
  <div className={`flex items-center justify-center rounded-2xl bg-[var(--accent)]/12 text-[var(--accent)] ${isApresentacao ? 'h-14 w-14' : viewMode === 'iphone' ? 'h-10 w-10' : 'h-9 w-9'}`}>
    {icon}
  </div>

  <h3
    className={`
      ${isApresentacao ? 'text-[42px]' : viewMode === 'iphone' ? 'text-[20px]' : 'text-[18px]'}
      font-bold tracking-[-0.02em]
      ${textPrimary()}
    `}
  >
    {title}
  </h3>
      </div>
      <div className={isApresentacao ? 'space-y-7' : viewMode === 'iphone' ? 'space-y-3' : 'space-y-1'}>{children}</div>
    </section>
  )
}

function SimpleMetric({
  label,
  value,
  previousValue,
  showCompare = false,
  empty = false,
  children,
  iphoneOnValueClick,
}: {
  label: string
  value: number | string
  previousValue?: number
  showCompare?: boolean
  empty?: boolean
  children?: React.ReactNode
  iphoneOnValueClick?: () => void
}) {
  const { viewMode } = useFilters()
  const isApresentacao = viewMode === 'apresentacao'
  const numericValue =
  typeof value === 'number'
    ? value
    : Number(String(value).replace(/[^\d,-]/g, '').replace(',', '.')) || 0

const diff =
  previousValue !== undefined && previousValue > 0
    ? ((numericValue - previousValue) / previousValue) * 100
    : 0

const isUp = diff >= 0

  if (empty) {
    return (
      <div className="min-w-0 space-y-1">
        <h4
          className={`truncate ${
            isApresentacao ? 'text-[26px] font-semibold' : viewMode === 'iphone' ? 'text-[15px] font-semibold' : 'text-[14px] font-medium'
          } ${textSecondary()}`}
        >
          {label}
        </h4>

        <div
          className={`${
            isApresentacao ? 'text-[64px]' : viewMode === 'iphone' ? 'text-[28px]' : 'text-[32px]'
          } font-medium tracking-[-0.02em] leading-none text-[var(--muted-foreground)]/40`}
        >
          —
        </div>

        <p className={`${isApresentacao ? 'text-[22px]' : viewMode === 'iphone' ? 'text-[12px]' : 'text-[11px]'} font-medium ${textSecondary()}`}>
          Sem dados no período
        </p>
      </div>
    )
  }

  return (
    <div className="relative min-w-0 space-y-1">
      <h4
        className={`truncate ${
          isApresentacao ? 'text-[26px] font-semibold' : viewMode === 'iphone' ? 'text-[15px] font-semibold' : 'text-[14px] font-medium'
        } ${textSecondary()}`}
      >
        {label}
      </h4>

      <div className="relative group block w-full min-w-0">
  <div
    onClick={viewMode === 'iphone' ? iphoneOnValueClick : undefined}
    className={`truncate ${
      isApresentacao ? 'text-[64px]' : viewMode === 'iphone' ? 'text-[28px]' : 'text-[32px]'
    } font-medium tracking-[-0.02em] leading-none cursor-pointer ${textPrimary()}`}
  >
    {value}
  </div>

  {children}
</div>

      {showCompare && (
  <div className={`flex items-center gap-2 ${isApresentacao ? 'text-[24px]' : viewMode === 'iphone' ? 'text-[12px]' : 'text-[12px]'}`}>
    <span className={`font-medium ${isUp ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
      {isUp ? '▲' : '▼'} {formatPercent(Math.abs(diff))}
    </span>

    <span className={`font-medium ${textSecondary()}`}>
      ant. {typeof value === 'string' && value.includes('R$') ? formatMoney(previousValue || 0) : previousValue || 0}
    </span>
  </div>
)}
    </div>
  )
}

function GoalMetric({
  label,
  value,
  percent,
  target,
  mode,
  metaLabel,
  empty = false,
  previousValue,
  showCompare = false,
}: {
  label: string
  value: ReactNode
  percent: number
  target: number
  mode: 'max' | 'min'
  metaLabel?: string
  empty?: boolean
  previousValue?: number
  showCompare?: boolean
}) {
  const { viewMode } = useFilters()
  const s = getMetricStatus(percent, target, mode)

  const isApresentacao = viewMode === 'apresentacao'

  const base = Number(previousValue || 0)
  const numericValue = typeof value === 'number' ? value : Number(value) || 0
  const diff = base > 0 ? Math.round(((numericValue - base) / base) * 100) : 0
  const positivo = diff > 0
  const negativo = diff < 0

  if (empty) {
    return (
      <div className={isApresentacao ? 'space-y-2' : viewMode === 'iphone' ? 'space-y-2' : 'space-y-1'}>
        <h4
          className={`${
            isApresentacao ? 'text-[28px] font-semibold' : viewMode === 'iphone' ? 'text-[15px] font-semibold' : 'text-[14px] font-medium'
          } leading-tight ${textSecondary()}`}
        >
          {label}
        </h4>

        <div
          className={`${
            isApresentacao ? 'text-[64px]' : viewMode === 'iphone' ? 'text-[28px]' : 'text-[32px]'
          } font-medium tracking-[-0.02em] text-[var(--muted-foreground)]/40`}
        >
          —
        </div>

        <p className={`${isApresentacao ? 'text-[22px]' : viewMode === 'iphone' ? 'text-[12px]' : 'text-[11px]'} font-medium ${textSecondary()}`}>
          Sem dados no período
        </p>
      </div>
    )
  }

  return (
    <div className={isApresentacao ? 'space-y-2' : viewMode === 'iphone' ? 'space-y-2' : 'space-y-1'}>
      <h4
        className={`${
         isApresentacao ? 'text-[28px] font-semibold' : viewMode === 'iphone' ? 'text-[15px] font-semibold' : 'text-[14px] font-medium'
        } leading-tight ${textSecondary()}`}
      >
        {label}
      </h4>

      <div
        className={`${
          isApresentacao ? 'text-[64px]' : viewMode === 'iphone' ? 'text-[28px]' : 'text-[32px]'
        } font-medium tracking-[-0.02em] ${textPrimary()}`}
      >
        {value}
      </div>

      {showCompare && (
        <div className={`flex items-center gap-2 ${isApresentacao ? 'text-[22px]' : viewMode === 'iphone' ? 'text-[12px]' : 'text-[12px]'} font-medium`}>
          <span
            className={
              positivo
                ? 'text-[var(--success)]'
                : negativo
                ? 'text-[var(--danger)]'
                : 'text-[var(--muted-foreground)]'
            }
          >
            {positivo ? '▲' : negativo ? '▼' : '＝'} {Math.abs(diff)}%
          </span>

          <span className={textSecondary()}>ant. {base}</span>
        </div>
      )}

      <div className="flex items-center gap-2">
  <span
    className={`${
      isApresentacao ? 'text-[28px]' : viewMode === 'iphone' ? 'text-[15px]' : 'text-[14px]'
    } font-medium ${s.textClass}`}
  >
    {formatPercent(percent)}
  </span>

  <span
    className={`${
      isApresentacao ? 'text-[28px]' : viewMode === 'iphone' ? 'text-[15px]' : 'text-[14px]'
    } font-medium ${textSecondary()}`}
  >
    de
  </span>

  <span
    className={`${
      isApresentacao ? 'text-[28px]' : viewMode === 'iphone' ? 'text-[15px]' : 'text-[14px]'
    } font-medium ${textSecondary()}`}
  >
    {target}%
  </span>

  {metaLabel && (
    <span
      className={`${
        isApresentacao ? 'text-[32px]' : viewMode === 'iphone' ? 'text-[13px]' : 'text-[13px]'
      } ${textSecondary()}`}
    >
      {metaLabel}
    </span>
  )}
</div>

      <div
        className={`overflow-hidden rounded-full bg-[var(--progress-bg)] ${
          isApresentacao
  ? 'h-2.5 w-full'
  : viewMode === 'iphone'
  ? 'h-2 w-full'
  : 'h-1.5 w-full'
        }`}
      >
        <div
          className={`h-full rounded-full ${s.barClass}`}
          style={{ width: `${clampPercent(percent)}%` }}
        />
      </div>
    </div>
  )

}

function getAvatarMedico(nome: string) {
  const n = nome.toUpperCase()

  if (n.includes('RODOLPHO')) return '/medicos/rodolpho.png'
  if (n.includes('BRENO')) return '/medicos/breno.png'
  if (n.includes('CLAUDIA')) return '/medicos/claudia.png'
  if (n.includes('JESSICA')) return '/medicos/jessica.png'
  if (n.includes('ALBA')) return '/medicos/alba.png'
  if (n.includes('CATHARINA')) return '/medicos/catharina.jpeg'

  return null
}

// Seta + % de variação vs o período anterior. Sem "anterior" (0 ou
// indefinido) não dá pra calcular variação de forma confiável, então some.
function DeltaBadge({ atual, anterior }: { atual?: number; anterior?: number }) {
  if (!anterior || anterior <= 0) return null

  const diff = Math.round((((atual || 0) - anterior) / anterior) * 100)
  if (diff === 0) return null

  const positivo = diff > 0

  return (
    <span
      className={`ml-1.5 inline-flex items-center gap-0.5 text-[11px] font-bold ${
        positivo ? 'text-[var(--success)]' : 'text-[var(--danger)]'
      }`}
    >
      {positivo ? '↑' : '↓'}
      {Math.abs(diff)}%
    </span>
  )
}

function MedicoSnapshotCard({
  nome,
  atendimentos,
  atendimentosAnterior,
  ticketConsulta,
  faturamentoConsolidado,
  faturamentoConsolidadoAnterior,
  percentualMeta,
  procedimentos,
  capacidadeAgenda,
  noShow,
  cancelados,
  reagendados,
  consultasPrimeiraVez,
  retornos,
  taxaConversao,
  propostasEnviadas,
  vendasFechadas,
}: {
  nome: string
  atendimentos?: number
  atendimentosAnterior?: number
  ticketConsulta?: number
  faturamentoConsolidado?: number
  faturamentoConsolidadoAnterior?: number
  percentualMeta?: number
  procedimentos?: number
  capacidadeAgenda?: number
  noShow?: number
  cancelados?: number
  reagendados?: number
  consultasPrimeiraVez?: number
  retornos?: number
  taxaConversao?: number
  propostasEnviadas?: number
  vendasFechadas?: number
}) {
  const { viewMode } = useFilters()
  const isApresentacao = viewMode === 'apresentacao'
  const avatar = getAvatarMedico(nome)
  const metaOk = (percentualMeta || 0) >= 100
  const ocupacao = capacidadeAgenda ?? 0
  const ocupacaoOk = ocupacao >= 80
  const ocupacaoAlerta = ocupacao >= 50 && ocupacao < 80
  const conversaoOk = (taxaConversao || 0) >= 50
  const conversaoAlerta = (taxaConversao || 0) >= 25 && (taxaConversao || 0) < 50

  const statusClass = (good: boolean, alerta: boolean) =>
    good
      ? 'text-[var(--success)]'
      : alerta
      ? 'text-[var(--warning)]'
      : 'text-[var(--danger)]'

  return (
    <div className={`${isApresentacao ? 'p-6' : 'p-4'} ${metricCardBg()}`}>
      <div className="flex items-center gap-4">
        <div className={`shrink-0 overflow-hidden rounded-full bg-[var(--accent)]/15 ${isApresentacao ? 'h-20 w-20' : viewMode === 'iphone' ? 'h-14 w-14' : 'h-12 w-12'}`}>
          {avatar ? (
            <img src={avatar} alt={nome} className="h-full w-full object-cover" />
          ) : (
            <div className={`flex h-full w-full items-center justify-center font-bold text-[var(--accent)] ${isApresentacao ? 'text-[28px]' : viewMode === 'iphone' ? 'text-[18px]' : 'text-[16px]'}`}>
              {nome.charAt(0)}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className={`truncate font-bold ${textPrimary()} ${isApresentacao ? 'text-[24px]' : viewMode === 'iphone' ? 'text-[17px]' : 'text-[17px]'}`}>
            {nome}
          </p>

          <div className={`mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 ${textSecondary()} ${isApresentacao ? 'text-[16px]' : 'text-[13px]'} font-medium`}>
            <span className="inline-flex items-center">
              {atendimentos ?? 0} atend.
              <DeltaBadge atual={atendimentos} anterior={atendimentosAnterior} />
            </span>
            {procedimentos !== undefined && (
              <span>{procedimentos} procedimento{procedimentos === 1 ? '' : 's'}</span>
            )}
          </div>
        </div>
      </div>

      <div className={`mt-3 grid grid-cols-2 gap-2 border-t pt-3 ${isApresentacao ? 'border-[color:var(--border)]' : 'border-[color:var(--border)]'}`}>
        <div>
          <p className={`text-[12px] font-bold uppercase tracking-[0.06em] ${textSecondary()} ${isApresentacao ? 'text-[13px]' : ''}`}>
            Ocupação da agenda
          </p>
          <p className={`mt-0.5 font-medium ${isApresentacao ? 'text-[24px]' : 'text-[21px]'} ${statusClass(ocupacaoOk, ocupacaoAlerta)}`}>
            {formatPercent(ocupacao)}
          </p>
        </div>

        <div>
          <p className={`text-[12px] font-bold uppercase tracking-[0.06em] ${textSecondary()} ${isApresentacao ? 'text-[13px]' : ''}`}>
            Consolidado
          </p>
          <p className={`mt-0.5 font-medium ${isApresentacao ? 'text-[24px]' : 'text-[21px]'} ${textPrimary()}`}>
            {formatMoneyShort(faturamentoConsolidado || 0)}
            <DeltaBadge atual={faturamentoConsolidado} anterior={faturamentoConsolidadoAnterior} />
          </p>
        </div>

        <div>
          <p className={`text-[12px] font-bold uppercase tracking-[0.06em] ${textSecondary()} ${isApresentacao ? 'text-[13px]' : ''}`}>
            Ticket Médio
          </p>
          <p className={`mt-0.5 font-medium ${isApresentacao ? 'text-[24px]' : 'text-[21px]'} ${textPrimary()}`}>
            {formatMoney(ticketConsulta || 0)}
          </p>
        </div>

        <div>
          <p className={`text-[12px] font-bold uppercase tracking-[0.06em] ${textSecondary()} ${isApresentacao ? 'text-[13px]' : ''}`}>
            Alcance da meta
          </p>
          <p className={`mt-0.5 font-medium ${isApresentacao ? 'text-[24px]' : 'text-[21px]'} ${statusClass(metaOk, (percentualMeta || 0) >= 50 && !metaOk)}`}>
            {formatPercent(percentualMeta || 0)}
          </p>
        </div>

        <div className="col-span-2 grid grid-cols-3 gap-2">
          <div>
            <p className={`text-[12px] font-bold uppercase tracking-[0.06em] ${textSecondary()} ${isApresentacao ? 'text-[13px]' : ''}`}>
              Propostas
            </p>
            <p className={`mt-0.5 font-medium ${isApresentacao ? 'text-[24px]' : 'text-[21px]'} ${textPrimary()}`}>
              {propostasEnviadas ?? 0}
            </p>
          </div>

          <div>
            <p className={`text-[12px] font-bold uppercase tracking-[0.06em] ${textSecondary()} ${isApresentacao ? 'text-[13px]' : ''}`}>
              Fechadas
            </p>
            <p className={`mt-0.5 font-medium ${isApresentacao ? 'text-[24px]' : 'text-[21px]'} ${textPrimary()}`}>
              {vendasFechadas ?? 0}
            </p>
          </div>

          <div>
            <p className={`text-[12px] font-bold uppercase tracking-[0.06em] ${textSecondary()} ${isApresentacao ? 'text-[13px]' : ''}`}>
              Conversão
            </p>
            <p className={`mt-0.5 font-medium ${isApresentacao ? 'text-[24px]' : 'text-[21px]'} ${statusClass(conversaoOk, conversaoAlerta)}`}>
              {formatPercent(taxaConversao || 0)}
            </p>
          </div>
        </div>

        <div className="col-span-2">
          <p className={`text-[12px] font-bold uppercase tracking-[0.06em] ${textSecondary()} ${isApresentacao ? 'text-[13px]' : ''}`}>
            Pacientes novos
          </p>
          <p className={`mt-0.5 font-medium ${isApresentacao ? 'text-[24px]' : 'text-[21px]'} ${textPrimary()}`}>
            {consultasPrimeiraVez ?? 0}
            {retornos !== undefined && (
              <span className={`ml-1.5 text-[13px] font-medium ${textSecondary()}`}>
                · {retornos} retorno{retornos === 1 ? '' : 's'}
              </span>
            )}
          </p>
        </div>
      </div>

      {(noShow !== undefined || cancelados !== undefined || reagendados !== undefined) && (
        <div
          className={`mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-3 ${textSecondary()} ${
            isApresentacao ? 'text-[16px] border-[color:var(--border)]' : 'text-[14px] border-[color:var(--border)]'
          } font-medium`}
        >
          <span>No-show: <span className={textPrimary()}>{noShow ?? 0}</span></span>
          <span>Cancelados: <span className={textPrimary()}>{cancelados ?? 0}</span></span>
          <span>Reagendados: <span className={textPrimary()}>{reagendados ?? 0}</span></span>
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { periodo, tipoData, segmento, dataInicio, dataFim, viewMode, comparar, compararInicio, compararFim } = useFilters()

  const [data, setData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [leadsSelecionados, setLeadsSelecionados] = useState<('A' | 'B' | 'C' | 'D')[]>(['A'])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [now, setNow] = useState<Date>(new Date())

  useSetPageHeader('Visão Geral', <LiveIndicator lastUpdated={lastUpdated} now={now} />)

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(tick)
  }, [])



 useEffect(() => {
  async function loadData(showLoading = false) {
    try {
      if (showLoading) setLoading(true)
      setError(null)

      let url =
        `/api/test?periodo=${periodo}` +
        `&tipo=${tipoData}` +
        `&segmento=${segmento}` +
        `&t=${Date.now()}`

      if (periodo === 'personalizado' && dataInicio && dataFim) {
        url += `&inicio=${dataInicio}&fim=${dataFim}`
      }

      if (comparar && compararInicio && compararFim) {
        url += `&compararInicio=${compararInicio}&compararFim=${compararFim}`
      }

      const token = localStorage.getItem('access_token')

      const res = await fetch(url, {
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const json: DashboardResponse = await res.json()

      if (!json.ok) throw new Error(json.error || 'Erro ao buscar dados')

      setData((prev) => (deepEqual(prev, json) ? prev : json))

      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  loadData(true)

  const interval = setInterval(() => {
    loadData(false)
  }, 60000)

  return () => clearInterval(interval)
}, [periodo, tipoData, segmento, dataInicio, dataFim, comparar, compararInicio, compararFim])

  const marketing = data?.kpis?.marketing
  const comercialConsulta = data?.kpis?.comercialConsulta
  const comercialVendas = data?.kpis?.comercialVendas
  const consolidado = data?.consolidado
  const origens = data?.origens || []
  const primeiraMensagemTotal = data?.primeiraMensagem?.total || 0
  const primeiraMensagemOrigens = data?.primeiraMensagem?.origens || []
  const experienciaCliente = data?.kpis?.experienciaCliente
  const comparativo = data?.comparativo
  const consultaPorMedico = data?.consultaPorMedico || []
  const vendasPorMedico = data?.vendasPorMedico || []

  const medicosSnapshotMap = new Map<
    string,
    {
      nome: string
      atendimentos?: number
      quantidadeConsulta?: number
      valorConsulta?: number
      valorVendas?: number
      meta?: number
      procedimentos?: number
      capacidadeAgenda?: number
      noShow?: number
      cancelados?: number
      reagendados?: number
      consultasPrimeiraVez?: number
      retornos?: number
      atendimentosAnterior?: number
      faturamentoConsolidadoAnterior?: number
      consultasPrimeiraVezAnterior?: number
      retornosAnterior?: number
      noShowAnterior?: number
      canceladosAnterior?: number
      reagendadosAnterior?: number
      propostasEnviadas?: number
      vendasFechadas?: number
      taxaConversao?: number
    }
  >()

  consultaPorMedico.forEach((m) => {
    medicosSnapshotMap.set(m.medico, {
      ...medicosSnapshotMap.get(m.medico),
      nome: m.medico,
      atendimentos: m.atendimentos,
      quantidadeConsulta: m.quantidadeConsulta,
      valorConsulta: m.valorConsulta,
      capacidadeAgenda: m.capacidadeAgenda,
      noShow: m.noShow,
      cancelados: m.cancelados,
      reagendados: m.reagendados,
      consultasPrimeiraVez: m.consultasPrimeiraVez,
      retornos: m.retornos,
      atendimentosAnterior: m.atendimentosAnterior,
      faturamentoConsolidadoAnterior: m.faturamentoConsolidadoAnterior,
      consultasPrimeiraVezAnterior: m.consultasPrimeiraVezAnterior,
      retornosAnterior: m.retornosAnterior,
      noShowAnterior: m.noShowAnterior,
      canceladosAnterior: m.canceladosAnterior,
      reagendadosAnterior: m.reagendadosAnterior,
    })
  })

  vendasPorMedico.forEach((m) => {
    const procedimentos = (m.produtos || []).reduce((total, p) => total + (p.qtd || 0), 0)

    medicosSnapshotMap.set(m.nome, {
      ...medicosSnapshotMap.get(m.nome),
      nome: m.nome,
      valorVendas: m.valor,
      meta: m.meta,
      procedimentos,
      propostasEnviadas: m.propostasEnviadas,
      vendasFechadas: m.vendasFechadas,
      taxaConversao: m.taxaConversao,
    })
  })

  // Ticket médio e alcance da meta são calculados sobre o faturamento consolidado
  // (consulta + vendas), a mesma base usada no card "Consolidado" — usar apenas
  // consulta ou apenas vendas subestima os dois indicadores.
  const medicosSnapshot = Array.from(medicosSnapshotMap.values()).map((m) => {
    const faturamentoConsolidado = (m.valorConsulta || 0) + (m.valorVendas || 0)
    const quantidadeConsolidada = (m.quantidadeConsulta || 0) + (m.procedimentos || 0)

    return {
      ...m,
      faturamentoConsolidado,
      ticketConsulta:
        quantidadeConsolidada > 0 ? faturamentoConsolidado / quantidadeConsolidada : 0,
      percentualMeta: (m.meta || 0) > 0 ? (faturamentoConsolidado / (m.meta || 0)) * 100 : 0,
    }
  })
  if (loading) {
    return (
      <div className="grid gap-6 @xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`h-[440px] animate-pulse ${cardBg()}`} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-[18px] border border-[color:var(--danger)]/20 bg-[var(--danger)]/10 p-6 text-[var(--danger)]">
        {error}
      </div>
    )
  }

  const metaVendas = consolidado?.metaValorVendas || 0
  const metaTicket = consolidado?.metaTicketMedio || 2800
  const consolidadoVendasOk = (consolidado?.valorVendas || 0) >= metaVendas
  const consolidadoTicketOk = (consolidado?.ticketMedio || 0) >= metaTicket
  const vendasPercent = metaVendas > 0 ? ((consolidado?.valorVendas || 0) / metaVendas) * 100 : 0
  const ticketPercent = metaTicket > 0 ? ((consolidado?.ticketMedio || 0) / metaTicket) * 100 : 0
  const origensTop = origens.slice(0, 10)
  const origensTotal = origens.reduce((acc, o) => acc + o.quantidade, 0)
  const leadsPorTipo = {
  A: marketing?.leadA || 0,
  B: marketing?.leadB || 0,
  C: marketing?.leadC || 0,
  D: marketing?.leadD || 0,
}

const quantidadeLeadSelecionado = leadsSelecionados.reduce(
    (total, item) => total + leadsPorTipo[item],
    0
  )

  // Convertido filtrado pelas mesmas tags (A/B/C/D) selecionadas em "Leads
  // aceitos (SAL)" — só conta convertidos que têm a tag selecionada. O
  // "Convertido geral" (sem filtro de tag) usa marketing.convertidos direto.
  const convertidoPorTag = {
    A: marketing?.convertidoLeadA || 0,
    B: marketing?.convertidoLeadB || 0,
    C: marketing?.convertidoLeadC || 0,
    D: marketing?.convertidoLeadD || 0,
  }

  const convertidoFiltrado = leadsSelecionados.reduce(
    (total, item) => total + convertidoPorTag[item],
    0
  )

  const convertidosFiltradoPercent =
  quantidadeLeadSelecionado > 0
    ? (convertidoFiltrado / quantidadeLeadSelecionado) * 100
    : 0


  return (
     <div className="space-y-3">

    <div
  className={`grid gap-3 ${
    viewMode === 'apresentacao' || viewMode === 'iphone'
  ? 'grid-cols-1'
  : 'grid-cols-1 @md:grid-cols-2 @xl:grid-cols-4'
  }`}
>
          <GroupCard title="Marketing / Topo de Funil" icon={<Funnel size={26} />}>
           <SimpleMetric
  label="Total de leads recebidos"
  value={marketing?.totalEntradas || 0}
  previousValue={comparativo?.marketing?.totalEntradasAnterior}
  showCompare={comparar}
/>
            <GoalMetric
              label="Leads não qualificados"
              value={marketing?.naoQualificados || 0}
              percent={marketing?.naoQualificadosPercent || 0}
              target={10}
              mode="max"
            />
            <div className="space-y-3">
  <h4
    className={`${
      viewMode === 'apresentacao' ? 'text-[28px] font-semibold' : viewMode === 'iphone' ? 'text-[15px] font-semibold' : 'text-[14px] font-medium'
    } leading-tight ${textSecondary()}`}
  >
    Leads aceitos (SAL)
  </h4>

  <div className="grid grid-cols-5 gap-3">
    {(['A', 'B', 'C', 'D'] as const).map((item) => (
      <button
        key={item}
        type="button"
        onClick={() =>
  setLeadsSelecionados((atual) =>
    atual.includes(item)
      ? atual.filter((lead) => lead !== item)
      : [...atual, item]
  )
}
        className={`rounded-lg border py-1.5 font-bold transition-colors duration-200 ${
          leadsSelecionados.includes(item)
            ? 'border-[color:var(--success)] bg-[var(--success)]/10 text-[var(--success)]'
            : 'border-[color:var(--border)] bg-[var(--metric-card)] text-[var(--muted-foreground)] hover:border-[var(--accent)]/40 hover:text-[var(--foreground)]'
        } ${viewMode === 'apresentacao' ? 'text-[28px]' : viewMode === 'iphone' ? 'text-[15px]' : 'text-[14px]'}`}
      >
        {item}
      </button>
    ))}

    <PrimeiraMensagemTile total={primeiraMensagemTotal} origens={primeiraMensagemOrigens} />
  </div>
    <SimpleMetric
   label=""
   value={quantidadeLeadSelecionado}
   previousValue={comparativo?.marketing?.leadsAceitosAnterior}
   showCompare={comparar}
/>

  
</div>
<div className="space-y-2">
  <div
    className={`flex items-center gap-3 ${
      viewMode === 'apresentacao'
        ? 'text-[28px]'
        : viewMode === 'iphone'
          ? 'text-[15px]'
          : 'text-[14px]'
    }`}
  >
    <span className="font-medium text-[var(--success)]">
      {formatPercent(
        marketing?.totalEntradas
          ? (quantidadeLeadSelecionado / marketing.totalEntradas) * 100
          : 0
      )}
    </span>

    <span className={textSecondary()}>
      dos leads recebidos
    </span>
  </div>

  <div
    className={`overflow-hidden rounded-full bg-[var(--progress-bg)] ${
      viewMode === 'apresentacao'
        ? 'h-2.5'
        : viewMode === 'iphone'
          ? 'h-2'
          : 'h-1.5'
    }`}
  >
    <div
      className="h-full rounded-full bg-[var(--success)]"
      style={{
        width: `${
          marketing?.totalEntradas
            ? (quantidadeLeadSelecionado /
                marketing.totalEntradas) *
              100
            : 0
        }%`,
      }}
    />
  </div>
</div>
            <GoalMetric
  label="Convertido"
  value={convertidoFiltrado}
  percent={convertidosFiltradoPercent}
  target={30}
  mode="min"
  empty={quantidadeLeadSelecionado === 0}
/>
            <GoalMetric
  label="Convertido geral"
  value={marketing?.convertidos || 0}
  percent={marketing?.convertidosPercent || 0}
  target={30}
  mode="min"
/>
          </GroupCard>

          <GroupCard title="Comercial I e II" icon={<Stethoscope size={26} />}>
  <div className="grid grid-cols-2 gap-4 md:gap-7">
    <div className="min-w-0 space-y-2">
      <div className="flex items-center gap-3">
        <span className="h-3 w-3 shrink-0 rounded-full bg-[var(--accent)]" />
        <h4 className={`truncate ${viewMode === 'apresentacao' ? 'text-[26px]' : viewMode === 'iphone' ? 'text-[13px]' : 'text-[14px]'} font-bold uppercase tracking-wide ${textSecondary()}`}>
          Consulta
        </h4>
      </div>
      <SimpleMetric
  label="Quantidade"
  value={comercialConsulta?.quantidadeConsulta || 0}
  previousValue={comparativo?.comercialConsulta?.quantidadeConsultaAnterior}
  showCompare={comparar}
/>

<SimpleMetric
  label="Recebimento"
  value={formatMoney(comercialConsulta?.valorTotalConsulta || 0)}
  previousValue={comparativo?.comercialConsulta?.valorTotalConsultaAnterior}
  showCompare={comparar}
/>

<SimpleMetric
  label="Ticket M."
  value={formatMoney(comercialConsulta?.ticketMedioConsulta || 0)}
  previousValue={comparativo?.comercialConsulta?.ticketMedioConsultaAnterior}
  showCompare={comparar}
  empty={!comercialConsulta?.quantidadeConsulta}
/>
    </div>

    <div className="min-w-0 space-y-2">
      <div className="flex items-center gap-3">
        <span className="h-3 w-3 shrink-0 rounded-full bg-[var(--accent)]" />
        <h4 className={`truncate ${viewMode === 'apresentacao' ? 'text-[26px]' : viewMode === 'iphone' ? 'text-[13px]' : 'text-[14px]'} font-bold uppercase tracking-wide ${textSecondary()}`}>
          Reabord
        </h4>
      </div>

      <SimpleMetric
  label="Quantidade"
  value={comercialConsulta?.quantidadeReabord || 0}
  previousValue={comparativo?.comercialConsulta?.quantidadeReabordAnterior}
  showCompare={comparar}
/>

<SimpleMetric
  label="Recebimento"
  value={formatMoney(comercialConsulta?.valorTotalReabord || 0)}
  previousValue={comparativo?.comercialConsulta?.valorTotalReabordAnterior}
  showCompare={comparar}
/>

<SimpleMetric
  label="Ticket M."
  value={formatMoney(comercialConsulta?.ticketMedioReabord || 0)}
  previousValue={comparativo?.comercialConsulta?.ticketMedioReabordAnterior}
  showCompare={comparar}
  empty={!comercialConsulta?.quantidadeReabord}
/>
    </div>
  </div>

  <div className="border-t border-[color:var(--border)] pt-1">
    <div className="mb-1 flex items-center gap-3">
      <span className="h-3 w-3 rounded-full bg-[var(--accent)]" />
      <h4 className={`${viewMode === 'apresentacao' ? 'text-[26px]' : viewMode === 'iphone' ? 'text-[13px]' : 'text-[14px]'} font-bold uppercase tracking-wide ${textSecondary()}`}>
        Total semanal
      </h4>
    </div>

    <div className="space-y-0.5">
      <SimpleMetric
  label="Quantidade"
  value={comercialConsulta?.quantidadeTotal || 0}
  previousValue={comparativo?.comercialConsulta?.quantidadeTotalAnterior}
  showCompare={comparar}
/>

<SimpleMetric
  label="Recebimento"
  value={formatMoney(comercialConsulta?.valorTotal || 0)}
  previousValue={comparativo?.comercialConsulta?.valorTotalAnterior}
  showCompare={comparar}
/>

<SimpleMetric
  label="Ticket M."
  value={formatMoney(comercialConsulta?.ticketMedioTotal || 0)}
  previousValue={comparativo?.comercialConsulta?.ticketMedioTotalAnterior}
  showCompare={comparar}
  empty={!comercialConsulta?.quantidadeTotal}
/>
    </div>
  </div>
</GroupCard>

          <GroupCard title="Comercial III" icon={<Users size={26} />}>
           <SimpleMetric
  label="Propostas enviadas"
  value={comercialVendas?.propostasEnviadas || 0}
  previousValue={comparativo?.comercialVendas?.propostasEnviadasAnterior}
  showCompare={comparar}
/>

<GoalMetric
  label="Propostas fechadas"
  value={comercialVendas?.propostasFechadas || 0}
  percent={comercialVendas?.propostasFechadasPercent || 0}
  target={comercialVendas?.metaPropostasFechadasPercent || 70}
  mode="min"
  empty={!comercialVendas?.propostasEnviadas}
/>

<SimpleMetric
  label="Valor total de vendas"
  value={formatMoney(comercialVendas?.valorTotalVendas || 0)}
  previousValue={comparativo?.comercialVendas?.valorTotalVendasAnterior}
  showCompare={comparar}
/>

<SimpleMetric
  label="Ticket Médio"
  value={formatMoney(comercialVendas?.ticketMedioVendas || 0)}
  previousValue={comparativo?.comercialVendas?.ticketMedioVendasAnterior}
  showCompare={comparar}
  empty={!comercialVendas?.propostasFechadas}
/>

<SimpleMetric
  label="Ciclo de venda"
  value={`${(comercialVendas?.cicloVendaDias || 0).toFixed(1)} dias`}
  empty={!comercialVendas?.propostasFechadas}
/>
          </GroupCard>

         <GroupCard title="Comparecimento" icon={<Star size={26} />}>
  <GoalMetric
    label="No Show"
    value={experienciaCliente?.noShow ?? 0}
    percent={experienciaCliente?.noShowPercent ?? 0}
    target={experienciaCliente?.metaNoShowPercent ?? 10}
    metaLabel={`ideal até ${experienciaCliente?.metaNoShowQuantidade ?? 0}`}
    mode="max"
    previousValue={comparativo?.statusAgenda?.noShowAnterior}
    showCompare={comparar}
  />

  <GoalMetric
    label="Reagendados"
    value={experienciaCliente?.reagendados ?? 0}
    percent={experienciaCliente?.reagendadosPercent ?? 0}
    target={30}
    mode="max"
    previousValue={comparativo?.statusAgenda?.reagendadosAnterior}
    showCompare={comparar}
  />

  <GoalMetric
    label="Cancelados"
    value={experienciaCliente?.cancelados ?? 0}
    percent={experienciaCliente?.canceladosPercent ?? 0}
    target={10}
    mode="max"
    previousValue={comparativo?.statusAgenda?.canceladosAnterior}
    showCompare={comparar}
  />

 <div className="border-t border-[color:var(--border)] pt-2">
    <div className="mb-2 flex items-center gap-3">
  <span className="h-3 w-3 rounded-full bg-[var(--accent)]" />
  <h4
  className={`${
    viewMode === 'apresentacao'
      ? 'text-[26px]'
      : viewMode === 'iphone'
      ? 'text-[13px]'
      : 'text-[14px]'
  } font-bold uppercase tracking-wide ${textSecondary()}`}
>
    Experiência do Cliente
  </h4>
</div>

    <GoalMetric
      label="NPS (Google)"
      value={experienciaCliente?.npsGoogle ?? 0}
      percent={experienciaCliente?.npsGooglePercent ?? 0}
      target={experienciaCliente?.metaNpsGoogle ?? 25}
      mode="min"
    />
  </div>
</GroupCard>
        </div>

        <section className={`px-4 py-2 ${cardBg()}`}>
          <div className="mb-3 flex items-center gap-3">
  <div
  className={`${
    viewMode === 'apresentacao'
      ? 'h-12 w-12'
      : viewMode === 'iphone'
      ? 'h-8 w-8'
      : 'h-6 w-6'
  } flex shrink-0 items-center justify-center text-[var(--accent)]`}
>
  <ChartNoAxesCombined size={26} />
</div>
  <h3
    className={`${
      viewMode === 'apresentacao'
        ? 'text-[42px]'
        : viewMode === 'iphone'
        ? 'text-[20px]'
        : 'text-[20px]'
    } font-bold tracking-[-0.02em] ${textPrimary()}`}
  >
    Consolidado
  </h3>
</div>

           <div className="grid grid-cols-1 gap-2">
            <div className={`space-y-1 ${metricCardBg()}`}>
  <SimpleMetric
    label="Quantidade total de vendas"
    value={consolidado?.qtdVendas || 0}
    previousValue={comparativo?.consolidado?.qtdVendasAnterior}
    showCompare={comparar}
  />
</div>

<div className={`space-y-1 ${metricCardBg()}`}>
  <SimpleMetric
    label="Total do valor de venda"
    value={formatMoney(consolidado?.valorVendas || 0)}
    previousValue={comparativo?.consolidado?.valorVendasAnterior}
    showCompare={comparar}
  />

  <div
    className={`flex items-center gap-3 ${
      viewMode === 'apresentacao' ? 'text-[32px]' : viewMode === 'iphone' ? 'text-[15px]' : 'text-[14px]'
    }`}
  >
    <span
      className={
        consolidadoVendasOk
          ? 'font-semibold text-[var(--success)]'
          : 'font-semibold text-[var(--danger)]'
      }
    >
      {formatPercent(vendasPercent)}
    </span>

    <span className={textSecondary()}>
      da meta de {formatMoneyShort(metaVendas)} atingida
    </span>
  </div>

  <div
    className={`overflow-hidden rounded-full bg-[var(--progress-bg)] ${
      viewMode === 'apresentacao'
        ? 'h-2.5'
        : viewMode === 'iphone'
        ? 'h-2'
        : 'h-1.5'
    }`}
  >
    <div
      className={`h-full rounded-full ${
        consolidadoVendasOk
          ? 'bg-[var(--success)]'
          : 'bg-[var(--danger)]'
      }`}
      style={{ width: `${clampPercent(vendasPercent)}%` }}
    />
  </div>
</div>

<div className={`space-y-1 ${metricCardBg()}`}>
  <SimpleMetric
    label="Ticket médio total"
    value={formatMoney(consolidado?.ticketMedio || 0)}
    previousValue={comparativo?.consolidado?.ticketMedioAnterior}
    showCompare={comparar}
    empty={!consolidado?.qtdVendas}
  />

  <div
    className={`flex items-center gap-3 ${
      viewMode === 'apresentacao' ? 'text-[32px]' : viewMode === 'iphone' ? 'text-[15px]' : 'text-[14px]'
    }`}
  >
    <span
      className={
        consolidadoTicketOk
          ? 'font-semibold text-[var(--success)]'
          : 'font-semibold text-[var(--danger)]'
      }
    >
      {consolidadoTicketOk ? 'atingido' : 'abaixo'}
    </span>

    <span className={textSecondary()}>
      mín. {formatMoney(metaTicket)}
    </span>
  </div>

  <div
    className={`overflow-hidden rounded-full bg-[var(--progress-bg)] ${
      viewMode === 'apresentacao'
        ? 'h-2.5'
        : viewMode === 'iphone'
        ? 'h-2'
        : 'h-1.5'
    }`}
  >
    <div
      className={`h-full rounded-full ${
        consolidadoTicketOk
          ? 'bg-[var(--success)]'
          : 'bg-[var(--danger)]'
      }`}
      style={{ width: `${clampPercent(ticketPercent)}%` }}
    />
  </div>
</div>
          </div>
        </section>

        {medicosSnapshot.length > 0 && (
          <section className={`px-4 py-2 ${cardBg()}`}>
            <div className="mb-3 flex items-center gap-3">
              <div
                className={`${
                  viewMode === 'apresentacao' ? 'h-12 w-12' : viewMode === 'iphone' ? 'h-8 w-8' : 'h-6 w-6'
                } flex shrink-0 items-center justify-center text-[var(--accent)]`}
              >
                <UserRound size={26} />
              </div>
              <h3
                className={`${
                  viewMode === 'apresentacao' ? 'text-[42px]' : 'text-[20px]'
                } font-bold tracking-[-0.02em] ${textPrimary()}`}
              >
                Médicos
              </h3>
            </div>

            <div
              className={`grid gap-3 ${
                viewMode === 'apresentacao' || viewMode === 'iphone'
                  ? 'grid-cols-1'
                  : 'grid-cols-[repeat(auto-fit,minmax(310px,1fr))]'
              }`}
            >
              {medicosSnapshot.map((m) => (
                <MedicoSnapshotCard
                  key={m.nome}
                  nome={m.nome}
                  atendimentos={m.atendimentos}
                  atendimentosAnterior={m.atendimentosAnterior}
                  ticketConsulta={m.ticketConsulta}
                  faturamentoConsolidado={m.faturamentoConsolidado}
                  faturamentoConsolidadoAnterior={m.faturamentoConsolidadoAnterior}
                  percentualMeta={m.percentualMeta}
                  procedimentos={m.procedimentos}
                  capacidadeAgenda={m.capacidadeAgenda}
                  noShow={m.noShow}
                  cancelados={m.cancelados}
                  reagendados={m.reagendados}
                  consultasPrimeiraVez={m.consultasPrimeiraVez}
                  retornos={m.retornos}
                  taxaConversao={m.taxaConversao}
                  propostasEnviadas={m.propostasEnviadas}
                  vendasFechadas={m.vendasFechadas}
                />
              ))}
            </div>
          </section>
        )}

        <ProjecaoMedicosResumoCard periodo={periodo} dataInicio={dataInicio} />

        <OrigensPrimeiraMensagemCard
          origens={origensTop}
          origensTotal={origensTotal}
          primeiraMensagemOrigens={primeiraMensagemOrigens}
          primeiraMensagemTotal={primeiraMensagemTotal}
        />

      </div>
  )
}