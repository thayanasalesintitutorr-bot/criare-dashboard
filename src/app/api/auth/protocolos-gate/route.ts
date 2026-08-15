import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/require-session'
import { requireProtocoloGate } from '@/lib/require-protocolo-gate'
import {
  createProtocoloGateToken,
  PROTOCOLO_GATE_COOKIE_NAME,
  PROTOCOLO_GATE_MAX_AGE_SECONDS,
} from '@/lib/protocolos-gate'

export const dynamic = 'force-dynamic'

// Mesmo esquema de rate limit em memória do login principal.
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

// Fallback só pra não travar antes de PROTOCOLOS_GATE_PASSWORD ser
// configurada no Vercel — troque assim que possível.
function getSenhaEsperada(): string {
  return process.env.PROTOCOLOS_GATE_PASSWORD || 'Protocolos@2026#'
}

// GET: a página usa isso pra saber se já pode pular a tela de senha.
export async function GET(req: Request) {
  const auth = await requireSession(req)
  if (!auth.ok) return auth.response

  const gate = await requireProtocoloGate(req)
  return NextResponse.json({ ok: true, unlocked: gate.ok })
}

export async function POST(req: Request) {
  const auth = await requireSession(req)
  if (!auth.ok) return auth.response

  const ip = getClientIp(req)

  let body: { password?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Requisição inválida' }, { status: 400 })
  }

  const senha = String(body.password || '').trim()

  if (estaBloqueado(ip)) {
    return NextResponse.json(
      { ok: false, error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' },
      { status: 429 }
    )
  }

  if (!senha || senha !== getSenhaEsperada()) {
    registrarFalha(ip)
    return NextResponse.json({ ok: false, error: 'Senha incorreta' }, { status: 401 })
  }

  const token = await createProtocoloGateToken()
  const res = NextResponse.json({ ok: true })

  res.cookies.set(PROTOCOLO_GATE_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: PROTOCOLO_GATE_MAX_AGE_SECONDS,
  })

  return res
}
