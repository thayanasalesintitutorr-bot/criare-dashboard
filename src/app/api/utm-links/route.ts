export const dynamic = 'force-dynamic'

const SUPABASE_URL = 'https://afxgfgvdmgxcvamginjc.supabase.co'

function supabaseHeaders() {
  return {
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
    'Content-Type': 'application/json',
  }
}

function slugify(nome: string) {
  const base = nome
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40)

  const sufixo = Math.random().toString(36).slice(2, 6)

  return `${base || 'link'}-${sufixo}`
}

export async function GET() {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/utm_links?select=*&order=created_at.desc`,
    { headers: supabaseHeaders() }
  )

  if (!response.ok) {
    return Response.json({ error: 'Falha ao buscar links' }, { status: 500 })
  }

  const data = await response.json()

  return Response.json({ links: data })
}

export async function POST(request: Request) {
  const body = await request.json()

  const nome = String(body.nome || '').trim()
  const destinoBase = String(body.destinoUrl || '').trim()
  const utmSource = String(body.utmSource || '').trim()
  const utmMedium = String(body.utmMedium || '').trim()
  const utmCampaign = String(body.utmCampaign || '').trim()
  const utmContent = String(body.utmContent || '').trim()

  if (!nome || !destinoBase) {
    return Response.json(
      { error: 'Nome e URL de destino são obrigatórios' },
      { status: 400 }
    )
  }

  let destinoUrl: URL

  try {
    destinoUrl = new URL(destinoBase)
  } catch {
    return Response.json({ error: 'URL de destino inválida' }, { status: 400 })
  }

  if (utmSource) destinoUrl.searchParams.set('utm_source', utmSource)
  if (utmMedium) destinoUrl.searchParams.set('utm_medium', utmMedium)
  if (utmCampaign) destinoUrl.searchParams.set('utm_campaign', utmCampaign)
  if (utmContent) destinoUrl.searchParams.set('utm_content', utmContent)

  const slug = slugify(nome)

  const response = await fetch(`${SUPABASE_URL}/rest/v1/utm_links`, {
    method: 'POST',
    headers: {
      ...supabaseHeaders(),
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      nome,
      destino_url: destinoUrl.toString(),
      slug,
      utm_source: utmSource || null,
      utm_medium: utmMedium || null,
      utm_campaign: utmCampaign || null,
      utm_content: utmContent || null,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    return Response.json(
      { error: 'Falha ao criar link', details: errorText },
      { status: 500 }
    )
  }

  const data = await response.json()

  return Response.json({ link: data[0] })
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return Response.json({ error: 'ID é obrigatório' }, { status: 400 })
  }

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/utm_links?id=eq.${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
      headers: supabaseHeaders(),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    return Response.json(
      { error: 'Falha ao excluir link', details: errorText },
      { status: 500 }
    )
  }

  return Response.json({ ok: true })
}
