export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireSession } from '@/lib/require-session'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
// Ordem de exibição começando na segunda, mais natural pra revisão de semana.
const ORDEM_SEMANA = [1, 2, 3, 4, 5, 6, 0]

type ItemLista = {
  contact_id: string
  status: string | null
  msgs: number | null
  ultima_atividade: string | null
}

function calcularPorStatus(lista: ItemLista[]) {
  const contagem: Record<string, number> = {}

  for (const item of lista) {
    const status = item.status || 'Sem status'
    contagem[status] = (contagem[status] || 0) + 1
  }

  return Object.entries(contagem)
    .map(([status, quantidade]) => ({ status, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade)
}

function calcularDistribuicaoMensagens(lista: ItemLista[]) {
  const faixas = { '0 mensagens': 0, '1 a 3': 0, '4 a 10': 0, 'Mais de 10': 0 }

  for (const item of lista) {
    const m = item.msgs || 0
    if (m === 0) faixas['0 mensagens']++
    else if (m <= 3) faixas['1 a 3']++
    else if (m <= 10) faixas['4 a 10']++
    else faixas['Mais de 10']++
  }

  return Object.entries(faixas).map(([faixa, quantidade]) => ({ faixa, quantidade }))
}

function calcularPorDiaSemana(evolucaoDiaria: { dia: string; leads: number }[]) {
  const somaPorDia = new Array(7).fill(0)

  for (const item of evolucaoDiaria) {
    const data = new Date(`${item.dia}T00:00:00`)
    somaPorDia[data.getDay()] += item.leads
  }

  return ORDEM_SEMANA.map((indice) => ({
    dia: DIAS_SEMANA[indice],
    leads: somaPorDia[indice],
  }))
}

// Classificação por palavra-chave dos motivos de contato — roda em cima de uma
// amostra recente de transcrições (não do histórico inteiro: cada transcript
// é uma chamada separada ao banco, e conversas_lista já demora ~4s em 200
// registros, então buscar centenas de transcrições deixaria a página muito
// lenta). Serve como um primeiro recorte enquanto não existe uma função no
// banco que já faça essa contagem em SQL sobre todas as mensagens do período.
const TOPICOS: { label: string; padrao: RegExp }[] = [
  { label: 'Agendar consulta', padrao: /\b(agendar|marcar|hor[aá]rio dispon|consulta|vaga)\b/i },
  { label: 'Remarcar ou cancelar', padrao: /\b(remarcar|reagendar|cancelar|desmarcar|adiar|mudar (a |o )?hor[aá]rio)\b/i },
  { label: 'Financeiro / nota fiscal', padrao: /\b(nota fiscal|recibo|pagamento|boleto|parcela|valor|pre[cç]o|quanto custa|conv[eê]nio|particular)\b/i },
  { label: 'Dúvida sobre procedimento', padrao: /\b(escleroterapia|varizes|vascular|cirurgia|procedimento|emagrecimento|protocolo|tratamento|inje[tç][aá]vel|avalia[cç][aã]o)\b/i },
  { label: 'Pós-operatório / sintomas', padrao: /\b(dor|inc[oô]modo|cicatriz|resultado|inflama|sangramento|p[oó]s.?operat[oó]rio|efeito)\b/i },
  { label: 'Confirmação rápida', padrao: /^(sim|ok|pode ser|confirmado|certo|blz|beleza|t[aá] bom)\.?!?$/i },
]

function classificarMensagem(texto: string): string | null {
  const limpo = (texto || '').trim()
  if (!limpo) return null

  for (const { label, padrao } of TOPICOS) {
    if (padrao.test(limpo)) return label
  }

  return 'Outros assuntos'
}

type CacheTopicos = { data: unknown; expiraEm: number }
const TOPICOS_CACHE_MS = 15 * 60 * 1000
const cacheTopicos = new Map<string, CacheTopicos>()

async function buscarPrincipaisMotivos(candidatos: ItemLista[]) {
  const amostra = candidatos
    .filter((c) => (c.msgs || 0) > 0)
    .sort((a, b) => {
      const da = a.ultima_atividade ? new Date(a.ultima_atividade).getTime() : 0
      const db = b.ultima_atividade ? new Date(b.ultima_atividade).getTime() : 0
      return db - da
    })
    .slice(0, 25)

  if (amostra.length === 0) {
    return { conversasAnalisadas: 0, mensagensAnalisadas: 0, ranking: [] as { topico: string; ocorrencias: number }[] }
  }

  const resultados = await Promise.all(
    amostra.map((c) => supabaseAdmin.rpc('conversa_transcript', { p_contact_id: c.contact_id }))
  )

  const contagem: Record<string, number> = {}
  let mensagensAnalisadas = 0

  for (const r of resultados) {
    if (r.error || !Array.isArray(r.data)) continue

    for (const msg of r.data as { quem: string; conteudo: string }[]) {
      if (msg.quem !== 'paciente') continue

      mensagensAnalisadas++
      const topico = classificarMensagem(msg.conteudo)
      if (!topico) continue

      contagem[topico] = (contagem[topico] || 0) + 1
    }
  }

  const ranking = Object.entries(contagem)
    .map(([topico, ocorrencias]) => ({ topico, ocorrencias }))
    .sort((a, b) => b.ocorrencias - a.ocorrencias)

  return { conversasAnalisadas: amostra.length, mensagensAnalisadas, ranking }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireSession(req)
    if (!auth.ok) return auth.response

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
    const lista: ItemLista[] = listaRes.data ?? []

    if (kpis.operacao) {
      const tempoResposta = tempoRes.data ?? null
      kpis.operacao.tempo_resposta_medio_seg = tempoResposta
      // 0s de resposta média em milhares de conversas quase sempre é artefato
      // de importação (mensagens com o mesmo timestamp), não velocidade real —
      // o front usa essa flag pra não comemorar um dado que provavelmente é
      // falho.
      kpis.operacao.tempo_resposta_confiavel =
        typeof tempoResposta === 'number' && tempoResposta > 0
    }

    kpis.comportamento = {
      por_canal: kpis.funil?.por_canal ?? [],
      por_status: calcularPorStatus(lista),
      distribuicao_mensagens: calcularDistribuicaoMensagens(lista),
      por_dia_semana: calcularPorDiaSemana(kpis.operacao?.evolucao_diaria ?? []),
    }

    const chaveCache = `${inicio.toISOString()}|${fim.toISOString()}`
    const cacheado = cacheTopicos.get(chaveCache)

    if (cacheado && cacheado.expiraEm > Date.now()) {
      kpis.principaisMotivos = cacheado.data
    } else {
      const motivos = await buscarPrincipaisMotivos(lista)
      kpis.principaisMotivos = motivos
      cacheTopicos.set(chaveCache, { data: motivos, expiraEm: Date.now() + TOPICOS_CACHE_MS })
    }

    return NextResponse.json({
      ok: true,
      kpis,
      conversas: lista,
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
