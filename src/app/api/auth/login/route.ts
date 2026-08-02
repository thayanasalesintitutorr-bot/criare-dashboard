import { NextResponse } from 'next/server'
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  type SessionRole,
} from '@/lib/session'

export const dynamic = 'force-dynamic'

// Rate limit em memória — funciona enquanto a instância serverless estiver
// "quente" (suficiente pra travar um brute force automatizado na hora). Não
// sobrevive a cold start nem é compartilhado entre regiões; se quiser algo
// que resista a isso, dá pra mover essa contagem pra uma tabela no Supabase.
const MAX_TENTATIVAS = 5
const JANELA_MS = 10 * 60 * 1000

const tentativas = new Map<string, { count: number; resetAt: number }>()

function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'desconhecido'
}

function estaBloqueado(chave: string): boolean {
  const entrada = tentativas.get(chave)
  if (!entrada) return false
  if (Date.now() > entrada.resetAt) {
    tentativas.delete(chave)
    return false
  }
  return entrada.count >= MAX_TENTATIVAS
}

function registrarFalha(chave: string) {
  const agora = Date.now()
  const entrada = tentativas.get(chave)

  if (!entrada || agora > entrada.resetAt) {
    tentativas.set(chave, { count: 1, resetAt: agora + JANELA_MS })
    return
  }

  entrada.count += 1
}

function limparTentativas(chave: string) {
  tentativas.delete(chave)
}

type Conta = { email: string; senha: string; role: SessionRole }

// Fallback pros valores atuais só pra não derrubar o login em produção antes
// de configurar as env vars no Vercel. Assim que ADMIN_PASSWORD/
// MARKETING_PASSWORD estiverem definidas lá, as credenciais somem do código.
function getContas(): Conta[] {
  return [
    {
      email: (process.env.ADMIN_EMAIL || 'altuusclinic@gmail.com').toLowerCase(),
      senha: process.env.ADMIN_PASSWORD || 'Altuus@2026#',
      role: 'admin',
    },
    {
      email: (process.env.MARKETING_EMAIL || 'brunofontanella.ads@gmail.com').toLowerCase(),
      senha: process.env.MARKETING_PASSWORD || 'Criare@Mkt9274#',
      role: 'marketing',
    },
  ]
}

export async function POST(req: Request) {
  const ip = getClientIp(req)

  let body: { email?: string; password?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }

  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '').trim()

  if (!email || !password) {
    return NextResponse.json({ error: 'E-mail ou senha incorretos' }, { status: 400 })
  }

  const chaveConta = `${ip}:${email}`

  if (estaBloqueado(chaveConta) || estaBloqueado(ip)) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' },
      { status: 429 }
    )
  }

  const conta = getContas().find((c) => c.email === email && c.senha === password)

  if (!conta) {
    registrarFalha(chaveConta)
    registrarFalha(ip)
    // Mensagem genérica de propósito — não diz se foi o e-mail ou a senha
    // que errou, pra não dar pra descobrir por tentativa quais e-mails têm
    // conta aqui.
    return NextResponse.json({ error: 'E-mail ou senha incorretos' }, { status: 401 })
  }

  limparTentativas(chaveConta)
  limparTentativas(ip)

  const token = await createSessionToken(conta.role)

  const res = NextResponse.json({ ok: true, role: conta.role })

  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  })

  return res
}
