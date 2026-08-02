import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/session'

export async function middleware(req: NextRequest) {
  const host = req.headers.get('host')

  // Sempre força o domínio oficial
  if (host?.includes('vercel.app')) {
    return NextResponse.redirect(
      `https://crm.criare.io${req.nextUrl.pathname}${req.nextUrl.search}`,
      308
    )
  }

  const pathname = req.nextUrl.pathname

  // Login e as próprias rotas de autenticação precisam ficar acessíveis sem
  // sessão (senão ninguém consegue logar).
  if (pathname === '/login' || pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }

  // Links curtos de campanha (/l/xxxx) são clicados pelo público a partir de
  // anúncios — são públicos por definição, não passam por login.
  if (pathname.startsWith('/l/')) {
    return NextResponse.next()
  }

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value
  const role = await verifySessionToken(token)

  if (!role) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ ok: false, error: 'Não autorizado' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Usuário Marketing só navega dentro do que é dele — mas as rotas de API
  // continuam liberadas pros dois papéis (mesmo comportamento de antes).
  if (role === 'marketing') {
    const podeAcessar =
      pathname === '/marketing' ||
      pathname === '/dispositivo' ||
      pathname.startsWith('/api/')

    if (!podeAcessar) {
      return NextResponse.redirect(new URL('/marketing', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Executa em todas as rotas,
     * exceto arquivos estáticos e _next
     */
    '/((?!_next|favicon.ico|.*\\.).*)',
  ],
}
