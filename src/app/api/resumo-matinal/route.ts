export const dynamic = 'force-dynamic'

import { saudacao } from '@/lib/slack'
import { agoraBrasilia } from '@/lib/date-range'
import { calcularFaturamento, calcularMetaDinamica } from '@/lib/meta-dinamica'

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ ok: false, error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const hoje = agoraBrasilia()
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    const amanha = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1)
    const nomeMes = hoje.toLocaleDateString('pt-BR', { month: 'long' })
    const dataFormatada = hoje.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

    const [totalMes, metaInfo] = await Promise.all([
      calcularFaturamento(inicioMes.toISOString(), amanha.toISOString()),
      calcularMetaDinamica(hoje),
    ])

    const { falta, totalMeta, diasUteisRestantes, diasUteisPassados } = metaInfo
    const percentualMeta = totalMeta > 0 ? Math.round((totalMes / totalMeta) * 100) : 0

    // Ritmo médio por dia útil desde o início do mês, projetado pros dias
    // úteis que faltam até o fim dele (18/12 em dezembro) — mesmo raciocínio
    // do card Perspectiva de venda.
    const ritmo = diasUteisPassados > 0 ? totalMes / diasUteisPassados : 0
    const projecaoFechamento = ritmo * (diasUteisPassados + diasUteisRestantes)
    const diffProjecao = projecaoFechamento - totalMeta
    const mostrarProjecao = diasUteisPassados > 0 && diasUteisRestantes > 0

    const linhaProjecao = mostrarProjecao
      ? `\nNo ritmo atual (${brl(ritmo)}/dia útil), ${nomeMes} deve fechar em *${brl(projecaoFechamento)}* — ${
          diffProjecao >= 0 ? `${brl(diffProjecao)} acima da meta` : `${brl(Math.abs(diffProjecao))} abaixo da meta`
        }.`
      : ''

    // {{NOME}} é substituído pelo n8n pelo primeiro nome de cada pessoa do
    // Slack antes de enviar — assim cada um recebe a mensagem personalizada.
    const mensagem =
      `☀️ *${saudacao(hoje)}, {{NOME}}!* (${dataFormatada})\n` +
      `Faturado em ${nomeMes} até agora: *${brl(totalMes)}*\n\n` +
      `🎯 *Meta de ${nomeMes}: ${brl(totalMeta)}* (${percentualMeta}%)\n` +
      (falta > 0
        ? `Falta *${brl(falta)}* para a meta — ${brl(metaInfo.metaDiaria)}/dia útil nos ${diasUteisRestantes} dias úteis restantes`
        : `🎉 Meta de ${nomeMes} já batida!`) +
      linhaProjecao

    return Response.json({ ok: true, totalMes, ...metaInfo, percentualMeta, mensagem })
  } catch (erro) {
    return Response.json({ ok: false, error: 'Falha ao gerar resumo matinal', details: String(erro) }, { status: 500 })
  }
}
