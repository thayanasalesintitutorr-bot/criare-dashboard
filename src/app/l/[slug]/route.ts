export const dynamic = 'force-dynamic'

const SUPABASE_URL = 'https://afxgfgvdmgxcvamginjc.supabase.co'

function supabaseHeaders() {
  return {
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
    'Content-Type': 'application/json',
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const lookup = await fetch(
    `${SUPABASE_URL}/rest/v1/utm_links?slug=eq.${encodeURIComponent(slug)}&select=id,destino_url,clicks`,
    { headers: supabaseHeaders() }
  )

  if (!lookup.ok) {
    return new Response('Link não encontrado', { status: 404 })
  }

  const rows = await lookup.json()
  const link = rows[0]

  if (!link) {
    return new Response('Link não encontrado', { status: 404 })
  }

  fetch(`${SUPABASE_URL}/rest/v1/utm_links?id=eq.${link.id}`, {
    method: 'PATCH',
    headers: supabaseHeaders(),
    body: JSON.stringify({ clicks: (link.clicks || 0) + 1 }),
  }).catch(() => {})

  return Response.redirect(link.destino_url, 302)
}
