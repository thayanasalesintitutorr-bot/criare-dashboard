export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireSession } from '@/lib/require-session'
import { requireProtocoloGate } from '@/lib/require-protocolo-gate'

const SUPABASE_URL = 'https://afxgfgvdmgxcvamginjc.supabase.co'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

function kommoHeaders() {
  return {
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
    'Accept-Profile': 'kommo',
  }
}

type LeadVenda = {
  id: number
  name?: string | null
  medico?: string | null
  Produto?: string | null
  venda?: number | string | null
  closed_at?: string | null
  contact_name?: string | null
}

type Protocolo = {
  id: string
  nome: string
  produtos_kommo: string[]
  ativo: boolean
}

export async function GET(req: NextRequest) {
  const auth = await requireSession(req)
  if (!auth.ok) return auth.response

  const gate = await requireProtocoloGate(req)
  if (!gate.ok) return gate.response

  const { data: protocolos, error: errProtocolos } = await supabaseAdmin
    .from('protocolos')
    .select('id, nome, produtos_kommo, ativo')
    .eq('ativo', true)

  if (errProtocolos) {
    console.error('[novas-vendas] protocolos', errProtocolos)
    return NextResponse.json({ ok: false, error: 'Erro ao buscar protocolos' }, { status: 500 })
  }

  const protocolosAtivos = (protocolos ?? []) as Protocolo[]
  const produtoParaProtocolo = new Map<string, Protocolo>()
  for (const protocolo of protocolosAtivos) {
    for (const produto of protocolo.produtos_kommo || []) {
      produtoParaProtocolo.set(produto.trim().toUpperCase(), protocolo)
    }
  }

  if (produtoParaProtocolo.size === 0) {
    return NextResponse.json({ ok: true, vendas: [] })
  }

  const produtosLista = Array.from(produtoParaProtocolo.keys())
    .map((p) => `"${p.replace(/"/g, '\\"')}"`)
    .join(',')

  const leadsUrl =
    `${SUPABASE_URL}/rest/v1/leads` +
    `?pipeline_id=eq.VENDAS&status_id=eq.Venda ganha` +
    `&Produto=in.(${produtosLista})` +
    `&select=id,name,medico,Produto,venda,closed_at,contact_name` +
    `&order=closed_at.desc&limit=200`

  const leadsResp = await fetch(leadsUrl, { headers: kommoHeaders() })

  if (!leadsResp.ok) {
    const errorText = await leadsResp.text()
    console.error('[novas-vendas] leads', errorText)
    return NextResponse.json({ ok: false, error: 'Erro ao buscar vendas no CRM' }, { status: 500 })
  }

  const leads = (await leadsResp.json()) as LeadVenda[]

  if (leads.length === 0) {
    return NextResponse.json({ ok: true, vendas: [] })
  }

  const { data: jaVinculados, error: errVinculados } = await supabaseAdmin
    .from('pacientes_protocolo')
    .select('kommo_lead_id')
    .not('kommo_lead_id', 'is', null)

  if (errVinculados) {
    console.error('[novas-vendas] vinculados', errVinculados)
    return NextResponse.json({ ok: false, error: 'Erro ao checar acompanhamentos existentes' }, { status: 500 })
  }

  const idsVinculados = new Set((jaVinculados ?? []).map((r) => r.kommo_lead_id))

  const vendasPendentes = leads
    .filter((lead) => !idsVinculados.has(lead.id))
    .map((lead) => {
      const protocolo = produtoParaProtocolo.get(String(lead.Produto || '').trim().toUpperCase())
      return {
        kommoLeadId: lead.id,
        nomePaciente: lead.contact_name || lead.name || 'Sem nome',
        medico: lead.medico || null,
        produto: lead.Produto || null,
        valor: lead.venda ?? null,
        fechadoEm: lead.closed_at || null,
        protocoloId: protocolo?.id || null,
        protocoloNome: protocolo?.nome || null,
      }
    })

  return NextResponse.json({ ok: true, vendas: vendasPendentes })
}
