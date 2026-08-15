import { PROTOCOLO_GATE_COOKIE_NAME, verifyProtocoloGateToken } from './protocolos-gate'

function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.get('cookie')
  if (!header) return undefined

  const match = header
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`))

  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined
}

// Roda nas rotas de /api/protocolos* e /api/pacientes-protocolo*, além da
// sessão normal (require-session.ts) — exige também o cookie da segunda
// senha. `locked: true` no corpo é o que a página usa pra saber que deve
// mostrar a tela de senha em vez de "não autorizado" genérico.
export async function requireProtocoloGate(
  req: Request
): Promise<{ ok: true } | { ok: false; response: Response }> {
  const token = readCookie(req, PROTOCOLO_GATE_COOKIE_NAME)
  const unlocked = await verifyProtocoloGateToken(token)

  if (!unlocked) {
    return {
      ok: false,
      response: Response.json({ ok: false, locked: true, error: 'Área bloqueada' }, { status: 403 }),
    }
  }

  return { ok: true }
}
