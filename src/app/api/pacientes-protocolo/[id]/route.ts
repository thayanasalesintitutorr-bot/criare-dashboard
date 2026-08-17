export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireSession } from '@/lib/require-session'
import { requireProtocoloGate } from '@/lib/require-protocolo-gate'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const CAMPOS_ATUALIZAVEIS: Record<string, string> = {
  nomePaciente: 'nome_paciente',
  protocoloId: 'protocolo_id',
  medico: 'medico',
  kommoLeadId: 'kommo_lead_id',
  kommoContactId: 'kommo_contact_id',
  dataInicio: 'data_inicio',
  semanaAtual: 'semana_atual',
  etapaAtual: 'etapa_atual',
  status: 'status',
  adesaoPercent: 'adesao_percent',
  ultimoContato: 'ultimo_contato',
  proximaAcao: 'proxima_acao',
  proximaAcaoResponsavel: 'proxima_acao_responsavel',
  proximaAcaoPrazo: 'proxima_acao_prazo',
  proximaAcaoPrioridade: 'proxima_acao_prioridade',
  saldoContratado: 'saldo_contratado',
  saldoRealizado: 'saldo_realizado',
  checklist: 'checklist',
  observacoes: 'observacoes',
  ativo: 'ativo',
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession(req)
  if (!auth.ok) return auth.response

  const gate = await requireProtocoloGate(req)
  if (!gate.ok) return gate.response

  const { id } = await params

  const { data, error } = await supabaseAdmin
    .from('pacientes_protocolo')
    .select('*, protocolo:protocolos(id, nome, duracao_semanas, cor, etapas)')
    .eq('id', id)
    .single()

  if (error) {
    console.error('[api/pacientes-protocolo/[id] GET]', error)
    return NextResponse.json({ ok: false, error: 'Paciente não encontrado' }, { status: 404 })
  }

  return NextResponse.json({ ok: true, paciente: data })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession(req)
  if (!auth.ok) return auth.response

  const gate = await requireProtocoloGate(req)
  if (!gate.ok) return gate.response

  const { id } = await params

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Requisição inválida' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  for (const [chaveBody, coluna] of Object.entries(CAMPOS_ATUALIZAVEIS)) {
    if (body[chaveBody] !== undefined) updates[coluna] = body[chaveBody]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: false, error: 'Nada para atualizar' }, { status: 400 })
  }

  updates.atualizado_em = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('pacientes_protocolo')
    .update(updates)
    .eq('id', id)
    .select('*, protocolo:protocolos(id, nome, duracao_semanas, cor, etapas)')
    .single()

  if (error) {
    console.error('[api/pacientes-protocolo/[id] PATCH]', error)
    return NextResponse.json({ ok: false, error: 'Erro ao atualizar paciente' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, paciente: data })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession(req)
  if (!auth.ok) return auth.response

  const gate = await requireProtocoloGate(req)
  if (!gate.ok) return gate.response

  const { id } = await params

  const { error } = await supabaseAdmin
    .from('pacientes_protocolo')
    .update({ ativo: false, atualizado_em: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('[api/pacientes-protocolo/[id] DELETE]', error)
    return NextResponse.json({ ok: false, error: 'Erro ao remover paciente' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
