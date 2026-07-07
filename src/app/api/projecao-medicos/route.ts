export const dynamic = 'force-dynamic'

import { JWT } from 'google-auth-library'
import * as XLSX from 'xlsx'

const OKR_FILE_ID = '18CuXMpejBSrXhzGLHJvTiFxboJOC3nhO'
const CACHE_MS = 20000

type ProjecaoMetricas = {
  seguidores: number
  alcance: number
  engajamento: number
  taxaEngaj: number
  views: number
  interacoes: number
  posts: number
  reels: number
  carrosseis: number
  storiesSemana: number
}

type ProjecaoMes = {
  mes: string
  ordem: number
  meta: ProjecaoMetricas
  atual: Partial<ProjecaoMetricas> | null
}

type MedicoChave = 'rodolpho' | 'breno' | 'claudia'

const MEDICOS: Record<MedicoChave, { nome: string; sheetName: string }> = {
  rodolpho: { nome: 'Dr. Rodolpho', sheetName: '📊 Projeção - Dr. Rodolpho' },
  breno: { nome: 'Dr. Breno', sheetName: '📊 Projeção - Dr. Breno' },
  claudia: { nome: 'Dra. Claudia', sheetName: '📊 Projeção - Dra. Claudia' },
}

const ORDEM_MES: Record<string, number> = {
  Julho: 7,
  Agosto: 8,
  Setembro: 9,
  Outubro: 10,
  Novembro: 11,
}

const COLUNA_PARA_CHAVE: Record<string, keyof ProjecaoMetricas> = {
  'Seguidores': 'seguidores',
  'Alcance/mês': 'alcance',
  'Engajamento': 'engajamento',
  'Taxa Engaj.': 'taxaEngaj',
  'Views/mês': 'views',
  'Interações': 'interacoes',
  Posts: 'posts',
  Reels: 'reels',
  'Carrosséis': 'carrosseis',
  'Stories/sem': 'storiesSemana',
}

type ProjecaoPorMedico = Record<MedicoChave, { nome: string; meses: ProjecaoMes[] }>

let cache: { data: ProjecaoPorMedico; expiraEm: number } | null = null

async function baixarPlanilha(): Promise<ArrayBuffer> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const chavePrivada = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY

  if (!email || !chavePrivada) {
    throw new Error('Credenciais do Google Service Account não configuradas')
  }

  const client = new JWT({
    email,
    key: chavePrivada.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  })

  const { token } = await client.getAccessToken()

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${OKR_FILE_ID}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (!response.ok) {
    throw new Error(`Falha ao baixar planilha: ${response.status}`)
  }

  return response.arrayBuffer()
}

function extrairMedico(workbook: XLSX.WorkBook, sheetName: string): ProjecaoMes[] {
  const sheet = workbook.Sheets[sheetName]
  if (!sheet) return []

  const linhas = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null }) as unknown[][]

  const headerIndex = linhas.findIndex((linha) => linha[0] === 'Mês')
  if (headerIndex === -1) return []

  const header = linhas[headerIndex]
  const colunaChave = new Map<number, keyof ProjecaoMetricas>()
  header.forEach((nomeColuna, indice) => {
    const chave = COLUNA_PARA_CHAVE[String(nomeColuna).trim()]
    if (chave) colunaChave.set(indice, chave)
  })

  const meses = new Map<string, ProjecaoMes>()
  let mesAtual: string | null = null

  for (let i = headerIndex + 1; i < linhas.length; i++) {
    const linha = linhas[i]
    if (!linha) continue

    const nomeMes = linha[0] ? String(linha[0]).trim() : null
    if (nomeMes) mesAtual = nomeMes

    const tipo = linha[1] ? String(linha[1]).trim() : null
    if (!mesAtual || !ORDEM_MES[mesAtual]) continue
    if (tipo !== 'Meta' && tipo !== 'Atual') continue

    if (!meses.has(mesAtual)) {
      meses.set(mesAtual, {
        mes: mesAtual,
        ordem: ORDEM_MES[mesAtual],
        meta: {} as ProjecaoMetricas,
        atual: null,
      })
    }

    const registro = meses.get(mesAtual)!
    const valores: Partial<ProjecaoMetricas> = {}

    colunaChave.forEach((chave, indice) => {
      const bruto = linha[indice]
      if (bruto === null || bruto === undefined || bruto === '') return
      const numero = Number(bruto)
      if (Number.isNaN(numero)) return
      valores[chave] = chave === 'taxaEngaj' ? Math.round(numero * 100 * 100) / 100 : Math.round(numero)
    })

    if (tipo === 'Meta') {
      registro.meta = valores as ProjecaoMetricas
    } else {
      registro.atual = Object.keys(valores).length > 0 ? valores : null
    }
  }

  return Array.from(meses.values()).sort((a, b) => a.ordem - b.ordem)
}

async function montarProjecao(): Promise<ProjecaoPorMedico> {
  const buffer = await baixarPlanilha()
  const workbook = XLSX.read(buffer, { type: 'buffer' })

  const resultado = {} as ProjecaoPorMedico

  ;(Object.keys(MEDICOS) as MedicoChave[]).forEach((chave) => {
    const { nome, sheetName } = MEDICOS[chave]
    resultado[chave] = { nome, meses: extrairMedico(workbook, sheetName) }
  })

  return resultado
}

export async function GET() {
  const agora = Date.now()

  if (cache && cache.expiraEm > agora) {
    return Response.json({ ok: true, medicos: cache.data })
  }

  try {
    const data = await montarProjecao()
    cache = { data, expiraEm: agora + CACHE_MS }
    return Response.json({ ok: true, medicos: data })
  } catch (erro) {
    if (cache) {
      return Response.json({ ok: true, medicos: cache.data, aviso: 'Usando última leitura em cache' })
    }

    return Response.json(
      { ok: false, error: 'Falha ao ler a planilha de projeção', details: String(erro) },
      { status: 500 }
    )
  }
}
