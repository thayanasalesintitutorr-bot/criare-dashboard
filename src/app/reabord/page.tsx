'use client'

import { useEffect, useMemo, useState } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { useFilters } from '@/store/use-filters'
import {
  Clock3,
  CalendarCheck2,
  AlertTriangle,
  Zap,
  Search,
} from 'lucide-react'

type Lead = {
  id: number | string
  name?: string
  created_at?: string
  closest_task_at?: string | null
  status_id?: number
  status_name?: string
  price?: number
  tag?: string | string[] | null
}

const REABORD_STAGES = [
  { titulo: 'Contato', statusNames: ['CONTATO'], cor: 'bg-fuchsia-400' },
  { titulo: 'Oferta', statusNames: ['OFERTA'], cor: 'bg-rose-400' },
  { titulo: 'Agendado', statusNames: ['AGENDADO'], cor: 'bg-amber-400' },
  { titulo: 'Fechado (Ganho)', statusNames: ['FECHADO (GANHO)'], cor: 'bg-emerald-400' },
  { titulo: 'Fechado (Perdido)', statusNames: ['FECHADO (PERDIDO)'], cor: 'bg-slate-400' },
]

function formatDate(date?: string) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('pt-BR')
}

function formatMoney(value?: number) {
  return (Number(value) || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function getTags(tag: Lead['tag']) {
  if (!tag) return []
  if (Array.isArray(tag)) return tag.filter(Boolean)
  return String(tag)
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}

function tagClass(tag: string) {
  const t = tag.toUpperCase()

  if (t.includes('REABORD')) return 'border-purple-300 bg-purple-100 text-purple-700'
  if (t.includes('EM CONVERSA')) return 'border-emerald-300 bg-emerald-100 text-emerald-700'
  if (t.includes('SEM CONVERSA')) return 'border-rose-300 bg-rose-100 text-rose-700'
  if (t.includes('DR BRENO')) return 'border-slate-300 bg-slate-100 text-slate-600'
  if (t.includes('NOVO')) return 'border-sky-300 bg-sky-100 text-sky-700'

  return 'border-slate-300 bg-slate-100 text-slate-600'
}

function normalizeText(value: unknown) {
  return String(value || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toUpperCase()
}

export default function ReabordPage() {
  const { periodo, tipoData, segmento, dataInicio, dataFim } = useFilters()

  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [etapa, setEtapa] = useState('Todas etapas')

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)

        let url = `/api/test?periodo=${periodo}&tipo=${tipoData}&segmento=${segmento}`

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

        setLeads(json?.reabordLeads || json?.leadsReabord || [])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [periodo, tipoData, segmento, dataInicio, dataFim])

  const leadsFiltrados = useMemo(() => {
    return leads.filter((lead) => {
      const nomeMatch = String(lead.name || '')
        .toLowerCase()
        .includes(busca.toLowerCase())

      const etapaMatch =
        etapa === 'Todas etapas' ||
        REABORD_STAGES.find((s) => s.titulo === etapa)?.statusNames.some(
  (status) => normalizeText(status) === normalizeText(lead.status_id)
)

      return nomeMatch && etapaMatch
    })
  }, [leads, busca, etapa])

  const totalLeads = leadsFiltrados.length
  const comTarefa = leadsFiltrados.filter((l) => Boolean(l.closest_task_at)).length
  const tarefaAtrasada = leadsFiltrados.filter((l) => {
    if (!l.closest_task_at) return false
    return new Date(l.closest_task_at) < new Date()
  }).length

  const novosHoje = leadsFiltrados.filter((l) => {
    if (!l.created_at) return false
    return new Date(l.created_at).toLocaleDateString('pt-BR') === new Date().toLocaleDateString('pt-BR')
  }).length

  return (
    <AppShell title="Reabord">
      <div className="space-y-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={Clock3} title="Leads totais" value={totalLeads} />
          <MetricCard icon={CalendarCheck2} title="Com tarefa agendada" value={comTarefa} />
          <MetricCard icon={AlertTriangle} title="Tarefa atrasada" value={tarefaAtrasada} />
          <MetricCard icon={Zap} title="Novos hoje" value={novosHoje} />
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_240px]">
          <div className="flex items-center gap-3 rounded-2xl bg-[var(--card)] px-5 py-4 shadow-sm">
            <Search size={18} className="text-[var(--muted-foreground)]" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome..."
              className="w-full bg-transparent outline-none"
            />
          </div>

          <select
            value={etapa}
            onChange={(e) => setEtapa(e.target.value)}
            className="rounded-2xl bg-[var(--card)] px-5 py-4 outline-none shadow-sm"
          >
            <option>Todas etapas</option>
            {REABORD_STAGES.map((stage) => (
              <option key={stage.titulo}>{stage.titulo}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto pb-4">
          <div className="flex min-w-max gap-5">
            {REABORD_STAGES.map((stage) => {
              const stageLeads = leadsFiltrados.filter((lead) =>
  stage.statusNames.some(
    (status) => normalizeText(status) === normalizeText(lead.status_id)
  )
)

              const valorTotal = stageLeads.reduce(
                (acc, lead) => acc + (Number(lead.price) || 0),
                0
              )

              return (
                <div
                  key={stage.titulo}
                  className="w-[340px] shrink-0 rounded-[28px] bg-[var(--card)] p-4 shadow-[0_16px_45px_rgba(15,23,42,0.08)] dark:bg-[#112742]"
                >
                  <div className="sticky top-0 z-10 mb-4 bg-[var(--card)] pb-3 dark:bg-[#112742]">
                    <div className="text-center">
                      <h3 className="text-sm font-black uppercase tracking-[0.16em]">
                        {stage.titulo}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                        {stageLeads.length} leads: {formatMoney(valorTotal)}
                      </p>
                    </div>

                    <div className={`mt-3 h-1 rounded-full ${stage.cor}`} />
                  </div>

                  <div className="max-h-[690px] space-y-3 overflow-y-auto pr-1">
                    {loading && (
                      <div className="rounded-2xl border border-dashed border-black/10 p-6 text-center text-sm text-[var(--muted-foreground)]">
                        Carregando...
                      </div>
                    )}

                    {!loading && stageLeads.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-black/10 p-6 text-center text-sm text-[var(--muted-foreground)]">
                        Nenhum lead
                      </div>
                    )}

                    {stageLeads.map((lead) => (
                      <LeadCard key={lead.id} lead={lead} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </AppShell>
  )
}

function LeadCard({ lead }: { lead: Lead }) {
  const tags = getTags(lead.tag)
  const hasTask = Boolean(lead.closest_task_at)

  return (
    <div className="rounded-[16px] border border-black/10 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-[#0B1D31]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm font-semibold text-[var(--foreground)]">
            {lead.name || 'Sem nome'}
          </p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            {formatDate(lead.created_at)}
          </p>
        </div>

        <span className="shrink-0 text-xs text-[var(--muted-foreground)]">
          {formatMoney(lead.price)}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${tagClass(tag)}`}
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-3 text-right text-xs font-semibold">
        <span className={hasTask ? 'text-emerald-500' : 'text-amber-500'}>
          {hasTask ? 'Com tarefa' : 'Sem tarefas'}
        </span>
      </div>
    </div>
  )
}

function MetricCard({ icon: Icon, title, value }: any) {
  return (
    <div className="rounded-[28px] bg-[var(--card)] p-5 shadow-[0_16px_45px_rgba(15,23,42,0.08)] dark:bg-[#112742]">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-2xl bg-[#F3E7C7]/70 p-3 dark:bg-[#F3E7C7]/10">
          <Icon size={18} className="text-[#D7B46A]" />
        </div>
        <p className="text-sm text-[var(--muted-foreground)]">{title}</p>
      </div>

      <h3 className="text-5xl font-black tracking-[-0.05em]">
        {value}
      </h3>
    </div>
  )
}