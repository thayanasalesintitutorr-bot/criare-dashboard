// Sessão assinada (HMAC-SHA256) usada tanto no middleware (Edge) quanto nas
// rotas de API (Node). Usa apenas Web Crypto (crypto.subtle/btoa/atob) para
// funcionar nos dois runtimes sem depender do módulo `crypto` do Node.

export type SessionRole = 'admin' | 'marketing'

const SESSION_DURATION_MS = 12 * 60 * 60 * 1000 // 12h

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

// Comparação em tempo constante — evita vazar, por timing, quanto de uma
// assinatura forjada bateu com a real.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

// Enquanto SESSION_SECRET não é configurado no ambiente (Vercel → Project
// Settings → Environment Variables), cai num segredo derivado da service
// role key só pra não derrubar o login em produção — mas o ideal é definir
// SESSION_SECRET com um valor aleatório próprio o quanto antes.
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

export async function createSessionToken(role: SessionRole): Promise<string> {
  const expiresAt = Date.now() + SESSION_DURATION_MS
  const payload = base64UrlEncode(encoder.encode(`${role}:${expiresAt}`))
  const signature = await sign(payload)
  return `${payload}.${signature}`
}

export async function verifySessionToken(
  token: string | undefined | null
): Promise<SessionRole | null> {
  if (!token) return null

  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null

  const expectedSignature = await sign(payload)
  if (!timingSafeEqual(signature, expectedSignature)) return null

  let decoded: string
  try {
    decoded = base64UrlDecode(payload)
  } catch {
    return null
  }

  const [role, expiresAtStr] = decoded.split(':')
  const expiresAt = Number(expiresAtStr)

  if (!expiresAt || Date.now() > expiresAt) return null
  if (role !== 'admin' && role !== 'marketing') return null

  return role
}

export const SESSION_COOKIE_NAME = 'criare-auth'
export const SESSION_MAX_AGE_SECONDS = SESSION_DURATION_MS / 1000
