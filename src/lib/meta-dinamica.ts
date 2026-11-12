import { chaveData, diasDoMes } from './dias-uteis'

const SUPABASE_URL = 'https://afxgfgvdmgxcvamginjc.supabase.co'

export function toNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return 0
  if (typeof value === 'number') return value

  const raw = String(value).trim()
  if (!raw) return 0

  const normalized = raw.replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
  const parsed = Number(normalized)

  return Number.isFinite(parsed) ? parsed : 0
}

function supabaseHeaders() {
  return {
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
    'Accept-Profile': 'kommo',
  }
}

type LeadResumo = { venda?: number | string | null; faturamento?: number | string | null }

async function buscarLeadsFechados(pipelineId: string, status: string, inicio: string, fim: string): Promise<LeadResumo[]> {
  const url =
    `${SUPABASE_URL}/rest/v1/leads?pipeline_id=eq.${pipelineId}&status_id=eq.${encodeURIComponent(status)}` +
    `&closed_at=gte.${inicio}&closed_at=lt.${fim}&is_deleted=is.false&select=venda,faturamento`

  const response = await fetch(url, { headers: supabaseHeaders() })
  if (!response.ok) throw new Error(await response.text())

  return response.json()
}

// Mesmo critério do consolidadoValorVendas em src/app/api/test/route.ts: soma
// faturamento de Consulta (GANHOU) + Reabord (FECHADO (GANHO)) + venda de
// Vendas (VENDA GANHA, venda > 0).
export async function calcularFaturamento(inicio: string, fim: string) {
  const [consulta, reabord, vendas] = await Promise.all([
    buscarLeadsFechados('CONSULTA', 'GANHOU', inicio, fim),
    buscarLeadsFechados('REABORD', 'FECHADO (GANHO)', inicio, fim),
    buscarLeadsFechados('VENDAS', 'Venda ganha', inicio, fim),
  ])

  const vendasValidas = vendas.filter((l) => toNumber(l.venda) > 0)
  const valorConsulta = consulta.reduce((acc, l) => acc + toNumber(l.faturamento), 0)
  const valorReabord = reabord.reduce((acc, l) => acc + toNumber(l.faturamento), 0)
  const valorVendas = vendasValidas.reduce((acc, l) => acc + toNumber(l.venda), 0)

  return valorConsulta + valorReabord + valorVendas
}

// Meta mensal "cheia" de cada mês — usada só como referência informativa
// (ex: "faturado em novembro" no resumo matinal). A meta que vale de verdade
// pra bater o dia é a combinada (ver calcularMetaDinamica).
export function getMetaMensal(ano: number, mes: number) {
  if (ano === 2026 && mes === 10) return 1000000 // novembro
  if (ano === 2026 && mes === 11) return 500000 // dezembro

  if (ano > 2026 || (ano === 2026 && mes >= 8)) return 1000000

  return 750000
}

// Campanha "Novembro + Dezembro" (reunião de 06/11 e ajuste de 12/11/2026):
// novembro tem meta própria de R$1.000.000, cobrada normalmente ao longo do
// mês. Dezembro começa com R$500.000 — e só quando novembro FECHA (vira
// dezembro) essa meta é ajustada pelo resultado real de novembro: o que
// faltou (ou passou) da meta de R$1.000.000 soma (ou desconta) na meta de
// dezembro. Ou seja, dezembro = R$500.000 + (R$1.000.000 − faturado em
// novembro), nunca abaixo de zero. O valor por dia útil é recalculado todo
// dia dentro do mês corrente (sem misturar com o outro mês).
const INICIO_CAMPANHA = new Date(2026, 10, 1) // 01/11/2026
const FIM_NOVEMBRO = new Date(2026, 10, 30) // 30/11/2026
const INICIO_DEZEMBRO = new Date(2026, 11, 1) // 01/12/2026
const FIM_CAMPANHA = new Date(2026, 11, 18) // 18/12/2026 (último dia trabalhado)
const META_NOVEMBRO = 1000000
const META_DEZEMBRO_BASE = 500000

function dentroDaCampanha(hoje: Date) {
  return hoje >= INICIO_CAMPANHA && hoje <= FIM_CAMPANHA
}

function diasUteisNoIntervalo(refMes: Date, hoje: Date, inicio: Date, fim: Date) {
  const hojeChave = chaveData(hoje)
  const inicioChave = chaveData(inicio)
  const fimChave = chaveData(fim)

  const dias = diasDoMes(refMes).filter((d) => {
    const chave = chaveData(d.data)
    return chave >= inicioChave && chave <= fimChave
  })

  return {
    restantes: dias.filter((d) => d.util && chaveData(d.data) >= hojeChave).length,
    passados: dias.filter((d) => d.util && chaveData(d.data) < hojeChave).length,
  }
}

export async function calcularMetaDinamica(hoje: Date) {
  if (!dentroDaCampanha(hoje)) {
    // Fora da janela nov/dez-2026 (passado ou futuro) — cai na meta simples
    // do mês, sem o ajuste de rollover.
    const metaMensal = getMetaMensal(hoje.getFullYear(), hoje.getMonth())
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
    const diasUteisMes = diasDoMes(hoje).filter((d) => d.util).length
    return {
      metaDiaria: diasUteisMes > 0 ? metaMensal / diasUteisMes : 0,
      realizado: 0,
      falta: metaMensal,
      diasUteisRestantes: diasUteisMes,
      diasUteisPassados: 0,
      totalMeta: metaMensal,
      fimPeriodo: fimMes,
      inicioPeriodo: new Date(hoje.getFullYear(), hoje.getMonth(), 1),
    }
  }

  const amanha = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1)
  const emNovembro = hoje <= FIM_NOVEMBRO

  if (emNovembro) {
    const realizado = await calcularFaturamento(INICIO_CAMPANHA.toISOString(), amanha.toISOString())
    const falta = Math.max(META_NOVEMBRO - realizado, 0)
    const { restantes: diasUteisRestantes, passados: diasUteisPassados } = diasUteisNoIntervalo(
      INICIO_CAMPANHA,
      hoje,
      INICIO_CAMPANHA,
      FIM_NOVEMBRO
    )

    return {
      metaDiaria: diasUteisRestantes > 0 ? falta / diasUteisRestantes : falta,
      realizado,
      falta,
      diasUteisRestantes,
      diasUteisPassados,
      totalMeta: META_NOVEMBRO,
      fimPeriodo: FIM_NOVEMBRO,
      inicioPeriodo: INICIO_CAMPANHA,
    }
  }

  // Dezembro: novembro já fechou — pega o resultado final dele pra ajustar
  // a meta de dezembro (sobra ou falta de novembro passa pra frente).
  const realizadoNovembro = await calcularFaturamento(INICIO_CAMPANHA.toISOString(), INICIO_DEZEMBRO.toISOString())
  const metaDezembro = Math.max(META_DEZEMBRO_BASE + (META_NOVEMBRO - realizadoNovembro), 0)

  const realizado = await calcularFaturamento(INICIO_DEZEMBRO.toISOString(), amanha.toISOString())
  const falta = Math.max(metaDezembro - realizado, 0)
  const { restantes: diasUteisRestantes, passados: diasUteisPassados } = diasUteisNoIntervalo(
    INICIO_DEZEMBRO,
    hoje,
    INICIO_DEZEMBRO,
    FIM_CAMPANHA
  )

  return {
    metaDiaria: diasUteisRestantes > 0 ? falta / diasUteisRestantes : falta,
    realizado,
    falta,
    diasUteisRestantes,
    diasUteisPassados,
    totalMeta: metaDezembro,
    fimPeriodo: FIM_CAMPANHA,
    inicioPeriodo: INICIO_DEZEMBRO,
  }
}
