import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const hasSession = req.cookies.get('criare-auth')

  if (!hasSession) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/marketing/:path*',
    '/funil/:path*',
    '/vendas/:path*',
    '/reabord/:path*',
    '/origens/:path*',
    '/medicos/:path*',
    '/auditoria/:path*',
  ],
}