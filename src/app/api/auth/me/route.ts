import { NextResponse } from 'next/server'
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/session'

export const dynamic = 'force-dynamic'

// A sessão agora é HttpOnly (o JS do navegador não consegue mais ler o
// cookie direto) — quem precisa saber o papel do usuário logado (sidebar,
// topbar, tela de dispositivo) pergunta aqui.
export async function GET(req: Request) {
  const header = req.headers.get('cookie') || ''
  const match = header
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`))

  const token = match ? decodeURIComponent(match.slice(SESSION_COOKIE_NAME.length + 1)) : undefined
  const role = await verifySessionToken(token)

  if (!role) {
    return NextResponse.json({ role: null }, { status: 401 })
  }

  return NextResponse.json({ role })
}
