import { SESSION_COOKIE_NAME, verifySessionToken, type SessionRole } from './session'

function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.get('cookie')
  if (!header) return undefined

  const match = header
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`))

  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined
}

// Segunda camada de proteção nas próprias rotas de API, além do middleware —
// se algum dia o matcher do middleware não cobrir uma rota (foi exatamente o
// que aconteceu antes dessa correção), a rota ainda se protege sozinha.
export async function requireSession(
  req: Request
): Promise<{ ok: true; role: SessionRole } | { ok: false; response: Response }> {
  const token = readCookie(req, SESSION_COOKIE_NAME)
  const role = await verifySessionToken(token)

  if (!role) {
    return {
      ok: false,
      response: Response.json({ ok: false, error: 'Não autorizado' }, { status: 401 }),
    }
  }

  return { ok: true, role }
}
