export const dynamic = 'force-dynamic'

import { agoraBrasilia } from '@/lib/date-range'
import { calcularFaturamento, calcularMetaDinamica } from '@/lib/meta-dinamica'

const SUPABASE_URL = 'https://afxgfgvdmgxcvamginjc.supabase.co'

function supabaseHeaders() {
  return {
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
    'Accept-Profile': 'kommo',
  }
}

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

async function metaBatidaHoje(diaChave: string) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/meta_diaria_notificada?dia=eq.${diaChave}&select=dia`, {
    headers: supabaseHeaders(),
  })
  if (!resp.ok) throw new Error(await resp.text())
  const rows = await resp.json()
  return rows.length > 0
}

// {{NOME}} é substituído pelo n8n pelo primeiro nome de cada pessoa do Slack
// antes de enviar — assim cada um recebe a mensagem personalizada. Só manda
// essa mensagem nos dias em que a meta diária foi batida (ver
// meta_diaria_notificada) — é o "fechamento" comemorativo do dia, não um
// resumo de todo dia.
function montarMensagemFechamento(
  valorHoje: number,
  totalMes: number,
  metaMes: number,
  falta: number,
  percentualMeta: number,
  nomeMes: string,
  dataFormatada: string
) {
  return (
    `🌟🎉 *Fechamos o dia, {{NOME}}!* (${dataFormatada})\n` +
    `Hoje foi MARAVILHOSO — faturamos *${brl(valorHoje)}* e batemos a meta do dia! 🏆\n\n` +
    `No mês de ${nomeMes}, já somamos *${brl(totalMes)}* (${percentualMeta}% da meta de ${brl(metaMes)})\n` +
    (falta > 0
      ? `Faltam *${brl(falta)}* pra bater a meta do mês — tamo chegando! 🚀`
      : `🎉🎉 E a meta do mês TAMBÉM já foi batida! Mandou muito bem, time! 🏆🥳`) +
    `\n\nParabéns pelo esforço de hoje, bora descansar e voltar com tudo amanhã! 🙌✨`
  )
}

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ ok: false, error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const hoje = agoraBrasilia()
    const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
    const inicioAmanha = new Date(inicioHoje)
    inicioAmanha.setDate(inicioAmanha.getDate() + 1)
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    const diaChave = `${inicioHoje.getFullYear()}-${String(inicioHoje.getMonth() + 1).padStart(2, '0')}-${String(inicioHoje.getDate()).padStart(2, '0')}`
    const dataFormatada = hoje.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    const nomeMes = hoje.toLocaleDateString('pt-BR', { month: 'long' })

    const bateuHoje = await metaBatidaHoje(diaChave)
    if (!bateuHoje) {
      return Response.json({ ok: true, enviar: false })
    }

    const [valorHoje, totalMes, metaInfo] = await Promise.all([
      calcularFaturamento(inicioHoje.toISOString(), inicioAmanha.toISOString()),
      calcularFaturamento(inicioMes.toISOString(), inicioAmanha.toISOString()),
      calcularMetaDinamica(hoje),
    ])

    const { falta, totalMeta } = metaInfo
    const percentualMeta = totalMeta > 0 ? Math.round((totalMes / totalMeta) * 100) : 0

    const mensagem = montarMensagemFechamento(valorHoje, totalMes, totalMeta, falta, percentualMeta, nomeMes, dataFormatada)

    return Response.json({ ok: true, enviar: true, valorHoje, totalMes, ...metaInfo, percentualMeta, mensagem })
  } catch (erro) {
    return Response.json({ ok: false, error: 'Falha ao gerar fechamento do dia', details: String(erro) }, { status: 500 })
  }
}
