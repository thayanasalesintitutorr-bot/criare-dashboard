import type { MedicoPremium } from '@/components/dashboard/medicos-premium'

/* eslint-disable @typescript-eslint/no-explicit-any */

// Junta "consulta por médico" (agenda/atendimentos, vem de kommo.amplimed) com
// "vendas por médico" (procedimentos, meta) no formato do card de Médicos.
// Ticket médio e alcance da meta usam o faturamento consolidado (consulta +
// vendas), a mesma base do card "Consolidado".
export function montarMedicosSnapshot(
  consultaPorMedico: any[] = [],
  vendasPorMedico: any[] = [],
): MedicoPremium[] {
  const mapa = new Map<string, any>()

  consultaPorMedico.forEach((m) => {
    mapa.set(m.medico, {
      ...mapa.get(m.medico),
      nome: m.medico,
      atendimentos: m.atendimentos,
      quantidadeConsulta: m.quantidadeConsulta,
      valorConsulta: m.valorConsulta,
      capacidadeAgenda: m.capacidadeAgenda,
      agendaSemDados: m.agendaSemDados,
      noShow: m.noShow,
      cancelados: m.cancelados,
      reagendados: m.reagendados,
      consultasPrimeiraVez: m.consultasPrimeiraVez,
      retornos: m.retornos,
      tempoEsperaMedio: m.tempoEsperaMedio,
      tempoAtendimentoMedio: m.tempoAtendimentoMedio,
      atendimentosAnterior: m.atendimentosAnterior,
      faturamentoConsolidadoAnterior: m.faturamentoConsolidadoAnterior,
      consultasPrimeiraVezAnterior: m.consultasPrimeiraVezAnterior,
      retornosAnterior: m.retornosAnterior,
      noShowAnterior: m.noShowAnterior,
      canceladosAnterior: m.canceladosAnterior,
      reagendadosAnterior: m.reagendadosAnterior,
    })
  })

  vendasPorMedico.forEach((m) => {
    const procedimentos = (m.produtos || []).reduce((total: number, p: any) => total + (p.qtd || 0), 0)

    mapa.set(m.nome, {
      ...mapa.get(m.nome),
      nome: m.nome,
      valorVendas: m.valor,
      meta: m.meta,
      procedimentos,
      propostasEnviadas: m.propostasEnviadas,
      vendasFechadas: m.vendasFechadas,
      taxaConversao: m.taxaConversao,
    })
  })

  return Array.from(mapa.values()).map((m) => {
    const faturamentoConsolidado = (m.valorConsulta || 0) + (m.valorVendas || 0)
    const quantidadeConsolidada = (m.quantidadeConsulta || 0) + (m.procedimentos || 0)

    return {
      ...m,
      faturamentoConsolidado,
      ticketConsulta:
        quantidadeConsolidada > 0 ? faturamentoConsolidado / quantidadeConsolidada : 0,
      percentualMeta: (m.meta || 0) > 0 ? (faturamentoConsolidado / (m.meta || 0)) * 100 : 0,
    }
  })
}
