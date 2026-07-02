import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const host = req.headers.get('host')

  // Sempre força o domínio oficial
  if (host?.includes('vercel.app')) {
    return NextResponse.redirect(
      `https://crm.criare.io${req.nextUrl.pathname}${req.nextUrl.search}`,
      308
    )
  }

  // Permite acessar a página de login
  if (req.nextUrl.pathname === '/login') {
    return NextResponse.next()
  }

 // Verifica autenticação
const session = req.cookies.get('criare-auth')?.value

if (!session) {
  return NextResponse.redirect(new URL('/login', req.url))
}

// Usuário Marketing
if (session === 'marketing') {
  if (req.nextUrl.pathname !== '/marketing') {
    return NextResponse.redirect(new URL('/marketing', req.url))
  }

  return NextResponse.next()
}

// Usuário Admin
if (session === 'admin') {
  return NextResponse.next()
}

return NextResponse.redirect(new URL('/login', req.url))
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