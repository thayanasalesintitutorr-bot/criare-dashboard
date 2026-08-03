export const dynamic = 'force-dynamic'

const SUPABASE_URL = 'https://afxgfgvdmgxcvamginjc.supabase.co'

function supabaseHeaders() {
  return {
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
    'Content-Type': 'application/json',
  }
}

function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip')
}

// Dispara o webhook em segundo plano — nunca atrasa nem quebra o
// redirecionamento do visitante por causa de um webhook lento ou fora do ar.
function dispararWebhook(
  webhookUrl: string,
  payload: Record<string, unknown>
) {
  fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(5000),
  }).catch(() => {
    // silencioso: falha no webhook do cliente não pode afetar o clique real
  })
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const lookup = await fetch(
    `${SUPABASE_URL}/rest/v1/utm_links?slug=eq.${encodeURIComponent(slug)}&select=id,nome,destino_url,clicks,utm_source,utm_medium,utm_campaign,utm_content,webhook_url`,
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

  if (link.webhook_url) {
    dispararWebhook(link.webhook_url, {
      evento: 'click',
      link_id: link.id,
      slug,
      nome: link.nome,
      destino_url: link.destino_url,
      utm_source: link.utm_source,
      utm_medium: link.utm_medium,
      utm_campaign: link.utm_campaign,
      utm_content: link.utm_content,
      clicado_em: new Date().toISOString(),
      referrer: request.headers.get('referer'),
      user_agent: request.headers.get('user-agent'),
      ip: getClientIp(request),
    })
  }

  return Response.redirect(link.destino_url, 302)
}
