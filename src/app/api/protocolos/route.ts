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
  const somenteAtivos = searchParams.get('ativos') === '1'

  let query = supabaseAdmin.from('protocolos').select('*').order('criado_em', { ascending: true })
  if (somenteAtivos) query = query.eq('ativo', true)

  const { data, error } = await query

  if (error) {
    console.error('[api/protocolos GET]', error)
    return NextResponse.json({ ok: false, error: 'Erro ao buscar protocolos' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, protocolos: data ?? [] })
}

export async function POST(req: NextRequest) {
  const auth = await requireSession(req)
  if (!auth.ok) return auth.response

  const gate = await requireProtocoloGate(req)
  if (!gate.ok) return gate.response

  let body: {
    nome?: string
    produtosKommo?: string[]
    duracaoSemanas?: number
    cor?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Requisição inválida' }, { status: 400 })
  }

  const nome = String(body.nome || '').trim()
  if (!nome) {
    return NextResponse.json({ ok: false, error: 'Nome do protocolo é obrigatório' }, { status: 400 })
  }

  const produtosKommo = Array.isArray(body.produtosKommo)
    ? body.produtosKommo.map((p) => String(p).trim().toUpperCase()).filter(Boolean)
    : []

  const duracaoSemanas = Number(body.duracaoSemanas) > 0 ? Math.round(Number(body.duracaoSemanas)) : 12

  const { data, error } = await supabaseAdmin
    .from('protocolos')
    .insert({
      nome,
      produtos_kommo: produtosKommo,
      duracao_semanas: duracaoSemanas,
      cor: body.cor || null,
    })
    .select()
    .single()

  if (error) {
    console.error('[api/protocolos POST]', error)
    return NextResponse.json({ ok: false, error: 'Erro ao criar protocolo' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, protocolo: data })
}
