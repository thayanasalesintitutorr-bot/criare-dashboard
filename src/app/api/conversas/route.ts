export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireSession } from '@/lib/require-session'
import { getGlobalRange } from '@/lib/date-range'

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
  aguardando: boolean | null
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

// Sinais lidos na fala do próprio paciente — não é o quão "gentil" a
// secretária foi, é se o paciente, na resposta dele, demonstra ter entendido
// ou ficou confuso/incomodado. É um proxy simples por palavra-chave, não uma
// análise de sentimento de verdade.
const SINAIS_COMPREENSAO = /\b(entendi|entendido|perfeito|[oó]timo|combinado|certo|obrigad\w*|consegui|show|beleza|maravilh\w*|t[aá] bom)\b/i
const SINAIS_CONFUSAO = /\b(n[aã]o entendi|n[aã]o entendo|de novo|j[aá] falei|j[aá] disse|confus\w*|p[eé]ssimo|ruim|reclama\w*|insatisfeit\w*|absurdo|inaceit[aá]vel|ningu[eé]m me respond\w*)\b/i

const GAP_MAXIMO_SEG = 6 * 60 * 60 // gaps maiores que isso viram "conversa retomada depois", não ritmo de resposta

type CacheAmostra = { data: unknown; expiraEm: number }
const AMOSTRA_CACHE_MS = 15 * 60 * 1000
const cacheAmostra = new Map<string, CacheAmostra>()

async function analisarAmostraRecente(candidatos: ItemLista[]) {
  const amostra = candidatos
    .filter((c) => (c.msgs || 0) > 0)
    .sort((a, b) => {
      const da = a.ultima_atividade ? new Date(a.ultima_atividade).getTime() : 0
      const db = b.ultima_atividade ? new Date(b.ultima_atividade).getTime() : 0
      return db - da
    })
    .slice(0, 25)

  const vazio = {
    conversasAnalisadas: 0,
    mensagensAnalisadas: 0,
    motivos: [] as { topico: string; ocorrencias: number }[],
    tempoMedioEntreMensagensSeg: null as number | null,
    compreensao: { sinaisPositivos: 0, sinaisConfusao: 0, nota: null as number | null },
  }

  if (amostra.length === 0) return vazio

  const resultados = await Promise.all(
    amostra.map((c) => supabaseAdmin.rpc('conversa_transcript', { p_contact_id: c.contact_id }))
  )

  const contagemTopicos: Record<string, number> = {}
  const gaps: number[] = []
  let sinaisPositivos = 0
  let sinaisConfusao = 0
  let mensagensAnalisadas = 0

  for (const r of resultados) {
    if (r.error || !Array.isArray(r.data)) continue

    const msgs = (r.data as { quem: string; conteudo: string; criado_em: string }[])
      .filter((m) => m.criado_em)
      .sort((a, b) => new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime())

    for (let i = 0; i < msgs.length; i++) {
      const msg = msgs[i]

      if (msg.quem === 'paciente') {
        mensagensAnalisadas++

        const topico = classificarMensagem(msg.conteudo)
        if (topico) contagemTopicos[topico] = (contagemTopicos[topico] || 0) + 1

        if (SINAIS_CONFUSAO.test(msg.conteudo || '')) sinaisConfusao++
        else if (SINAIS_COMPREENSAO.test(msg.conteudo || '')) sinaisPositivos++
      }

      if (i > 0) {
        const gapSeg = (new Date(msg.criado_em).getTime() - new Date(msgs[i - 1].criado_em).getTime()) / 1000
        if (gapSeg > 0 && gapSeg <= GAP_MAXIMO_SEG) gaps.push(gapSeg)
      }
    }
  }

  const motivos = Object.entries(contagemTopicos)
    .map(([topico, ocorrencias]) => ({ topico, ocorrencias }))
    .sort((a, b) => b.ocorrencias - a.ocorrencias)

  const tempoMedioEntreMensagensSeg =
    gaps.length > 0 ? gaps.reduce((acc, g) => acc + g, 0) / gaps.length : null

  const totalSinais = sinaisPositivos + sinaisConfusao
  const nota = totalSinais > 0 ? Math.round((sinaisPositivos / totalSinais) * 5 * 2) / 2 : null

  return {
    conversasAnalisadas: amostra.length,
    mensagensAnalisadas,
    motivos,
    tempoMedioEntreMensagensSeg,
    compreensao: { sinaisPositivos, sinaisConfusao, nota },
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireSession(req)
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(req.url)

    const periodo = searchParams.get('periodo') || 'mes-atual'
    const customStart = searchParams.get('inicio') || ''
    const customEnd = searchParams.get('fim') || ''

    const { start: inicio, end: fim } = getGlobalRange(periodo, customStart, customEnd)

    const contactId = searchParams.get('contact_id')

    // Transcript de uma conversa específica
    if (contactId) {
      const { data, error } = await supabaseAdmin.rpc('conversa_transcript', {
        p_contact_id: contactId,
      })

      if (error) throw error

      return NextResponse.json({ ok: true, transcript: data ?? [] })
    }

    const [kpisRes, listaRes] = await Promise.all([
      supabaseAdmin.rpc('conversas_kpis', {
        p_inicio: inicio.toISOString(),
        p_fim: fim.toISOString(),
      }),
      supabaseAdmin.rpc('conversas_lista', {
        p_inicio: inicio.toISOString(),
        p_fim: fim.toISOString(),
        p_limite: 200,
      }),
    ])

    if (kpisRes.error) throw kpisRes.error
    if (listaRes.error) throw listaRes.error

    const kpis = kpisRes.data ?? {}
    const lista: ItemLista[] = listaRes.data ?? []

    // agendou/vendeu no bate_papo ainda não são preenchidos na prática — a
    // taxa de agendamento fica travada em 0% mesmo quando existe atividade.
    // Em vez de mostrar isso como se fosse um resultado real, sinalizamos
    // quando não há nenhum sinal confiável.
    if (kpis.funil) {
      kpis.funil.agendamento_confiavel =
        (kpis.funil.agendados || 0) > 0 || (kpis.funil.vendidos || 0) > 0
    }

    if (kpis.operacao) {
      // conversas_tempo_resposta sempre retornava 0s (mensagens importadas
      // parecem compartilhar timestamp) — substituído pelo tempo médio entre
      // mensagens calculado na amostra abaixo.
      delete kpis.operacao.tempo_resposta_medio_seg

      // O agregado da própria RPC de kpis vinha sempre 0, mas o campo
      // "aguardando" por conversa (de conversas_lista) é real e varia —
      // recalculamos a partir dele em vez de confiar no agregado quebrado.
      kpis.operacao.aguardando_resposta = lista.filter((c) => c.aguardando === true).length
      kpis.operacao.aguardando_resposta_amostra = lista.length
    }

    kpis.comportamento = {
      por_canal: kpis.funil?.por_canal ?? [],
      por_status: calcularPorStatus(lista),
      distribuicao_mensagens: calcularDistribuicaoMensagens(lista),
      por_dia_semana: calcularPorDiaSemana(kpis.operacao?.evolucao_diaria ?? []),
    }

    const chaveCache = `${inicio.toISOString()}|${fim.toISOString()}`
    const cacheado = cacheAmostra.get(chaveCache)

    if (cacheado && cacheado.expiraEm > Date.now()) {
      kpis.amostraRecente = cacheado.data
    } else {
      const amostra = await analisarAmostraRecente(lista)
      kpis.amostraRecente = amostra
      cacheAmostra.set(chaveCache, { data: amostra, expiraEm: Date.now() + AMOSTRA_CACHE_MS })
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
