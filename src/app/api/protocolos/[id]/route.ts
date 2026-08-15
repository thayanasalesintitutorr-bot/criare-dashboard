export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireSession } from '@/lib/require-session'
import { requireProtocoloGate } from '@/lib/require-protocolo-gate'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession(req)
  if (!auth.ok) return auth.response

  const gate = await requireProtocoloGate(req)
  if (!gate.ok) return gate.response

  const { id } = await params

  let body: {
    nome?: string
    produtosKommo?: string[]
    duracaoSemanas?: number
    cor?: string
    ativo?: boolean
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Requisição inválida' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (body.nome !== undefined) {
    const nome = String(body.nome).trim()
    if (!nome) return NextResponse.json({ ok: false, error: 'Nome não pode ficar vazio' }, { status: 400 })
    updates.nome = nome
  }
  if (body.produtosKommo !== undefined) {
    updates.produtos_kommo = Array.isArray(body.produtosKommo)
      ? body.produtosKommo.map((p) => String(p).trim().toUpperCase()).filter(Boolean)
      : []
  }
  if (body.duracaoSemanas !== undefined) {
    updates.duracao_semanas = Number(body.duracaoSemanas) > 0 ? Math.round(Number(body.duracaoSemanas)) : 12
  }
  if (body.cor !== undefined) updates.cor = body.cor || null
  if (body.ativo !== undefined) updates.ativo = Boolean(body.ativo)

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: false, error: 'Nada para atualizar' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('protocolos')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[api/protocolos/[id] PATCH]', error)
    return NextResponse.json({ ok: false, error: 'Erro ao atualizar protocolo' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, protocolo: data })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession(req)
  if (!auth.ok) return auth.response

  const gate = await requireProtocoloGate(req)
  if (!gate.ok) return gate.response

  const { id } = await params

  const { error } = await supabaseAdmin.from('protocolos').update({ ativo: false }).eq('id', id)

  if (error) {
    console.error('[api/protocolos/[id] DELETE]', error)
    return NextResponse.json({ ok: false, error: 'Erro ao remover protocolo' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
