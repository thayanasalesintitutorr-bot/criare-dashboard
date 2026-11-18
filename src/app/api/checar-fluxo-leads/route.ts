export const dynamic = 'force-dynamic'

import { agoraBrasilia } from '@/lib/date-range'

const SUPABASE_URL = 'https://afxgfgvdmgxcvamginjc.supabase.co'

// Quanto tempo (em minutos de horário comercial) sem nenhum lead novo de
// entrada até considerar que o Criare "parou de receber" e avisar. Olhando
// os últimos 30 dias, o maior intervalo normal entre leads em horário
// comercial foi ~3h08 — 180min cobre isso com uma margem pequena.
const LIMIAR_MINUTOS = 180

// Incremento máximo (minutos) que uma única checagem pode somar ao
// acumulado de "tempo sem lead". Sem esse teto, o primeiro check depois de
// uma virada de dia ou fim de semana (quando o cron nem roda) somaria o
// intervalo inteiro de uma vez e disparia um alarme falso toda segunda de
// manhã — limitando a cada checagem, o "relógio" só avança de verdade
// enquanto os checks de 10 em 10 min estão realmente rodando.
const INCREMENTO_MAXIMO_MINUTOS = 15

function supabaseHeaders() {
  return {
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
    'Accept-Profile': 'kommo',
  }
}

function isHorarioComercial(hoje: Date) {
  const dia = hoje.getDay()
  const hora = hoje.getHours()
  return dia >= 1 && dia <= 5 && hora >= 8 && hora < 20
}

function formatarDuracao(minutos: number) {
  const totalMin = Math.round(minutos)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h === 0) return `${m}min`
  return `${h}h${m > 0 ? `${m}min` : ''}`
}

async function buscarUltimoLead(): Promise<Date | null> {
  const resp = await fetch(
    `${SUPABASE_URL}/rest/v1/leads?pipeline_id=eq.CONSULTA&select=created_at&order=created_at.desc&limit=1`,
    { headers: supabaseHeaders() }
  )
  if (!resp.ok) throw new Error(await resp.text())
  const rows = await resp.json()
  const valor = rows[0]?.created_at
  return valor ? new Date(String(valor).replace(' ', 'T')) : null
}

type StatusFluxo = {
  ultimo_lead_visto: string | null
  ultima_checagem_em: string | null
  minutos_sem_lead: number
  parado: boolean
}

async function buscarStatus(): Promise<StatusFluxo | null> {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/lead_flow_status?id=eq.1&select=*`, {
    headers: supabaseHeaders(),
  })
  if (!resp.ok) throw new Error(await resp.text())
  const rows = await resp.json()
  return rows[0] || null
}

async function salvarStatus(status: StatusFluxo) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/lead_flow_status?on_conflict=id`, {
    method: 'POST',
    headers: {
      ...supabaseHeaders(),
      'Content-Profile': 'kommo',
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify([{ id: 1, ...status }]),
  })
  if (!resp.ok) throw new Error(await resp.text())
}

// {{NOME}} é substituído pelo n8n pelo primeiro nome de cada pessoa do
// Slack antes de enviar.
function montarMensagemParou(ultimoLead: Date, minutosSemLead: number) {
  const horaUltimoLead = ultimoLead.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  return (
    `🚨 *Atenção, {{NOME}}!*\n` +
    `O Criare não recebe nenhum lead novo de entrada (Consulta) há *${formatarDuracao(minutosSemLead)}* ` +
    `(o último entrou às ${horaUltimoLead}).\n\n` +
    `Pode ser a integração com o Kommo fora do ar — vale checar. 🔧`
  )
}

function montarMensagemNormalizou(minutosParado: number) {
  return (
    `✅ *Voltou ao normal, {{NOME}}!*\n` +
    `O Criare voltou a receber leads de entrada — ficou sem nenhum lead novo por *${formatarDuracao(minutosParado)}*.`
  )
}

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ ok: false, error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const agora = agoraBrasilia()

    if (!isHorarioComercial(agora)) {
      return Response.json({ ok: true, enviar: false, motivo: 'fora do horário comercial' })
    }

    const [ultimoLead, status] = await Promise.all([buscarUltimoLead(), buscarStatus()])

    if (!ultimoLead) {
      return Response.json({ ok: true, enviar: false, motivo: 'nenhum lead encontrado' })
    }

    // Primeira execução (tabela ainda vazia): só grava o estado atual, sem
    // avaliar nada ainda — não tem "checagem anterior" pra comparar.
    if (!status || !status.ultimo_lead_visto || !status.ultima_checagem_em) {
      await salvarStatus({
        ultimo_lead_visto: ultimoLead.toISOString(),
        ultima_checagem_em: agora.toISOString(),
        minutos_sem_lead: 0,
        parado: false,
      })
      return Response.json({ ok: true, enviar: false, motivo: 'primeira checagem' })
    }

    const chegouLeadNovo = ultimoLead.getTime() > new Date(status.ultimo_lead_visto).getTime()

    if (chegouLeadNovo) {
      const estavaParado = status.parado
      const minutosQueFicouParado = status.minutos_sem_lead

      await salvarStatus({
        ultimo_lead_visto: ultimoLead.toISOString(),
        ultima_checagem_em: agora.toISOString(),
        minutos_sem_lead: 0,
        parado: false,
      })

      if (!estavaParado) {
        return Response.json({ ok: true, enviar: false, motivo: 'fluxo normal' })
      }

      return Response.json({
        ok: true,
        enviar: true,
        tipo: 'normalizou',
        minutosQueFicouParado,
        mensagem: montarMensagemNormalizou(minutosQueFicouParado),
      })
    }

    const incremento = Math.min(
      (agora.getTime() - new Date(status.ultima_checagem_em).getTime()) / 60000,
      INCREMENTO_MAXIMO_MINUTOS
    )
    const minutosSemLead = status.minutos_sem_lead + Math.max(incremento, 0)
    const jaEstavaParado = status.parado
    const estaParadoAgora = minutosSemLead >= LIMIAR_MINUTOS

    await salvarStatus({
      ultimo_lead_visto: status.ultimo_lead_visto,
      ultima_checagem_em: agora.toISOString(),
      minutos_sem_lead: minutosSemLead,
      parado: estaParadoAgora || jaEstavaParado,
    })

    if (estaParadoAgora && !jaEstavaParado) {
      return Response.json({
        ok: true,
        enviar: true,
        tipo: 'parou',
        minutosSemLead,
        mensagem: montarMensagemParou(ultimoLead, minutosSemLead),
      })
    }

    return Response.json({ ok: true, enviar: false, minutosSemLead })
  } catch (erro) {
    return Response.json({ ok: false, error: 'Falha ao checar fluxo de leads', details: String(erro) }, { status: 500 })
  }
}
