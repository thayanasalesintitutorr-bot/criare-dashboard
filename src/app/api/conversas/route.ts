export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const fim = searchParams.get('fim')
      ? new Date(searchParams.get('fim')!)
      : new Date()

    const inicio = searchParams.get('inicio')
      ? new Date(searchParams.get('inicio')!)
      : new Date(fim.getTime() - 30 * 24 * 60 * 60 * 1000)

    const contactId = searchParams.get('contact_id')

    // Transcript de uma conversa específica
    if (contactId) {
      const { data, error } = await supabaseAdmin.rpc('conversa_transcript', {
        p_contact_id: contactId,
      })

      if (error) throw error

      return NextResponse.json({ ok: true, transcript: data ?? [] })
    }

    const [kpisRes, listaRes, tempoRes] = await Promise.all([
      supabaseAdmin.rpc('conversas_kpis', {
        p_inicio: inicio.toISOString(),
        p_fim: fim.toISOString(),
      }),
      supabaseAdmin.rpc('conversas_lista', {
        p_inicio: inicio.toISOString(),
        p_fim: fim.toISOString(),
        p_limite: 200,
      }),
      supabaseAdmin.rpc('conversas_tempo_resposta', {
        p_inicio: inicio.toISOString(),
        p_fim: fim.toISOString(),
      }),
    ])

    if (kpisRes.error) throw kpisRes.error
    if (listaRes.error) throw listaRes.error

    const kpis = kpisRes.data ?? {}

    if (kpis.operacao) {
      kpis.operacao.tempo_resposta_medio_seg = tempoRes.data ?? null
    }

    return NextResponse.json({
      ok: true,
      kpis,
      conversas: listaRes.data ?? [],
      periodo: { inicio: inicio.toISOString(), fim: fim.toISOString() },
    })
  } catch (err) {
    console.error('[api/conversas]', err)

    return NextResponse.json(
      { ok: false, error: 'Erro ao carregar dados de conversas' },
      { status: 500 },
    )
  }
}
