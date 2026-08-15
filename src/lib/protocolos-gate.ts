// Segunda camada de senha, só pra página de Protocolos — mesmo já logado no
// painel (sessão normal via lib/session.ts), essa página pede uma senha
// adicional antes de mostrar qualquer dado de paciente. Implementação
// própria (HMAC via Web Crypto, mesmo esquema de lib/session.ts) só pra não
// mexer no arquivo de sessão principal, que já está em produção.

const GATE_DURATION_MS = 12 * 60 * 60 * 1000 // 12h, igual à sessão principal

const encoder = new TextEncoder()

function base64UrlEncode(bytes: Uint8Array): string {
  let str = ''
  for (const b of bytes) str += String.fromCharCode(b)
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(str: string): string {
  const normalized = str.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  return atob(padded)
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

function getSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    `${process.env.SUPABASE_SERVICE_ROLE_KEY || 'criare-dev-fallback-secret'}::criare-session`
  )
}

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return base64UrlEncode(new Uint8Array(signature))
}

export async function createProtocoloGateToken(): Promise<string> {
  const expiresAt = Date.now() + GATE_DURATION_MS
  const payload = base64UrlEncode(encoder.encode(`protocolos-gate:${expiresAt}`))
  const signature = await sign(payload)
  return `${payload}.${signature}`
}

export async function verifyProtocoloGateToken(
  token: string | undefined | null
): Promise<boolean> {
  if (!token) return false

  const [payload, signature] = token.split('.')
  if (!payload || !signature) return false

  const expectedSignature = await sign(payload)
  if (!timingSafeEqual(signature, expectedSignature)) return false

  let decoded: string
  try {
    decoded = base64UrlDecode(payload)
  } catch {
    return false
  }

  const [marker, expiresAtStr] = decoded.split(':')
  const expiresAt = Number(expiresAtStr)

  if (marker !== 'protocolos-gate') return false
  if (!expiresAt || Date.now() > expiresAt) return false

  return true
}

export const PROTOCOLO_GATE_COOKIE_NAME = 'criare-protocolos-gate'
export const PROTOCOLO_GATE_MAX_AGE_SECONDS = GATE_DURATION_MS / 1000
