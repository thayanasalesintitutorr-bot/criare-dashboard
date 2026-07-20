'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  MessageSquare,
  CalendarCheck,
  Timer,
  Star,
  AlertTriangle,
  X,
  Sparkles,
  TrendingDown,
} from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { KpiCard } from '@/components/dashboard/kpi-card'

type CampanhaItem = {
  campanha: string
  leads: number
  agendados: number
  vendidos: number
}

type NomeQtd = { [key: string]: string | number }

type ConversaItem = {
  lead_id: string
  contact_id: string
  name_lead: string | null
  campanha: string | null
  anuncio: string | null
  queixas: string | null
  objecao: string | null
  status: string | null
  resultado_conversa: string | null
  agendou: boolean | null
  vendeu: boolean | null
  msgs: number | null
  ultima_atividade: string | null
  aguardando: boolean
  nota: number | null
  resumo_qualidade: string | null
}

type TranscriptMsg = { quem: string; conteudo: string; criado_em: string }

type ApiResponse = {
  ok: boolean
  kpis?: {
    funil: {
      total_leads: number
      agendados: number
      vendidos: number
      taxa_agendamento: number
      taxa_venda: number
      por_campanha: CampanhaItem[]
      por_anuncio: NomeQtd[]
      por_canal: NomeQtd[]
      por_queixa: NomeQtd[]
    }
    operacao: {
      total_conversas: number
      msgs_por_conversa: number | null
      tempo_resposta_medio_seg: number | null
      aguardando_resposta: number
      evolucao_diaria: { dia: string; leads: number }[]
    }
    objecoes: {
      ranking: { objecao: string; ocorrencias: number }[]
      resultados: { resultado_conversa: string; ocorrencias: number }[]
    }
    qualidade: {
      avaliadas: number
      nota_media: number | null
      convertidas_pct: number
      criterios_media: Record<string, number>
      piores: {
        contact_id: number
        name_lead: string | null
        nota: number
        resumo: string | null
        pontos_melhoria: string | null
      }[]
    }
  }
  conversas?: ConversaItem[]
}

const PERIODOS = [
  { label: '7 dias', dias: 7 },
  { label: '30 dias', dias: 30 },
  { label: '90 dias', dias: 90 },
]

function fmtTempo(seg: number | null) {
  if (seg === null || seg === undefined) return '—'
  if (seg < 60) return `${Math.round(seg)}s`
  return `${Math.round(seg / 60)}min`
}

function fmtData(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

type Insight = { tipo: 'positivo' | 'atencao'; texto: string }

// Insights automáticos derivados dos mesmos KPIs já carregados — sem chamada extra ao banco.
// Cada regra só entra na lista quando há dado suficiente para sustentar a leitura.
function construirInsights(kpis: NonNullable<ApiResponse['kpis']> | undefined): Insight[] {
  if (!kpis) return []

  const insights: Insight[] = []
  const { operacao, funil, qualidade } = kpis

  if (operacao.total_conversas > 0) {
    const respondidas = operacao.total_conversas - operacao.aguardando_resposta
    const coberturaPct = Math.round((respondidas / operacao.total_conversas) * 100)

    if (operacao.aguardando_resposta === 0) {
      insights.push({
        tipo: 'positivo',
        texto: `Sara respondeu 100% das ${operacao.total_conversas} conversas do período — nenhuma pendência há mais de 48h.`,
      })
    } else {
      insights.push({
        tipo: 'atencao',
        texto: `${operacao.aguardando_resposta} conversa(s) aguardando resposta há mais de 48h (cobertura de ${coberturaPct}%).`,
      })
    }
  }

  if (operacao.tempo_resposta_medio_seg !== null) {
    if (operacao.tempo_resposta_medio_seg <= 30) {
      insights.push({
        tipo: 'positivo',
        texto: `Tempo médio de resposta de ${fmtTempo(operacao.tempo_resposta_medio_seg)} — praticamente instantâneo.`,
      })
    } else if (operacao.tempo_resposta_medio_seg > 300) {
      insights.push({
        tipo: 'atencao',
        texto: `Tempo médio de resposta em ${fmtTempo(operacao.tempo_resposta_medio_seg)} — vale revisar o fluxo de atendimento.`,
      })
    }
  }

  const topCampanha = funil.por_campanha?.[0]
  if (topCampanha?.campanha) {
    insights.push({
      tipo: 'positivo',
      texto: `"${topCampanha.campanha}" foi a campanha que mais gerou conversas (${topCampanha.leads}) no período.`,
    })
  }

  if (funil.total_leads > 0 && funil.agendados === 0 && funil.vendidos === 0) {
    insights.push({
      tipo: 'atencao',
      texto: `${funil.total_leads} conversa(s) no período sem agendamento ou venda registrado — confirme se o resultado está sendo marcado no funil.`,
    })
  }

  if (qualidade.avaliadas === 0) {
    insights.push({
      tipo: 'atencao',
      texto: 'Nenhuma conversa foi avaliada ainda — ative a rotina de análise de qualidade para acompanhar a nota da Sara.',
    })
  } else if (qualidade.nota_media !== null) {
    insights.push(
      qualidade.nota_media >= 4
        ? {
            tipo: 'positivo',
            texto: `Nota média de qualidade em ${qualidade.nota_media}/5 nas ${qualidade.avaliadas} conversas avaliadas.`,
          }
        : {
            tipo: 'atencao',
            texto: `Nota média de qualidade em ${qualidade.nota_media}/5 — abaixo do ideal, veja os pontos de melhoria.`,
          }
    )
  }

  return insights
}

function InsightTile({ insight }: { insight: Insight }) {
  const positivo = insight.tipo === 'positivo'

  return (
    <div
      className={`flex items-start gap-2.5 rounded-[16px] border p-3 ${
        positivo
          ? 'border-[var(--success)]/25 bg-[var(--success)]/10'
          : 'border-[var(--warning)]/25 bg-[var(--warning)]/10'
      }`}
    >
      <span className={`mt-0.5 shrink-0 ${positivo ? 'text-[var(--success)]' : 'text-[var(--warning)]'}`}>
        {positivo ? <Sparkles size={15} /> : <TrendingDown size={15} />}
      </span>

      <p className="text-[13px] font-semibold leading-snug text-[var(--foreground)]">{insight.texto}</p>
    </div>
  )
}

export default function ConversasPage() {
  const [dias, setDias] = useState(30)
  const [dados, setDados] = useState<ApiResponse | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [filtroLista, setFiltroLista] = useState<'todas' | 'aguardando' | 'agendou' | 'objecao'>('todas')
  const [transcript, setTranscript] = useState<TranscriptMsg[] | null>(null)
  const [conversaAberta, setConversaAberta] = useState<ConversaItem | null>(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const inicio = new Date(Date.now() - dias * 24 * 60 * 60 * 1000)
      const res = await fetch(`/api/conversas?inicio=${inicio.toISOString()}`)
      const json: ApiResponse = await res.json()
      if (json.ok) setDados(json)
    } finally {
      setCarregando(false)
    }
  }, [dias])

  useEffect(() => {
    carregar()
  }, [carregar])

  const abrirTranscript = async (c: ConversaItem) => {
    setConversaAberta(c)
    setTranscript(null)
    const res = await fetch(`/api/conversas?contact_id=${c.contact_id}`)
    const json = await res.json()
    if (json.ok) setTranscript(json.transcript)
  }

  const kpis = dados?.kpis
  const conversas = (dados?.conversas ?? []).filter((c) => {
    if (filtroLista === 'aguardando') return c.aguardando
    if (filtroLista === 'agendou') return c.agendou === true
    if (filtroLista === 'objecao') return !!c.objecao
    return true
  })

  const campanhaChart = (kpis?.funil.por_campanha ?? []).map((c) => ({
    nome: c.campanha.length > 22 ? c.campanha.slice(0, 22) + '…' : c.campanha,
    leads: c.leads,
    agendados: c.agendados,
  }))

  const criterios = Object.entries(kpis?.qualidade.criterios_media ?? {})
  const insights = construirInsights(kpis)

  return (
    <AppShell title="Conversas — Análise Crítica">
      <div className="mb-6 flex items-center gap-2">
        {PERIODOS.map((p) => (
          <button
            key={p.dias}
            onClick={() => setDias(p.dias)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              dias === p.dias
                ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--background)]'
                : 'border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--accent)]'
            }`}
          >
            {p.label}
          </button>
        ))}
        {carregando && (
          <span className="ml-2 text-sm text-[var(--muted-foreground)]">Carregando…</span>
        )}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          title="Leads no período"
          value={kpis?.funil.total_leads ?? '—'}
          subtitle={`${kpis?.operacao.total_conversas ?? 0} conversas ativas`}
          icon={MessageSquare}
        />
        <KpiCard
          title="Taxa de agendamento"
          value={`${kpis?.funil.taxa_agendamento ?? 0}%`}
          subtitle={`${kpis?.funil.agendados ?? 0} agendados / ${kpis?.funil.vendidos ?? 0} vendas`}
          icon={CalendarCheck}
          accent="green"
        />
        <KpiCard
          title="Tempo de resposta"
          value={fmtTempo(kpis?.operacao.tempo_resposta_medio_seg ?? null)}
          subtitle={`${kpis?.operacao.msgs_por_conversa ?? '—'} msgs por conversa`}
          icon={Timer}
          accent="purple"
        />
        <KpiCard
          title="Nota média da IA"
          value={kpis?.qualidade.nota_media ?? '—'}
          subtitle={`${kpis?.qualidade.avaliadas ?? 0} conversas avaliadas`}
          icon={Star}
        />
        <KpiCard
          title="Aguardando resposta"
          value={kpis?.operacao.aguardando_resposta ?? '—'}
          subtitle="pacientes sem retorno da Sara"
          icon={AlertTriangle}
          accent="red"
        />
      </div>

      {insights.length > 0 && (
        <section className="dashboard-section mb-6">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles size={18} className="text-[var(--accent)]" />
            <h2 className="section-title">Insights automáticos</h2>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {insights.map((insight, i) => (
              <InsightTile key={i} insight={insight} />
            ))}
          </div>
        </section>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="dashboard-section">
          <h2 className="section-title mb-4">Leads e agendamentos por campanha</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={campanhaChart} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="nome" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} interval={0} angle={-18} height={60} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                  }}
                />
                <Bar dataKey="leads" name="Leads" fill="var(--accent)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="agendados" name="Agendados" fill="var(--success)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="dashboard-section">
          <h2 className="section-title mb-4">Evolução diária de leads</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kpis?.operacao.evolucao_diaria ?? []} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="dia"
                  tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                  tickFormatter={(d: string) => d.slice(5).split('-').reverse().join('/')}
                />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                  }}
                />
                <Bar dataKey="leads" name="Leads" fill="var(--accent)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="dashboard-section">
          <h2 className="section-title mb-4">Objeções mais comuns</h2>
          {(kpis?.objecoes.ranking ?? []).filter((o) => o.objecao).length === 0 ? (
            <p className="metric-helper">Sem objeções registradas no período.</p>
          ) : (
            <ul className="space-y-2">
              {(kpis?.objecoes.ranking ?? [])
                .filter((o) => o.objecao)
                .map((o) => (
                  <li key={o.objecao} className="subtle-card flex items-center justify-between">
                    <span className="text-sm">{o.objecao}</span>
                    <span className="metric-value text-xl">{o.ocorrencias}</span>
                  </li>
                ))}
            </ul>
          )}
        </section>

        <section className="dashboard-section">
          <h2 className="section-title mb-4">Queixas dos pacientes</h2>
          {(kpis?.funil.por_queixa ?? []).filter((q) => q.queixas).length === 0 ? (
            <p className="metric-helper">Sem queixas registradas no período.</p>
          ) : (
            <ul className="space-y-2">
              {(kpis?.funil.por_queixa ?? [])
                .filter((q) => q.queixas)
                .map((q) => (
                  <li key={String(q.queixas)} className="subtle-card flex items-center justify-between">
                    <span className="text-sm">{String(q.queixas)}</span>
                    <span className="metric-helper">
                      {String(q.leads)} leads · {String(q.agendados)} agendados
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </section>

        <section className="dashboard-section">
          <h2 className="section-title mb-4">Critérios de qualidade (média)</h2>
          {criterios.length === 0 ? (
            <p className="metric-helper">
              Nenhuma avaliação registrada ainda. Ative o fluxo diário de análise crítica para
              preencher esta seção.
            </p>
          ) : (
            <ul className="space-y-3">
              {criterios.map(([nome, media]) => (
                <li key={nome}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="capitalize">{nome.replaceAll('_', ' ')}</span>
                    <span className="font-semibold">{media}</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="h-full rounded-full bg-[var(--accent)]"
                      style={{ width: `${Math.min(100, (Number(media) / 10) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {(kpis?.qualidade.piores ?? []).length > 0 && (
        <section className="dashboard-section mb-6">
          <h2 className="section-title mb-4">Conversas com pior avaliação</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {(kpis?.qualidade.piores ?? []).map((p) => (
              <div key={p.contact_id} className="subtle-card">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-semibold">{p.name_lead ?? `Contato ${p.contact_id}`}</span>
                  <span className="metric-value text-xl text-[var(--danger)]">{p.nota}</span>
                </div>
                {p.resumo && <p className="metric-helper mb-1">{p.resumo}</p>}
                {p.pontos_melhoria && (
                  <p className="text-xs text-[var(--muted-foreground)]">Melhorar: {p.pontos_melhoria}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="dashboard-section">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="section-title">Conversas ({conversas.length})</h2>
          <div className="flex gap-2">
            {(
              [
                ['todas', 'Todas'],
                ['aguardando', 'Aguardando resposta'],
                ['agendou', 'Agendaram'],
                ['objecao', 'Com objeção'],
              ] as const
            ).map(([valor, label]) => (
              <button
                key={valor}
                onClick={() => setFiltroLista(valor)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  filtroLista === valor
                    ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--background)]'
                    : 'border-[var(--border)] text-[var(--muted-foreground)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-xs uppercase text-[var(--muted-foreground)]">
                <th className="py-2 pr-4">Lead</th>
                <th className="py-2 pr-4">Campanha</th>
                <th className="py-2 pr-4">Queixa</th>
                <th className="py-2 pr-4">Msgs</th>
                <th className="py-2 pr-4">Última atividade</th>
                <th className="py-2 pr-4">Nota</th>
                <th className="py-2 pr-4">Situação</th>
              </tr>
            </thead>
            <tbody>
              {conversas.map((c) => (
                <tr
                  key={c.lead_id}
                  onClick={() => abrirTranscript(c)}
                  className="cursor-pointer border-b border-[var(--border)] transition hover:bg-[var(--metric-card)]"
                >
                  <td className="py-2.5 pr-4 font-medium">{c.name_lead ?? c.lead_id}</td>
                  <td className="py-2.5 pr-4 text-xs text-[var(--muted-foreground)]">{c.campanha ?? '—'}</td>
                  <td className="py-2.5 pr-4">{c.queixas ?? '—'}</td>
                  <td className="py-2.5 pr-4">{c.msgs ?? '—'}</td>
                  <td className="py-2.5 pr-4">{fmtData(c.ultima_atividade)}</td>
                  <td className="py-2.5 pr-4">{c.nota ?? '—'}</td>
                  <td className="py-2.5 pr-4">
                    {c.vendeu ? (
                      <span className="rounded-full bg-[var(--success)]/15 px-2 py-0.5 text-xs text-[var(--success)]">Vendeu</span>
                    ) : c.agendou ? (
                      <span className="rounded-full bg-[var(--success)]/15 px-2 py-0.5 text-xs text-[var(--success)]">Agendou</span>
                    ) : c.aguardando ? (
                      <span className="rounded-full bg-[var(--danger)]/15 px-2 py-0.5 text-xs text-[var(--danger)]">Aguardando</span>
                    ) : (
                      <span className="rounded-full bg-[var(--metric-card)] px-2 py-0.5 text-xs text-[var(--muted-foreground)]">
                        {c.objecao ? 'Objeção' : c.status ?? 'Em andamento'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {conversaAberta && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setConversaAberta(null)}
        >
          <div
            className="dashboard-section flex max-h-[85vh] w-full max-w-2xl flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="section-title">{conversaAberta.name_lead ?? conversaAberta.lead_id}</h3>
                <p className="metric-helper">
                  {conversaAberta.campanha ?? 'sem campanha'} · {conversaAberta.msgs ?? 0} mensagens
                </p>
              </div>
              <button
                onClick={() => setConversaAberta(null)}
                className="rounded-full p-2 text-[var(--muted-foreground)] hover:bg-[var(--metric-card)]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto pr-1">
              {transcript === null && <p className="metric-helper">Carregando conversa…</p>}
              {transcript?.length === 0 && <p className="metric-helper">Sem mensagens registradas.</p>}
              {transcript?.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                    m.quem === 'sara'
                      ? 'ml-auto bg-[var(--accent)]/15'
                      : 'bg-[var(--metric-card)]'
                  }`}
                >
                  <p className="mb-0.5 text-[10px] font-semibold uppercase text-[var(--muted-foreground)]">
                    {m.quem === 'sara' ? 'Sara' : 'Paciente'} · {fmtData(m.criado_em)}
                  </p>
                  <p className="whitespace-pre-wrap">{m.conteudo}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
