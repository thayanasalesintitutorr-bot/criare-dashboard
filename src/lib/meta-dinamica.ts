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

// Campanha "Novembro + Dezembro" da reunião de 06/11/2026: R$1,5 milhão
// combinado nos dois meses (R$1.000.000 + R$500.000). Em vez de uma meta
// fixa por mês, o valor por dia útil é recalculado todo dia: pega tudo que
// já foi faturado desde 01/11 e divide o que falta pros R$1,5 milhão pelos
// dias úteis que restam até 31/12 — se as vendas atrasam, o valor diário
// sobe; se adiantam, desce.
const INICIO_CAMPANHA = new Date(2026, 10, 1) // 01/11/2026
const FIM_CAMPANHA = new Date(2026, 11, 31) // 31/12/2026
const META_CAMPANHA = 1500000

function dentroDaCampanha(hoje: Date) {
  return hoje >= INICIO_CAMPANHA && hoje <= FIM_CAMPANHA
}

function diasDaCampanha() {
  return [...diasDoMes(INICIO_CAMPANHA), ...diasDoMes(new Date(2026, 11, 1))]
}

function diasUteisRestantesNaCampanha(hoje: Date) {
  const hojeChave = chaveData(hoje)
  return diasDaCampanha().filter((d) => d.util && chaveData(d.data) >= hojeChave && chaveData(d.data) <= chaveData(FIM_CAMPANHA))
    .length
}

function diasUteisPassadosNaCampanha(hoje: Date) {
  const hojeChave = chaveData(hoje)
  return diasDaCampanha().filter((d) => d.util && chaveData(d.data) < hojeChave).length
}

export async function calcularMetaDinamica(hoje: Date) {
  if (!dentroDaCampanha(hoje)) {
    // Fora da janela nov/dez-2026 (passado ou futuro) — cai na meta simples
    // do mês, sem o "pote" combinado.
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
  const realizado = await calcularFaturamento(INICIO_CAMPANHA.toISOString(), amanha.toISOString())
  const falta = Math.max(META_CAMPANHA - realizado, 0)
  const diasUteisRestantes = diasUteisRestantesNaCampanha(hoje)
  const diasUteisPassados = diasUteisPassadosNaCampanha(hoje)

  return {
    metaDiaria: diasUteisRestantes > 0 ? falta / diasUteisRestantes : falta,
    realizado,
    falta,
    diasUteisRestantes,
    diasUteisPassados,
    totalMeta: META_CAMPANHA,
    fimPeriodo: FIM_CAMPANHA,
    inicioPeriodo: INICIO_CAMPANHA,
  }
}
