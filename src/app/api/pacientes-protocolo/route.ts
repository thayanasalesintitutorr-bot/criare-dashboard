export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireSession } from '@/lib/require-session'
import { requireProtocoloGate } from '@/lib/require-protocolo-gate'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function GET(req: NextRequest) {
  const auth = await requireSession(req)
  if (!auth.ok) return auth.response

  const gate = await requireProtocoloGate(req)
  if (!gate.ok) return gate.response

  const { searchParams } = new URL(req.url)
  const medico = searchParams.get('medico')
  const protocoloId = searchParams.get('protocoloId')
  const status = searchParams.get('status')
  const responsavel = searchParams.get('responsavel')
  const somenteAtivos = searchParams.get('ativos') !== '0'

  let query = supabaseAdmin
    .from('pacientes_protocolo')
    .select('*, protocolo:protocolos(id, nome, duracao_semanas, cor, etapas)')
    .order('atualizado_em', { ascending: false })

  if (somenteAtivos) query = query.eq('ativo', true)
  if (medico) query = query.eq('medico', medico)
  if (protocoloId) query = query.eq('protocolo_id', protocoloId)
  if (status) query = query.eq('status', status)
  if (responsavel) query = query.eq('proxima_acao_responsavel', responsavel)

  const { data, error } = await query

  if (error) {
    console.error('[api/pacientes-protocolo GET]', error)
    return NextResponse.json({ ok: false, error: 'Erro ao buscar pacientes' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, pacientes: data ?? [] })
}

export async function POST(req: NextRequest) {
  const auth = await requireSession(req)
  if (!auth.ok) return auth.response

  const gate = await requireProtocoloGate(req)
  if (!gate.ok) return gate.response

  let body: {
    nomePaciente?: string
    protocoloId?: string
    medico?: string
    kommoLeadId?: number
    kommoContactId?: number
    dataInicio?: string
    semanaAtual?: number
    status?: string
    adesaoPercent?: number
    ultimoContato?: string
    proximaAcao?: string
    proximaAcaoResponsavel?: string
    proximaAcaoPrazo?: string
    proximaAcaoPrioridade?: string
    saldoContratado?: number
    saldoRealizado?: number
    checklist?: unknown[]
    observacoes?: unknown[]
    etapaAtual?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Requisição inválida' }, { status: 400 })
  }

  const nomePaciente = String(body.nomePaciente || '').trim()
  if (!nomePaciente) {
    return NextResponse.json({ ok: false, error: 'Nome do paciente é obrigatório' }, { status: 400 })
  }

  let etapaAtual = body.etapaAtual || null
  let checklistInicial: { item: string; status: 'pendente' }[] = []
  if (body.protocoloId) {
    const { data: protocolo } = await supabaseAdmin
      .from('protocolos')
      .select('etapas, checklist_padrao')
      .eq('id', body.protocoloId)
      .single()
    if (!etapaAtual) etapaAtual = protocolo?.etapas?.[0] || null
    if (Array.isArray(protocolo?.checklist_padrao)) {
      checklistInicial = protocolo.checklist_padrao.map((item: string) => ({ item, status: 'pendente' as const }))
    }
  }

  const { data, error } = await supabaseAdmin
    .from('pacientes_protocolo')
    .insert({
      nome_paciente: nomePaciente,
      protocolo_id: body.protocoloId || null,
      medico: body.medico || null,
      kommo_lead_id: body.kommoLeadId || null,
      kommo_contact_id: body.kommoContactId || null,
      data_inicio: body.dataInicio || null,
      semana_atual: Number(body.semanaAtual) || 0,
      etapa_atual: etapaAtual,
      status: body.status || 'onboarding',
      adesao_percent: body.adesaoPercent ?? null,
      ultimo_contato: body.ultimoContato || null,
      proxima_acao: body.proximaAcao || null,
      proxima_acao_responsavel: body.proximaAcaoResponsavel || null,
      proxima_acao_prazo: body.proximaAcaoPrazo || null,
      proxima_acao_prioridade: body.proximaAcaoPrioridade || null,
      saldo_contratado: body.saldoContratado ?? null,
      saldo_realizado: body.saldoRealizado ?? null,
      checklist: Array.isArray(body.checklist) ? body.checklist : checklistInicial,
      observacoes: Array.isArray(body.observacoes) ? body.observacoes : [],
    })
    .select('*, protocolo:protocolos(id, nome, duracao_semanas, cor, etapas)')
    .single()

  if (error) {
    console.error('[api/pacientes-protocolo POST]', error)
    return NextResponse.json({ ok: false, error: 'Erro ao criar paciente' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, paciente: data })
}
