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
// antes de enviar — assim cada um recebe a mensagem personalizada. É o
// "fechamento" do dia, comemorativo quando a meta diária foi batida (ver
// meta_diaria_notificada).
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

// Quando a meta do dia não foi batida: avisa o resultado do dia mesmo assim
// e já adianta a meta diária recalculada pra amanhã (o que faltou hoje entra
// na conta de quanto falta dividir pelos dias úteis que restam).
function montarMensagemMetaNaoBatida(
  valorHoje: number,
  metaHoje: number,
  totalMes: number,
  metaMes: number,
  percentualMeta: number,
  nomeMes: string,
  dataFormatada: string,
  metaAmanha: number
) {
  const faltouHoje = Math.max(metaHoje - valorHoje, 0)

  return (
    `📊 *Fechamos o dia, {{NOME}}.* (${dataFormatada})\n` +
    `Faturamos *${brl(valorHoje)}* hoje — ficou *${brl(faltouHoje)}* abaixo da meta do dia (${brl(metaHoje)}).\n\n` +
    `No mês de ${nomeMes}, somamos *${brl(totalMes)}* (${percentualMeta}% da meta de ${brl(metaMes)})\n` +
    `Pra amanhã, a meta ajusta pra *${brl(metaAmanha)}/dia útil*. Vamos com tudo! 💪🚀`
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

    const [bateuHoje, valorHoje, totalMes, metaInfo, metaInfoAmanha] = await Promise.all([
      metaBatidaHoje(diaChave),
      calcularFaturamento(inicioHoje.toISOString(), inicioAmanha.toISOString()),
      calcularFaturamento(inicioMes.toISOString(), inicioAmanha.toISOString()),
      calcularMetaDinamica(hoje),
      calcularMetaDinamica(inicioAmanha),
    ])

    const { falta, totalMeta, metaDiaria: metaHoje } = metaInfo
    const percentualMeta = totalMeta > 0 ? Math.round((totalMes / totalMeta) * 100) : 0

    const mensagem = bateuHoje
      ? montarMensagemFechamento(valorHoje, totalMes, totalMeta, falta, percentualMeta, nomeMes, dataFormatada)
      : montarMensagemMetaNaoBatida(
          valorHoje,
          metaHoje,
          totalMes,
          totalMeta,
          percentualMeta,
          nomeMes,
          dataFormatada,
          metaInfoAmanha.metaDiaria
        )

    return Response.json({
      ok: true,
      enviar: true,
      bateuHoje,
      valorHoje,
      totalMes,
      ...metaInfo,
      percentualMeta,
      metaAmanha: metaInfoAmanha.metaDiaria,
      mensagem,
    })
  } catch (erro) {
    return Response.json({ ok: false, error: 'Falha ao gerar fechamento do dia', details: String(erro) }, { status: 500 })
  }
}
