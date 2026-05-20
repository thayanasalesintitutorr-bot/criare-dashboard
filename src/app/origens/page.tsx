'use client'

import { useEffect, useState } from 'react'
import {
  Bell,
  CalendarCheck2,
  ClipboardList,
  Search,
  Star,
  Stethoscope,
  Users,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

import { AppShell } from '@/components/layout/app-shell'
import { useFilters } from '@/store/use-filters'

type UltimoLead = {
  id: number
  nome?: string
  name?: string
  pipeline_id: string | null
  status_id: string | null
  medico: string | null
  faturamento: number
  venda: number
  created_at: string | null
  updated_at: string | null
  closed_at: string | null
  closest_task_at: string | null
  campanha: string | null
  source: string | null
}

type EvolucaoDiariaItem = {
  data: string
  label: string
  leads: number
  vendas: number
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
      agendados: number
      agendadosPercent: number
    }
    comercialConsulta: {
      quantidadeConsulta: number
      valorTotalConsulta: number
      ticketMedioConsulta: number
    }
    comercialVendas: {
      propostasEnviadas: number
      propostasFechadas: number
      propostasFechadasPercent: number
      valorTotalVendas: number
      ticketMedioVendas: number
      metaPropostasFechadasPercent: number
      metaValorTotalVendas: number
      metaTicketMedio: number
    }
  }
  funil?: {
    entrada: number
    primeiroContato: number
    qualificado: number
    agendado: number
    venda: number
  }
  evolucaoDiaria?: EvolucaoDiariaItem[]
  listas?: {
    ultimosAtualizados: UltimoLead[]
  }
  error?: string
}

function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })
}

function formatMoneyShort(value: number) {
  if (value >= 1000000) {
    const v = value / 1000000
    return `R$ ${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)} mi`
  }
  if (value >= 1000) {
    const v = value / 1000
    return `R$ ${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)} mil`
  }
  return formatMoney(value)
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`
}

function getMetricStatus(
  valuePercent: number,
  targetPercent: number,
  mode: 'max' | 'min'
) {
  const isGood =
    mode === 'max'
      ? valuePercent <= targetPercent
      : valuePercent >= targetPercent

  return {
    isGood,
    barClass: isGood ? 'bg-emerald-400' : 'bg-rose-400',
    textClass: isGood ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400',
  }
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(value, 100))
}

function textPrimary() {
  return 'text-slate-900 dark:text-white'
}

function textSecondary() {
  return 'text-slate-600 dark:text-[var(--muted-foreground)]'
}

function cardBg() {
  return 'border border-black/5 bg-white/80 shadow-[0_16px_50px_rgba(15,23,42,0.08)] dark:border-white/5 dark:bg-white/[0.03] dark:shadow-[0_18px_60px_rgba(0,0,0,0.18)]'
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
  return (
    <section className={`rounded-[28px] p-6 ${cardBg()}`}>
      <div className="mb-5 flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)]/18 text-[var(--accent)]">
          {icon}
        </div>

        <h3 className={`text-[24px] font-black leading-[1.05] tracking-[-0.04em] ${textPrimary()}`}>
          {title}
        </h3>
      </div>

      <div className="space-y-7">{children}</div>
    </section>
  )
}

function SimpleMetric({
  label,
  value,
  accent = 'gold',
}: {
  label: string
  value: number | string
  accent?: 'gold' | 'blue' | 'green'
}) {
  const dotClass =
    accent === 'blue'
      ? 'bg-sky-400'
      : accent === 'green'
      ? 'bg-emerald-400'
      : 'bg-[var(--accent)]'

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className={`h-3 w-3 rounded-full ${dotClass}`} />
        <h4 className={`text-[15px] font-semibold ${textPrimary()}`}>{label}</h4>
      </div>

      <div className={`text-4xl font-black tracking-[-0.05em] ${textPrimary()}`}>
        {value}
      </div>
    </div>
  )
}

function GoalMetric({
  label,
  value,
  percent,
  target,
  mode,
}: {
  label: string
  value: number | string
  percent: number
  target: number
  mode: 'max' | 'min'
}) {
  const status = getMetricStatus(percent, target, mode)

  return (
    <div className="space-y-2">
      <h4 className={`text-[15px] font-semibold leading-tight ${textPrimary()}`}>
        {label}
      </h4>

      <div className={`text-4xl font-black tracking-[-0.05em] ${textPrimary()}`}>
        {value}
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className={`font-semibold ${status.textClass}`}>
          {formatPercent(percent)}
        </span>
        <span className={textSecondary()}>de</span>
        <span className={textSecondary()}>{target}%</span>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
        <div
          className={`h-3 rounded-full ${status.barClass}`}
          style={{ width: `${clampPercent(percent)}%` }}
        />
      </div>
    </div>
  )
}

function ConsolidatedMetric({
  label,
  value,
  targetLabel,
  good,
  percent,
}: {
  label: string
  value: string | number
  targetLabel: string
  good: boolean
  percent?: number
}) {
  const barWidth = percent !== undefined ? clampPercent(percent) : good ? 100 : 58

  return (
    <div className="space-y-2 rounded-[22px] bg-slate-100/90 p-4 dark:bg-white/[0.04]">
      <div className={`text-sm font-semibold ${textPrimary()}`}>{label}</div>
      <div className={`text-3xl font-black tracking-[-0.04em] ${textPrimary()}`}>{value}</div>
      <div className="flex items-center gap-2 text-sm">
        <span className={good ? 'text-emerald-500 dark:text-emerald-400 font-semibold' : 'text-rose-500 dark:text-rose-400 font-semibold'}>
          {good ? 'atingido' : 'abaixo'}
        </span>
        <span className={textSecondary()}>{targetLabel}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
        <div
          className={`h-3 rounded-full ${good ? 'bg-emerald-400' : 'bg-rose-400'}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  )
}

function ExperiencePlaceholder({ label }: { label: string }) {
  return (
    <div className="space-y-2">
      <h4 className={`text-[15px] font-semibold ${textPrimary()}`}>{label}</h4>
      <div className={`text-4xl font-black tracking-[-0.05em] ${textPrimary()}`}>—</div>
      <p className={`text-sm ${textSecondary()}`}>Em breve com integração Google</p>
      <div className="h-3 rounded-full bg-slate-200 dark:bg-white/10">
        <div className="h-3 w-[32%] rounded-full bg-slate-300 dark:bg-white/15" />
      </div>
    </div>
  )
}

/* ── Tooltip do gráfico ──────────────────────────────────── */

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-xl border border-white/10 bg-[#0a1e3d] px-4 py-3 text-sm shadow-xl">
      <div className="mb-1 font-semibold text-white/70">{label}</div>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: entry.color }}
          />
          <span className="text-white/60">{entry.name === 'leads' ? 'Leads' : 'Vendas'}:</span>
          <span className="font-bold text-white">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Componente principal ────────────────────────────────── */

export default function DashboardPage() {
  const { periodo, tipoData } = useFilters()

  const [data, setData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)

        const token = localStorage.getItem('access_token')

const res = await fetch(`/api/test?periodo=${periodo}&tipo=${tipoData}`, {
  cache: 'no-store',
  headers: {
    Authorization: `Bearer ${token}`,
  },
})

        const json: DashboardResponse = await res.json()

        if (!json.ok) {
          throw new Error(json.error || 'Erro ao buscar dados')
        }

        setData(json)
      } catch (err: any) {
        setError(err.message || 'Erro inesperado')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [periodo, tipoData])

  const marketing = data?.kpis?.marketing
  const comercialConsulta = data?.kpis?.comercialConsulta
  const comercialVendas = data?.kpis?.comercialVendas
  const funil = data?.funil
  const evolucaoDiaria = data?.evolucaoDiaria || []
  const ultimosAtualizados = data?.listas?.ultimosAtualizados || []

  if (loading) {
    return (
      <AppShell title="Visão Geral">
        <div className="grid gap-6 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className={`h-[440px] animate-pulse rounded-[28px] ${cardBg()}`} />
          ))}
        </div>
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell title="Visão Geral">
        <div className="rounded-[28px] border border-red-500/20 bg-red-500/10 p-6 text-red-300">
          {error}
        </div>
      </AppShell>
    )
  }

  const metaVendas = comercialVendas?.metaValorTotalVendas || 0
  const metaTicket = comercialVendas?.metaTicketMedio || 2800

  const consolidadoVendasOk = (comercialVendas?.valorTotalVendas || 0) >= metaVendas
  const consolidadoTicketOk = (comercialVendas?.ticketMedioVendas || 0) >= metaTicket
  const consolidadoQtdOk = (comercialVendas?.propostasFechadas || 0) > 0

  const vendasPercent = metaVendas > 0
    ? ((comercialVendas?.valorTotalVendas || 0) / metaVendas) * 100
    : 0
  const ticketPercent = metaTicket > 0
    ? ((comercialVendas?.ticketMedioVendas || 0) / metaTicket) * 100
    : 0

  return (
    <AppShell title="Visão Geral">
      <div className="space-y-8">
        {/* ── KPIs ───────────────────────────────────────── */}
        <div className="grid gap-6 xl:grid-cols-[1.08fr_1fr_1fr_0.9fr]">
          {/* Marketing */}
          <GroupCard title="Marketing / Topo de Funil" icon={<ClipboardList size={26} />}>
            <SimpleMetric
              label="Total de leads recebidos"
              value={marketing?.totalEntradas || 0}
              accent="blue"
            />

            <GoalMetric
              label="Leads não qualificados"
              value={marketing?.naoQualificados || 0}
              percent={marketing?.naoQualificadosPercent || 0}
              target={10}
              mode="max"
            />

            <GoalMetric
              label="Leads aceitos (SAL - lead aceito)"
              value={marketing?.leadsAceitos || 0}
              percent={marketing?.leadsAceitosPercent || 0}
              target={90}
              mode="min"
            />

            <GoalMetric
              label="Lead SQL (Agendado)"
              value={marketing?.agendados || 0}
              percent={marketing?.agendadosPercent || 0}
              target={30}
              mode="min"
            />
          </GroupCard>

          {/* Comercial I e II */}
          <GroupCard title="Comercial I e II" icon={<Stethoscope size={26} />}>
            <SimpleMetric
              label="Quantidade de consulta"
              value={comercialConsulta?.quantidadeConsulta || 0}
              accent="blue"
            />

            <SimpleMetric
              label="Valor de consulta"
              value={formatMoney(comercialConsulta?.valorTotalConsulta || 0)}
              accent="gold"
            />

            <SimpleMetric
              label="Ticket Médio"
              value={formatMoney(comercialConsulta?.ticketMedioConsulta || 0)}
              accent="green"
            />
          </GroupCard>

          {/* Comercial III */}
          <GroupCard title="Comercial III" icon={<Users size={26} />}>
            <SimpleMetric
              label="Propostas enviadas"
              value={comercialVendas?.propostasEnviadas || 0}
              accent="blue"
            />

            <GoalMetric
              label="Propostas fechadas"
              value={comercialVendas?.propostasFechadas || 0}
              percent={comercialVendas?.propostasFechadasPercent || 0}
              target={comercialVendas?.metaPropostasFechadasPercent || 70}
              mode="min"
            />

            <SimpleMetric
              label="Valor total de vendas"
              value={formatMoney(comercialVendas?.valorTotalVendas || 0)}
              accent="gold"
            />
          </GroupCard>

          {/* Experiência do Cliente */}
          <GroupCard title="Experiência do Cliente" icon={<Star size={26} />}>
            <ExperiencePlaceholder label="No Show" />
            <ExperiencePlaceholder label="NPS (Google)" />
          </GroupCard>
        </div>

        {/* ── Evolução diária ────────────────────────────── */}
        {evolucaoDiaria.length > 1 && (
          <section className={`rounded-[28px] p-6 ${cardBg()}`}>
            <div className="mb-6 flex items-center gap-3">
              <span className="h-8 w-1.5 rounded-full bg-[var(--accent)]" />
              <h3 className={`text-[24px] font-black tracking-[-0.04em] ${textPrimary()}`}>
                Evolução Diária
              </h3>
            </div>

            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={evolucaoDiaria} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f8cff" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#4f8cff" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gradVendas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />

                  <XAxis
                    dataKey="label"
                    tick={{ fill: 'rgba(148,163,184,0.7)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    tick={{ fill: 'rgba(148,163,184,0.7)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />

                  <Tooltip content={<ChartTooltip />} />

                  <Area
                    type="monotone"
                    dataKey="leads"
                    name="leads"
                    stroke="#4f8cff"
                    strokeWidth={2.5}
                    fill="url(#gradLeads)"
                  />

                  <Area
                    type="monotone"
                    dataKey="vendas"
                    name="vendas"
                    stroke="#34d399"
                    strokeWidth={2.5}
                    fill="url(#gradVendas)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm">
                <span className="h-3 w-3 rounded-full bg-[#4f8cff]" />
                <span className={textSecondary()}>Leads (entrada)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="h-3 w-3 rounded-full bg-[#34d399]" />
                <span className={textSecondary()}>Vendas</span>
              </div>
            </div>
          </section>
        )}

        {/* ── Etapas dos leads + Consolidado ─────────────── */}
        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
          {/* Etapas dos leads */}
          <div className={`rounded-[28px] p-6 ${cardBg()}`}>
            <div className="mb-5 flex items-center gap-3">
              <span className="h-8 w-1.5 rounded-full bg-[var(--accent)]" />
              <h3 className={`text-[24px] font-black tracking-[-0.04em] ${textPrimary()}`}>
                Etapas dos leads
              </h3>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Entrada', value: funil?.entrada || 0, color: 'from-violet-500 to-[var(--accent)]' },
                { label: 'Primeiro Contato', value: funil?.primeiroContato || 0, color: 'from-violet-400 to-[var(--accent)]' },
                { label: 'Qualificado', value: funil?.qualificado || 0, color: 'from-violet-500 to-[var(--accent)]' },
                { label: 'Agendado', value: funil?.agendado || 0, color: 'from-violet-400 to-[var(--accent)]' },
                { label: 'Venda', value: funil?.venda || 0, color: 'from-violet-500 to-[var(--accent)]' },
              ].map((item) => {
                const base = Math.max(funil?.entrada || 1, 1)
                const width = Math.max(12, (item.value / base) * 100)

                return (
                  <div key={item.label} className="grid grid-cols-[150px_1fr_80px] items-center gap-4">
                    <div className={`text-sm font-medium ${textSecondary()}`}>{item.label}</div>

                    <div className="h-14 rounded-2xl bg-slate-200 dark:bg-white/8">
                      <div
                        className={`flex h-14 items-center rounded-2xl bg-gradient-to-r px-5 text-lg font-bold text-white ${item.color}`}
                        style={{ width: `${width}%` }}
                      >
                        {item.value}
                      </div>
                    </div>

                    <div className={`text-right text-sm ${textSecondary()}`}>
                      {formatPercent((item.value / base) * 100)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Consolidado */}
          <div className={`rounded-[28px] p-6 ${cardBg()}`}>
            <div className="mb-5 flex items-center gap-3">
              <span className="h-8 w-1.5 rounded-full bg-[var(--accent)]" />
              <h3 className={`text-[24px] font-black tracking-[-0.04em] ${textPrimary()}`}>
                Consolidado
              </h3>
            </div>

            <div className="grid gap-4">
              <ConsolidatedMetric
                label="Total de quantidade vendas"
                value={comercialVendas?.propostasFechadas || 0}
                targetLabel="com fechamento no período"
                good={consolidadoQtdOk}
              />

              <ConsolidatedMetric
                label="Total do valor de venda"
                value={formatMoney(comercialVendas?.valorTotalVendas || 0)}
                targetLabel={`mín. ${formatMoneyShort(metaVendas)}`}
                good={consolidadoVendasOk}
                percent={vendasPercent}
              />

              <ConsolidatedMetric
                label="Ticket médio total"
                value={formatMoney(comercialVendas?.ticketMedioVendas || 0)}
                targetLabel={`mín. ${formatMoney(metaTicket)}`}
                good={consolidadoTicketOk}
                percent={ticketPercent}
              />
            </div>
          </div>
        </section>

        {/* ── Últimos leads ──────────────────────────────── */}
        <section className={`rounded-[28px] p-6 ${cardBg()}`}>
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="h-8 w-1.5 rounded-full bg-[var(--accent)]" />
              <h3 className={`text-[24px] font-black tracking-[-0.04em] ${textPrimary()}`}>
                Últimos leads atualizados
              </h3>
            </div>

            <div className={textSecondary()}>
              <div className="flex items-center gap-3">
                <Search size={16} />
                <Bell size={16} />
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[22px] border border-black/5 dark:border-white/5">
            <div className="grid grid-cols-4 gap-4 border-b border-black/5 bg-slate-100/80 px-6 py-4 text-xs uppercase tracking-[0.16em] text-slate-500 dark:border-white/5 dark:bg-white/[0.03] dark:text-[var(--muted-foreground)]">
              <div>Nome</div>
              <div>Status</div>
              <div>Médico</div>
              <div>Atualizado em</div>
            </div>

            <div className="divide-y divide-black/5 dark:divide-white/5">
              {ultimosAtualizados.length > 0 ? (
                ultimosAtualizados.slice(0, 8).map((item) => (
                  <div key={item.id} className="grid grid-cols-4 gap-4 px-6 py-5">
                    <div className={`font-semibold ${textPrimary()}`}>
                      {item.name || item.nome || `Lead #${item.id}`}
                    </div>

                    <div className={textSecondary()}>
                      {item.status_id || '—'}
                    </div>

                    <div className={textSecondary()}>
                      {item.medico || '—'}
                    </div>

                    <div className={textSecondary()}>
                      {item.updated_at
                        ? new Date(item.updated_at).toLocaleString('pt-BR')
                        : '—'}
                    </div>
                  </div>
                ))
              ) : (
                <div className={`px-6 py-10 ${textSecondary()}`}>
                  Nenhum lead encontrado para o período selecionado.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  )
}