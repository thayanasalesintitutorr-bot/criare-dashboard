'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  Users,
  CalendarClock,
  AlertTriangle,
  Clock,
  TrendingUp,
  Lock,
  Settings2,
  UserPlus,
  X,
  Plus,
  Trash2,
  Check,
  Loader2,
  Pencil,
  ClipboardCheck,
  CheckCircle2,
} from 'lucide-react'
import { useSetPageHeader } from '@/store/use-page-header'

// ---------- Tipos ----------

type Protocolo = {
  id: string
  nome: string
  produtos_kommo: string[]
  duracao_semanas: number
  etapas: string[]
  cor: string | null
  ativo: boolean
}

type ChecklistItem = { item: string; status: 'pendente' | 'concluido' }
type Observacao = { texto: string; criado_em: string }

type PacienteProtocolo = {
  id: string
  nome_paciente: string
  protocolo_id: string | null
  protocolo: { id: string; nome: string; duracao_semanas: number; cor: string | null; etapas: string[] } | null
  medico: string | null
  kommo_lead_id: number | null
  data_inicio: string | null
  semana_atual: number
  etapa_atual: string | null
  status: string
  adesao_percent: number | null
  ultimo_contato: string | null
  proxima_acao: string | null
  proxima_acao_responsavel: string | null
  proxima_acao_prazo: string | null
  proxima_acao_prioridade: string | null
  saldo_contratado: number | null
  saldo_realizado: number | null
  checklist: ChecklistItem[]
  observacoes: Observacao[]
  ativo: boolean
  atualizado_em: string
}

type VendaPendente = {
  kommoLeadId: number
  nomePaciente: string
  medico: string | null
  produto: string | null
  valor: number | string | null
  fechadoEm: string | null
  protocoloId: string | null
  protocoloNome: string | null
}

const ETAPAS_PADRAO = ['Onboarding', 'Em tratamento', 'Acompanhamento', 'Finalizado']

const STATUS_OPCOES: { value: string; label: string }[] = [
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'no_prazo', label: 'No prazo' },
  { value: 'atrasado', label: 'Atrasado' },
  { value: 'critico', label: 'Crítico' },
  { value: 'finalizado', label: 'Finalizado' },
]

const PRIORIDADE_OPCOES = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'Média' },
  { value: 'alta', label: 'Alta' },
]

function statusInfo(status: string) {
  switch (status) {
    case 'no_prazo':
      return { label: 'No prazo', className: 'bg-[var(--success)]/10 text-[var(--success)]' }
    case 'atrasado':
      return { label: 'Atrasado', className: 'bg-[var(--warning)]/10 text-[var(--warning)]' }
    case 'critico':
      return { label: 'Crítico', className: 'bg-[var(--danger)]/10 text-[var(--danger)]' }
    case 'finalizado':
      return { label: 'Finalizado', className: 'bg-[var(--muted-foreground)]/10 text-[var(--muted-foreground)]' }
    default:
      return { label: 'Onboarding', className: 'bg-[var(--accent)]/10 text-[var(--accent)]' }
  }
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  const data = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(data.getTime())) return '—'
  return data.toLocaleDateString('pt-BR')
}

function diasDesde(iso: string | null) {
  if (!iso) return null
  const data = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(data.getTime())) return null
  return Math.floor((Date.now() - data.getTime()) / (1000 * 60 * 60 * 24))
}

function hojeISO() {
  return new Date().toISOString().slice(0, 10)
}

function formatMoney(v: number | string | null) {
  const n = Number(v || 0)
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function etapaEfetiva(paciente: PacienteProtocolo, etapas: string[]) {
  if (paciente.etapa_atual && etapas.includes(paciente.etapa_atual)) return paciente.etapa_atual
  return etapas[0]
}

const inputClass =
  'w-full rounded-xl border border-[color:var(--border)] bg-[var(--card)] px-3 py-2 text-xs font-bold text-[var(--foreground)] outline-none focus:border-[var(--accent)]'

// ---------- Página ----------

export default function ProtocolosPage() {
  useSetPageHeader('Protocolos')

  const [gate, setGate] = useState<'checking' | 'locked' | 'unlocked'>('checking')
  const [senhaGate, setSenhaGate] = useState('')
  const [gateErro, setGateErro] = useState('')
  const [gateCarregando, setGateCarregando] = useState(false)

  const [protocolos, setProtocolos] = useState<Protocolo[]>([])
  const [pacientes, setPacientes] = useState<PacienteProtocolo[]>([])
  const [pacientesGlobal, setPacientesGlobal] = useState<PacienteProtocolo[]>([])
  const [vendasPendentes, setVendasPendentes] = useState<VendaPendente[]>([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  const [protocoloSelecionadoId, setProtocoloSelecionadoId] = useState('')
  const [filtroMedico, setFiltroMedico] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroResponsavel, setFiltroResponsavel] = useState('')

  const [pacienteSelecionado, setPacienteSelecionado] = useState<PacienteProtocolo | null>(null)
  const [showGerenciarProtocolos, setShowGerenciarProtocolos] = useState(false)
  const [showNovoPaciente, setShowNovoPaciente] = useState(false)

  const checarGate = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/protocolos-gate')
      const json = await res.json().catch(() => ({}))
      setGate(json.unlocked ? 'unlocked' : 'locked')
    } catch {
      setGate('locked')
    }
  }, [])

  useEffect(() => {
    checarGate()
  }, [checarGate])

  async function enviarSenhaGate() {
    setGateErro('')
    setGateCarregando(true)
    try {
      const res = await fetch('/api/auth/protocolos-gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: senhaGate }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setGateErro(json.error || 'Senha incorreta')
        setGateCarregando(false)
        return
      }
      setSenhaGate('')
      setGate('unlocked')
      setGateCarregando(false)
    } catch {
      setGateErro('Não foi possível verificar agora. Tente novamente.')
      setGateCarregando(false)
    }
  }

  const fetchProtocolos = useCallback(async () => {
    const res = await fetch('/api/protocolos')
    const json = await res.json().catch(() => ({}))
    if (json.ok) setProtocolos(json.protocolos)
  }, [])

  const fetchPacientes = useCallback(async () => {
    if (!protocoloSelecionadoId) {
      setPacientes([])
      return
    }
    setCarregando(true)
    setErro('')
    try {
      const params = new URLSearchParams()
      params.set('protocoloId', protocoloSelecionadoId)
      if (filtroMedico) params.set('medico', filtroMedico)
      if (filtroStatus) params.set('status', filtroStatus)
      if (filtroResponsavel) params.set('responsavel', filtroResponsavel)

      const res = await fetch(`/api/pacientes-protocolo?${params.toString()}`)
      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        if (json.locked) {
          setGate('locked')
          return
        }
        setErro(json.error || 'Erro ao carregar pacientes')
        return
      }

      setPacientes(json.pacientes)
    } catch {
      setErro('Não foi possível carregar os pacientes agora.')
    } finally {
      setCarregando(false)
    }
  }, [protocoloSelecionadoId, filtroMedico, filtroStatus, filtroResponsavel])

  const fetchPacientesGlobal = useCallback(async () => {
    const res = await fetch('/api/pacientes-protocolo')
    const json = await res.json().catch(() => ({}))
    if (json.ok) setPacientesGlobal(json.pacientes)
  }, [])

  const fetchVendasPendentes = useCallback(async () => {
    const res = await fetch('/api/pacientes-protocolo/novas-vendas')
    const json = await res.json().catch(() => ({}))
    if (json.ok) setVendasPendentes(json.vendas)
  }, [])

  useEffect(() => {
    if (gate !== 'unlocked') return
    fetchProtocolos()
    fetchPacientesGlobal()
    fetchVendasPendentes()
  }, [gate, fetchProtocolos, fetchPacientesGlobal, fetchVendasPendentes])

  useEffect(() => {
    if (gate !== 'unlocked') return
    fetchPacientes()
  }, [gate, fetchPacientes])

  const protocolosAtivos = useMemo(() => protocolos.filter((p) => p.ativo), [protocolos])

  useEffect(() => {
    if (protocoloSelecionadoId) return
    if (protocolosAtivos.length > 0) setProtocoloSelecionadoId(protocolosAtivos[0].id)
  }, [protocolosAtivos, protocoloSelecionadoId])

  const protocoloSelecionado = useMemo(
    () => protocolos.find((p) => p.id === protocoloSelecionadoId) || null,
    [protocolos, protocoloSelecionadoId]
  )

  const ativosPorProtocolo = useMemo(() => {
    const contagem = new Map<string, number>()
    for (const p of pacientesGlobal) {
      if (!p.protocolo_id || p.status === 'finalizado') continue
      contagem.set(p.protocolo_id, (contagem.get(p.protocolo_id) || 0) + 1)
    }
    return contagem
  }, [pacientesGlobal])

  const medicosDisponiveis = useMemo(
    () => Array.from(new Set(pacientes.map((p) => p.medico).filter(Boolean))) as string[],
    [pacientes]
  )
  const responsaveisDisponiveis = useMemo(
    () =>
      Array.from(new Set(pacientes.map((p) => p.proxima_acao_responsavel).filter(Boolean))) as string[],
    [pacientes]
  )

  const kpis = useMemo(() => {
    const hoje = hojeISO()
    const vendidosTotal = pacientesGlobal.filter((p) => p.ativo)
    const encerrados = vendidosTotal.filter((p) => p.status === 'finalizado')
    const ativos = vendidosTotal.filter((p) => p.status !== 'finalizado')
    const acaoHoje = ativos.filter((p) => p.proxima_acao_prazo === hoje).length
    const emAtencao = ativos.filter((p) => p.status === 'atrasado' || p.status === 'critico').length
    const semContato = ativos.filter((p) => {
      const dias = diasDesde(p.ultimo_contato)
      return dias === null || dias > 7
    }).length

    const progressos = ativos.map((p) =>
      p.adesao_percent != null
        ? p.adesao_percent
        : p.protocolo?.duracao_semanas
          ? Math.min(100, Math.round((p.semana_atual / p.protocolo.duracao_semanas) * 100))
          : 0
    )
    const adesaoMedia = progressos.length
      ? Math.round(progressos.reduce((a, b) => a + b, 0) / progressos.length)
      : 0

    return {
      vendidos: vendidosTotal.length,
      ativos: ativos.length,
      encerrados: encerrados.length,
      acaoHoje,
      emAtencao,
      semContato,
      adesaoMedia,
    }
  }, [pacientesGlobal])

  const vendasPendentesDoProtocolo = useMemo(
    () => vendasPendentes.filter((v) => v.protocoloId === protocoloSelecionadoId),
    [vendasPendentes, protocoloSelecionadoId]
  )

  async function criarAcompanhamentoDaVenda(venda: VendaPendente) {
    const res = await fetch('/api/pacientes-protocolo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nomePaciente: venda.nomePaciente,
        protocoloId: venda.protocoloId,
        medico: venda.medico,
        kommoLeadId: venda.kommoLeadId,
      }),
    })
    const json = await res.json().catch(() => ({}))
    if (json.ok) {
      fetchPacientes()
      fetchPacientesGlobal()
      fetchVendasPendentes()
    }
    return json
  }

  async function atualizarPaciente(id: string, updates: Record<string, unknown>) {
    const res = await fetch(`/api/pacientes-protocolo/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    const json = await res.json().catch(() => ({}))
    if (json.ok) {
      setPacientes((prev) => prev.map((p) => (p.id === id ? json.paciente : p)))
      setPacientesGlobal((prev) => prev.map((p) => (p.id === id ? json.paciente : p)))
      setPacienteSelecionado((prev) => (prev && prev.id === id ? json.paciente : prev))
    }
    return json
  }

  if (gate === 'checking') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-[var(--muted-foreground)]">
        <Loader2 className="animate-spin" size={22} />
      </div>
    )
  }

  if (gate === 'locked') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-sm rounded-[18px] border border-[color:var(--border)] bg-[var(--card)] p-7 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[14px] bg-[var(--accent)]/10 text-[var(--accent)]">
            <Lock size={20} />
          </div>
          <h2 className="text-[16px] font-black text-[var(--foreground)]">Área protegida</h2>
          <p className="mt-1 text-xs font-semibold text-[var(--muted-foreground)]">
            Digite a senha de acesso aos dados de pacientes.
          </p>

          <input
            type="password"
            value={senhaGate}
            onChange={(e) => setSenhaGate(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && enviarSenhaGate()}
            placeholder="Senha"
            autoFocus
            className="mt-5 w-full rounded-xl border border-[color:var(--border)] bg-[var(--metric-card)] px-3 py-2.5 text-center text-sm font-bold text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
          />

          {gateErro && <p className="mt-2 text-xs font-bold text-[var(--danger)]">{gateErro}</p>}

          <button
            onClick={enviarSenhaGate}
            disabled={gateCarregando || !senhaGate}
            className="mt-4 w-full rounded-xl bg-[var(--accent)] px-4 py-2.5 text-xs font-black text-white transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            {gateCarregando ? 'Verificando...' : 'Entrar'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-black text-[var(--foreground)]">Acompanhamento de protocolos</h1>
          <p className="text-xs font-semibold text-[var(--muted-foreground)]">
            Pacientes em tratamento com Dr. Rodolpho, Dr. Breno e Dra. Cláudia
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowGerenciarProtocolos(true)}
            className="flex items-center gap-1.5 rounded-xl border border-[color:var(--border)] bg-[var(--card)] px-3.5 py-2 text-xs font-black text-[var(--foreground)] transition hover:bg-[var(--metric-card)]"
          >
            <Settings2 size={14} />
            Gerenciar protocolos
          </button>
          <button
            onClick={() => setShowNovoPaciente(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-3.5 py-2 text-xs font-black text-white transition hover:brightness-110"
          >
            <UserPlus size={14} />
            Novo paciente
          </button>
        </div>
      </div>

      <div className="grid gap-3 @md:grid-cols-2 @lg:grid-cols-4">
        <KpiMini icon={ClipboardCheck} label="Protocolos vendidos" value={kpis.vendidos} accent="blue" />
        <KpiMini icon={Users} label="Ainda ativos" value={kpis.ativos} accent="green" />
        <KpiMini icon={CheckCircle2} label="Encerrados" value={kpis.encerrados} accent="purple" />
        <KpiMini icon={CalendarClock} label="Ação prevista hoje" value={kpis.acaoHoje} accent="purple" />
        <KpiMini icon={AlertTriangle} label="Em atenção" value={kpis.emAtencao} accent="red" />
        <KpiMini icon={Clock} label="Sem contato 7+ dias" value={kpis.semContato} accent="yellow" />
        <KpiMini icon={TrendingUp} label="Adesão média" value={`${kpis.adesaoMedia}%`} accent="green" />
      </div>

      <div className="dashboard-section">
        {protocolosAtivos.length === 0 ? (
          <p className="py-6 text-center text-xs font-semibold text-[var(--muted-foreground)]">
            Nenhum protocolo cadastrado ainda. Use &ldquo;Gerenciar protocolos&rdquo; para criar o primeiro.
          </p>
        ) : (
          <>
            <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
              {protocolosAtivos.map((p) => {
                const ativos = ativosPorProtocolo.get(p.id) || 0
                const selecionado = p.id === protocoloSelecionadoId
                return (
                  <button
                    key={p.id}
                    onClick={() => setProtocoloSelecionadoId(p.id)}
                    className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-black transition ${
                      selecionado
                        ? 'bg-[var(--accent)] text-white'
                        : 'bg-[var(--metric-card)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    {p.nome}
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                        selecionado ? 'bg-white/20 text-white' : 'bg-[var(--accent)]/15 text-[var(--accent)]'
                      }`}
                    >
                      {ativos}
                    </span>
                  </button>
                )
              })}
            </div>

            {protocoloSelecionado && (
              <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-[var(--metric-card)] px-3.5 py-2.5 text-[10px] font-bold text-[var(--muted-foreground)]">
                <span>
                  Jornada:{' '}
                  <span className="text-[var(--foreground)]">
                    {(protocoloSelecionado.etapas.length ? protocoloSelecionado.etapas : ETAPAS_PADRAO).join(' → ')}
                  </span>
                </span>
                {protocoloSelecionado.produtos_kommo.length > 0 && (
                  <span className="flex flex-wrap items-center gap-1.5">
                    Produtos Kommo:
                    {protocoloSelecionado.produtos_kommo.map((produto) => (
                      <span
                        key={produto}
                        className="rounded-full bg-[var(--accent)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--accent)]"
                      >
                        {produto}
                      </span>
                    ))}
                  </span>
                )}
              </div>
            )}

            <div className="mb-4 grid gap-2.5 @sm:grid-cols-3">
              <select value={filtroMedico} onChange={(e) => setFiltroMedico(e.target.value)} className={inputClass}>
                <option value="">Todos os médicos</option>
                {medicosDisponiveis.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className={inputClass}>
                <option value="">Todos os status</option>
                {STATUS_OPCOES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>

              <select
                value={filtroResponsavel}
                onChange={(e) => setFiltroResponsavel(e.target.value)}
                className={inputClass}
              >
                <option value="">Todos os responsáveis</option>
                {responsaveisDisponiveis.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {erro && (
              <p className="mb-3 rounded-xl bg-[var(--danger)]/10 px-3 py-2 text-xs font-bold text-[var(--danger)]">
                {erro}
              </p>
            )}

            {carregando ? (
              <div className="flex items-center justify-center py-16 text-[var(--muted-foreground)]">
                <Loader2 className="animate-spin" size={20} />
              </div>
            ) : protocoloSelecionado ? (
              <QuadroKanban
                protocolo={protocoloSelecionado}
                pacientes={pacientes}
                vendasPendentes={vendasPendentesDoProtocolo}
                onMoverEtapa={(pacienteId, novaEtapa) => atualizarPaciente(pacienteId, { etapaAtual: novaEtapa })}
                onSelecionarPaciente={setPacienteSelecionado}
                onConfirmarVenda={criarAcompanhamentoDaVenda}
              />
            ) : null}
          </>
        )}
      </div>

      {pacienteSelecionado && (
        <PainelDetalhePaciente
          paciente={pacienteSelecionado}
          onClose={() => setPacienteSelecionado(null)}
          onUpdate={(updates) => atualizarPaciente(pacienteSelecionado.id, updates)}
        />
      )}

      {showGerenciarProtocolos && (
        <ModalGerenciarProtocolos
          protocolos={protocolos}
          onClose={() => setShowGerenciarProtocolos(false)}
          onChanged={fetchProtocolos}
        />
      )}

      {showNovoPaciente && (
        <ModalNovoPaciente
          protocolos={protocolos}
          onClose={() => setShowNovoPaciente(false)}
          onCreated={() => {
            setShowNovoPaciente(false)
            fetchPacientes()
            fetchPacientesGlobal()
          }}
        />
      )}
    </div>
  )
}

// ---------- Kanban ----------

function QuadroKanban({
  protocolo,
  pacientes,
  vendasPendentes,
  onMoverEtapa,
  onSelecionarPaciente,
  onConfirmarVenda,
}: {
  protocolo: Protocolo
  pacientes: PacienteProtocolo[]
  vendasPendentes: VendaPendente[]
  onMoverEtapa: (pacienteId: string, novaEtapa: string) => void
  onSelecionarPaciente: (p: PacienteProtocolo) => void
  onConfirmarVenda: (venda: VendaPendente) => void
}) {
  const etapas = protocolo.etapas.length > 0 ? protocolo.etapas : ETAPAS_PADRAO
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return
    const novaEtapa = String(over.id)
    const pacienteId = String(active.id)
    const paciente = pacientes.find((p) => p.id === pacienteId)
    if (paciente && etapaEfetiva(paciente, etapas) !== novaEtapa) {
      onMoverEtapa(pacienteId, novaEtapa)
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {etapas.map((etapa, i) => (
          <ColunaKanban
            key={etapa}
            etapa={etapa}
            pacientes={pacientes.filter((p) => etapaEfetiva(p, etapas) === etapa)}
            vendasPendentes={i === 0 ? vendasPendentes : []}
            onSelecionarPaciente={onSelecionarPaciente}
            onConfirmarVenda={onConfirmarVenda}
          />
        ))}
      </div>
    </DndContext>
  )
}

function ColunaKanban({
  etapa,
  pacientes,
  vendasPendentes,
  onSelecionarPaciente,
  onConfirmarVenda,
}: {
  etapa: string
  pacientes: PacienteProtocolo[]
  vendasPendentes: VendaPendente[]
  onSelecionarPaciente: (p: PacienteProtocolo) => void
  onConfirmarVenda: (venda: VendaPendente) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: etapa })

  return (
    <div
      ref={setNodeRef}
      className={`w-[260px] shrink-0 rounded-[16px] border p-2.5 transition-colors ${
        isOver ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[color:var(--border)] bg-[var(--background)]'
      }`}
    >
      <div className="mb-2.5 flex items-center justify-between px-1">
        <h4 className="truncate text-[11px] font-black uppercase tracking-wide text-[var(--foreground)]">{etapa}</h4>
        <span className="shrink-0 rounded-full bg-[var(--metric-card)] px-2 py-0.5 text-[10px] font-black text-[var(--muted-foreground)]">
          {pacientes.length}
        </span>
      </div>
      <div className="space-y-2">
        {vendasPendentes.map((v) => (
          <CardVendaPendenteKanban key={v.kommoLeadId} venda={v} onConfirmar={() => onConfirmarVenda(v)} />
        ))}
        {pacientes.map((p) => (
          <CardPacienteKanban key={p.id} paciente={p} onClick={() => onSelecionarPaciente(p)} />
        ))}
        {pacientes.length === 0 && vendasPendentes.length === 0 && (
          <p className="px-1 py-6 text-center text-[10px] font-semibold text-[var(--muted-foreground)]">
            Arraste um paciente aqui
          </p>
        )}
      </div>
    </div>
  )
}

function CardVendaPendenteKanban({ venda, onConfirmar }: { venda: VendaPendente; onConfirmar: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--accent)]/40 bg-[var(--accent)]/5 p-3">
      <p className="truncate text-xs font-black text-[var(--foreground)]">{venda.nomePaciente}</p>
      <p className="mt-0.5 truncate text-[10px] font-semibold text-[var(--muted-foreground)]">
        {venda.produto} · {venda.medico || 'sem médico'} · {formatMoney(venda.valor)}
      </p>
      <button
        onClick={onConfirmar}
        className="mt-2 w-full rounded-lg bg-[var(--accent)] px-2 py-1.5 text-[10px] font-black text-white transition hover:brightness-110"
      >
        Confirmar acompanhamento
      </button>
    </div>
  )
}

function CardPacienteKanban({ paciente, onClick }: { paciente: PacienteProtocolo; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: paciente.id })
  const info = statusInfo(paciente.status)
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 10 }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`cursor-grab touch-none rounded-xl border border-[color:var(--border)] bg-[var(--card)] p-3 transition active:cursor-grabbing ${
        isDragging ? 'opacity-40' : 'hover:border-[var(--accent)]/40'
      }`}
    >
      <p className="truncate text-xs font-black text-[var(--foreground)]">{paciente.nome_paciente}</p>
      <p className="mt-0.5 truncate text-[10px] font-semibold text-[var(--muted-foreground)]">
        {paciente.medico || 'sem médico'}
      </p>
      {paciente.proxima_acao && (
        <p className="mt-1.5 truncate text-[10px] font-semibold text-[var(--accent)]">→ {paciente.proxima_acao}</p>
      )}
      <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[9px] font-black ${info.className}`}>
        {info.label}
      </span>
    </div>
  )
}

// ---------- Subcomponentes ----------

function KpiMini({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ size?: number }>
  label: string
  value: string | number
  accent: 'blue' | 'purple' | 'red' | 'yellow' | 'green'
}) {
  const colors: Record<string, string> = {
    blue: 'text-[var(--accent)] bg-[var(--accent)]/10',
    purple: 'text-violet-400 bg-violet-400/10',
    red: 'text-[var(--danger)] bg-[var(--danger)]/10',
    yellow: 'text-[var(--warning)] bg-[var(--warning)]/10',
    green: 'text-[var(--success)] bg-[var(--success)]/10',
  }
  return (
    <div className="metric-card">
      <div className="flex items-center justify-between">
        <p className="metric-label">{label}</p>
        <div className={`rounded-[10px] p-2 ${colors[accent]}`}>
          <Icon size={14} />
        </div>
      </div>
      <h3 className="metric-value text-2xl">{value}</h3>
    </div>
  )
}

function PainelDetalhePaciente({
  paciente,
  onClose,
  onUpdate,
}: {
  paciente: PacienteProtocolo
  onClose: () => void
  onUpdate: (updates: Record<string, unknown>) => Promise<{ ok?: boolean; error?: string }>
}) {
  const [novoItemChecklist, setNovoItemChecklist] = useState('')
  const [novaObservacao, setNovaObservacao] = useState('')
  const [salvando, setSalvando] = useState(false)

  const etapasProtocolo = paciente.protocolo?.etapas?.length ? paciente.protocolo.etapas : ETAPAS_PADRAO

  const [semanaAtual, setSemanaAtual] = useState(paciente.semana_atual)
  const [etapaAtual, setEtapaAtual] = useState(etapaEfetiva(paciente, etapasProtocolo))
  const [status, setStatus] = useState(paciente.status)
  const [ultimoContato, setUltimoContato] = useState(paciente.ultimo_contato || '')
  const [adesao, setAdesao] = useState(paciente.adesao_percent ?? '')
  const [saldoContratado, setSaldoContratado] = useState(paciente.saldo_contratado ?? '')
  const [saldoRealizado, setSaldoRealizado] = useState(paciente.saldo_realizado ?? '')
  const [proximaAcao, setProximaAcao] = useState(paciente.proxima_acao || '')
  const [proximaAcaoResponsavel, setProximaAcaoResponsavel] = useState(paciente.proxima_acao_responsavel || '')
  const [proximaAcaoPrazo, setProximaAcaoPrazo] = useState(paciente.proxima_acao_prazo || '')
  const [proximaAcaoPrioridade, setProximaAcaoPrioridade] = useState(paciente.proxima_acao_prioridade || 'media')

  const progresso = paciente.protocolo?.duracao_semanas
    ? Math.min(100, Math.round((semanaAtual / paciente.protocolo.duracao_semanas) * 100))
    : 0

  async function salvarAlteracoes() {
    setSalvando(true)
    await onUpdate({
      semanaAtual: Number(semanaAtual) || 0,
      etapaAtual,
      status,
      ultimoContato: ultimoContato || null,
      adesaoPercent: adesao === '' ? null : Number(adesao),
      saldoContratado: saldoContratado === '' ? null : Number(saldoContratado),
      saldoRealizado: saldoRealizado === '' ? null : Number(saldoRealizado),
      proximaAcao: proximaAcao || null,
      proximaAcaoResponsavel: proximaAcaoResponsavel || null,
      proximaAcaoPrazo: proximaAcaoPrazo || null,
      proximaAcaoPrioridade: proximaAcaoPrioridade || null,
    })
    setSalvando(false)
  }

  async function alternarChecklistItem(index: number) {
    const checklist = paciente.checklist.map((item, i) =>
      i === index ? { ...item, status: item.status === 'concluido' ? 'pendente' : 'concluido' as const } : item
    )
    await onUpdate({ checklist })
  }

  async function adicionarItemChecklist() {
    if (!novoItemChecklist.trim()) return
    const checklist = [...paciente.checklist, { item: novoItemChecklist.trim(), status: 'pendente' as const }]
    setNovoItemChecklist('')
    await onUpdate({ checklist })
  }

  async function removerItemChecklist(index: number) {
    const checklist = paciente.checklist.filter((_, i) => i !== index)
    await onUpdate({ checklist })
  }

  async function adicionarObservacao() {
    if (!novaObservacao.trim()) return
    const observacoes = [
      { texto: novaObservacao.trim(), criado_em: new Date().toISOString() },
      ...paciente.observacoes,
    ]
    setNovaObservacao('')
    await onUpdate({ observacoes })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[18px] border border-[color:var(--border)] bg-[var(--card)] p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[17px] font-black text-[var(--foreground)]">{paciente.nome_paciente}</h3>
            <p className="text-xs font-semibold text-[var(--muted-foreground)]">
              {paciente.protocolo?.nome || 'Sem protocolo'} · {paciente.medico || 'sem médico'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-[var(--muted-foreground)] transition hover:bg-[var(--metric-card)]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mb-5">
          <div className="progress-bar h-2">
            <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${progresso}%` }} />
          </div>
          <p className="mt-1 text-[11px] font-bold text-[var(--muted-foreground)]">
            Semana {semanaAtual}
            {paciente.protocolo ? ` de ${paciente.protocolo.duracao_semanas}` : ''} · {progresso}% concluído
          </p>
        </div>

        <div className="grid gap-2.5 @sm:grid-cols-2 @lg:grid-cols-3">
          <Campo label="Etapa">
            <select value={etapaAtual} onChange={(e) => setEtapaAtual(e.target.value)} className={inputClass}>
              {etapasProtocolo.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </Campo>
          <Campo label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
              {STATUS_OPCOES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Campo>
          <Campo label="Semana atual">
            <input
              type="number"
              min={0}
              value={semanaAtual}
              onChange={(e) => setSemanaAtual(Number(e.target.value))}
              className={inputClass}
            />
          </Campo>
          <Campo label="Adesão (%)">
            <input
              type="number"
              min={0}
              max={100}
              value={adesao}
              onChange={(e) => setAdesao(e.target.value === '' ? '' : Number(e.target.value))}
              className={inputClass}
            />
          </Campo>
          <Campo label="Último contato">
            <input
              type="date"
              value={ultimoContato}
              onChange={(e) => setUltimoContato(e.target.value)}
              className={inputClass}
            />
          </Campo>
          <Campo label="Saldo contratado">
            <input
              type="number"
              min={0}
              value={saldoContratado}
              onChange={(e) => setSaldoContratado(e.target.value === '' ? '' : Number(e.target.value))}
              className={inputClass}
            />
          </Campo>
          <Campo label="Saldo realizado">
            <input
              type="number"
              min={0}
              value={saldoRealizado}
              onChange={(e) => setSaldoRealizado(e.target.value === '' ? '' : Number(e.target.value))}
              className={inputClass}
            />
          </Campo>
        </div>

        <h4 className="mb-2 mt-5 text-xs font-black uppercase tracking-wide text-[var(--muted-foreground)]">
          Próxima ação
        </h4>
        <div className="grid gap-2.5 @sm:grid-cols-2 @lg:grid-cols-4">
          <div className="@lg:col-span-2">
            <Campo label="Ação">
              <input
                value={proximaAcao}
                onChange={(e) => setProximaAcao(e.target.value)}
                placeholder="Ex: ligar para remarcar sessão"
                className={inputClass}
              />
            </Campo>
          </div>
          <Campo label="Responsável">
            <input
              value={proximaAcaoResponsavel}
              onChange={(e) => setProximaAcaoResponsavel(e.target.value)}
              className={inputClass}
            />
          </Campo>
          <Campo label="Prazo">
            <input
              type="date"
              value={proximaAcaoPrazo}
              onChange={(e) => setProximaAcaoPrazo(e.target.value)}
              className={inputClass}
            />
          </Campo>
          <Campo label="Prioridade">
            <select
              value={proximaAcaoPrioridade}
              onChange={(e) => setProximaAcaoPrioridade(e.target.value)}
              className={inputClass}
            >
              {PRIORIDADE_OPCOES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </Campo>
        </div>

        <button
          onClick={salvarAlteracoes}
          disabled={salvando}
          className="mt-4 w-full rounded-xl bg-[var(--accent)] px-4 py-2.5 text-xs font-black text-white transition disabled:opacity-50"
        >
          {salvando ? 'Salvando...' : 'Salvar alterações'}
        </button>

        <h4 className="mb-2 mt-6 text-xs font-black uppercase tracking-wide text-[var(--muted-foreground)]">
          Checklist
        </h4>
        <div className="space-y-1.5">
          {paciente.checklist.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-2 rounded-xl bg-[var(--metric-card)] px-3 py-2"
            >
              <button onClick={() => alternarChecklistItem(i)} className="flex min-w-0 items-center gap-2 text-left">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                    item.status === 'concluido'
                      ? 'border-[var(--success)] bg-[var(--success)] text-white'
                      : 'border-[color:var(--border)]'
                  }`}
                >
                  {item.status === 'concluido' && <Check size={12} />}
                </span>
                <span
                  className={`truncate text-xs font-semibold ${
                    item.status === 'concluido'
                      ? 'text-[var(--muted-foreground)] line-through'
                      : 'text-[var(--foreground)]'
                  }`}
                >
                  {item.item}
                </span>
              </button>
              <button
                onClick={() => removerItemChecklist(i)}
                className="shrink-0 text-[var(--muted-foreground)] transition hover:text-[var(--danger)]"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          {paciente.checklist.length === 0 && (
            <p className="text-xs font-semibold text-[var(--muted-foreground)]">Nenhum item ainda.</p>
          )}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            value={novoItemChecklist}
            onChange={(e) => setNovoItemChecklist(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && adicionarItemChecklist()}
            placeholder="Novo item do checklist"
            className={inputClass}
          />
          <button
            onClick={adicionarItemChecklist}
            className="flex shrink-0 items-center justify-center rounded-xl bg-[var(--metric-card)] px-3 text-[var(--foreground)] transition hover:bg-[var(--border)]"
          >
            <Plus size={16} />
          </button>
        </div>

        <h4 className="mb-2 mt-6 text-xs font-black uppercase tracking-wide text-[var(--muted-foreground)]">
          Observações
        </h4>
        <div className="flex gap-2">
          <input
            value={novaObservacao}
            onChange={(e) => setNovaObservacao(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && adicionarObservacao()}
            placeholder="Adicionar observação"
            className={inputClass}
          />
          <button
            onClick={adicionarObservacao}
            className="flex shrink-0 items-center justify-center rounded-xl bg-[var(--metric-card)] px-3 text-[var(--foreground)] transition hover:bg-[var(--border)]"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="mt-2 max-h-[180px] space-y-2 overflow-y-auto">
          {paciente.observacoes.map((obs, i) => (
            <div key={i} className="rounded-xl bg-[var(--metric-card)] px-3 py-2">
              <p className="text-xs font-semibold text-[var(--foreground)]">{obs.texto}</p>
              <p className="mt-0.5 text-[10px] font-bold text-[var(--muted-foreground)]">
                {new Date(obs.criado_em).toLocaleString('pt-BR')}
              </p>
            </div>
          ))}
          {paciente.observacoes.length === 0 && (
            <p className="text-xs font-semibold text-[var(--muted-foreground)]">Nenhuma observação ainda.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-[10px] font-black uppercase tracking-wide text-[var(--muted-foreground)]">
        {label}
      </span>
      {children}
    </label>
  )
}

function ModalGerenciarProtocolos({
  protocolos,
  onClose,
  onChanged,
}: {
  protocolos: Protocolo[]
  onClose: () => void
  onChanged: () => void
}) {
  const [nome, setNome] = useState('')
  const [produtos, setProdutos] = useState('')
  const [duracaoSemanas, setDuracaoSemanas] = useState(12)
  const [etapas, setEtapas] = useState(ETAPAS_PADRAO.join(', '))
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const [editandoEtapasId, setEditandoEtapasId] = useState<string | null>(null)
  const [etapasEditando, setEtapasEditando] = useState('')

  async function criarProtocolo() {
    if (!nome.trim()) return
    setSalvando(true)
    setErro('')
    try {
      const res = await fetch('/api/protocolos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          produtosKommo: produtos.split(',').map((p) => p.trim()).filter(Boolean),
          duracaoSemanas,
          etapas: etapas.split(',').map((e) => e.trim()).filter(Boolean),
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!json.ok) {
        setErro(json.error || 'Erro ao criar protocolo')
        return
      }
      setNome('')
      setProdutos('')
      setDuracaoSemanas(12)
      setEtapas(ETAPAS_PADRAO.join(', '))
      onChanged()
    } finally {
      setSalvando(false)
    }
  }

  async function alternarAtivo(p: Protocolo) {
    await fetch(`/api/protocolos/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !p.ativo }),
    })
    onChanged()
  }

  async function removerProtocolo(p: Protocolo) {
    await fetch(`/api/protocolos/${p.id}`, { method: 'DELETE' })
    onChanged()
  }

  function abrirEdicaoEtapas(p: Protocolo) {
    setEditandoEtapasId(p.id)
    setEtapasEditando((p.etapas.length ? p.etapas : ETAPAS_PADRAO).join(', '))
  }

  async function salvarEtapas(p: Protocolo) {
    const novasEtapas = etapasEditando.split(',').map((e) => e.trim()).filter(Boolean)
    if (novasEtapas.length === 0) return
    await fetch(`/api/protocolos/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ etapas: novasEtapas }),
    })
    setEditandoEtapasId(null)
    onChanged()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-[18px] border border-[color:var(--border)] bg-[var(--card)] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[16px] font-black text-[var(--foreground)]">Gerenciar protocolos</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-[10px] text-[var(--muted-foreground)] transition hover:bg-[var(--metric-card)]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-2">
          {protocolos.map((p) => (
            <div key={p.id} className="rounded-xl bg-[var(--metric-card)] px-3.5 py-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className={`text-xs font-black ${p.ativo ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)] line-through'}`}>
                    {p.nome}
                  </p>
                  <p className="truncate text-[10px] font-semibold text-[var(--muted-foreground)]">
                    {p.duracao_semanas} semanas · {p.produtos_kommo.join(', ') || 'sem produtos vinculados'}
                  </p>
                  <p className="truncate text-[10px] font-semibold text-[var(--muted-foreground)]">
                    Etapas: {(p.etapas.length ? p.etapas : ETAPAS_PADRAO).join(' → ')}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    onClick={() => abrirEdicaoEtapas(p)}
                    title="Editar etapas"
                    className="rounded-lg p-1.5 text-[var(--muted-foreground)] transition hover:bg-[var(--border)] hover:text-[var(--foreground)]"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => alternarAtivo(p)}
                    className="rounded-lg px-2.5 py-1 text-[10px] font-black text-[var(--muted-foreground)] transition hover:bg-[var(--border)]"
                  >
                    {p.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                  <button
                    onClick={() => removerProtocolo(p)}
                    className="rounded-lg p-1.5 text-[var(--muted-foreground)] transition hover:bg-[var(--danger)]/10 hover:text-[var(--danger)]"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {editandoEtapasId === p.id && (
                <div className="mt-2.5 flex gap-2">
                  <input
                    value={etapasEditando}
                    onChange={(e) => setEtapasEditando(e.target.value)}
                    placeholder="Etapas separadas por vírgula, na ordem da jornada"
                    className={inputClass}
                  />
                  <button
                    onClick={() => salvarEtapas(p)}
                    className="shrink-0 rounded-xl bg-[var(--accent)] px-3 text-[11px] font-black text-white transition hover:brightness-110"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => setEditandoEtapasId(null)}
                    className="shrink-0 rounded-xl bg-[var(--card)] px-3 text-[11px] font-black text-[var(--muted-foreground)] transition hover:bg-[var(--border)]"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          ))}
          {protocolos.length === 0 && (
            <p className="text-xs font-semibold text-[var(--muted-foreground)]">Nenhum protocolo cadastrado.</p>
          )}
        </div>

        <h4 className="mb-2 mt-5 text-xs font-black uppercase tracking-wide text-[var(--muted-foreground)]">
          Novo protocolo
        </h4>
        <div className="grid gap-2.5 @sm:grid-cols-2">
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do protocolo" className={inputClass} />
          <input
            type="number"
            min={1}
            value={duracaoSemanas}
            onChange={(e) => setDuracaoSemanas(Number(e.target.value))}
            placeholder="Duração (semanas)"
            className={inputClass}
          />
          <div className="@sm:col-span-2">
            <input
              value={produtos}
              onChange={(e) => setProdutos(e.target.value)}
              placeholder="Produtos do Kommo vinculados, separados por vírgula"
              className={inputClass}
            />
          </div>
          <div className="@sm:col-span-2">
            <input
              value={etapas}
              onChange={(e) => setEtapas(e.target.value)}
              placeholder="Etapas da jornada, separadas por vírgula, na ordem"
              className={inputClass}
            />
          </div>
        </div>
        {erro && <p className="mt-2 text-xs font-bold text-[var(--danger)]">{erro}</p>}
        <button
          onClick={criarProtocolo}
          disabled={salvando || !nome.trim()}
          className="mt-3 w-full rounded-xl bg-[var(--accent)] px-4 py-2.5 text-xs font-black text-white transition disabled:opacity-50"
        >
          {salvando ? 'Criando...' : 'Criar protocolo'}
        </button>
      </div>
    </div>
  )
}

function ModalNovoPaciente({
  protocolos,
  onClose,
  onCreated,
}: {
  protocolos: Protocolo[]
  onClose: () => void
  onCreated: () => void
}) {
  const [nomePaciente, setNomePaciente] = useState('')
  const [protocoloId, setProtocoloId] = useState('')
  const [medico, setMedico] = useState('')
  const [dataInicio, setDataInicio] = useState(hojeISO())
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  async function criarPaciente() {
    if (!nomePaciente.trim()) return
    setSalvando(true)
    setErro('')
    try {
      const res = await fetch('/api/pacientes-protocolo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomePaciente: nomePaciente.trim(),
          protocoloId: protocoloId || null,
          medico: medico || null,
          dataInicio: dataInicio || null,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!json.ok) {
        setErro(json.error || 'Erro ao criar paciente')
        return
      }
      onCreated()
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-[18px] border border-[color:var(--border)] bg-[var(--card)] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[16px] font-black text-[var(--foreground)]">Novo paciente</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-[10px] text-[var(--muted-foreground)] transition hover:bg-[var(--metric-card)]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-2.5">
          <Campo label="Nome do paciente">
            <input value={nomePaciente} onChange={(e) => setNomePaciente(e.target.value)} className={inputClass} />
          </Campo>
          <Campo label="Protocolo">
            <select value={protocoloId} onChange={(e) => setProtocoloId(e.target.value)} className={inputClass}>
              <option value="">Selecione um protocolo</option>
              {protocolos
                .filter((p) => p.ativo)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
            </select>
          </Campo>
          <Campo label="Médico">
            <input value={medico} onChange={(e) => setMedico(e.target.value)} className={inputClass} />
          </Campo>
          <Campo label="Data de início">
            <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className={inputClass} />
          </Campo>
        </div>

        {erro && <p className="mt-2 text-xs font-bold text-[var(--danger)]">{erro}</p>}

        <button
          onClick={criarPaciente}
          disabled={salvando || !nomePaciente.trim()}
          className="mt-4 w-full rounded-xl bg-[var(--accent)] px-4 py-2.5 text-xs font-black text-white transition disabled:opacity-50"
        >
          {salvando ? 'Criando...' : 'Criar paciente'}
        </button>
      </div>
    </div>
  )
}
