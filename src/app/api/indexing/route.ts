import { GoogleAuth } from 'google-auth-library'
import { NextRequest, NextResponse } from 'next/server'

const INDEXING_ENDPOINT = 'https://indexing.googleapis.com/v3/urlNotifications:publish'
const BASE = 'https://endinheirados.cc'

function getAuth() {
  const privateKey = process.env.GOOGLE_INDEXING_PRIVATE_KEY?.replace(/\\n/g, '\n')
  const clientEmail = process.env.GOOGLE_INDEXING_CLIENT_EMAIL

  if (!privateKey || !clientEmail) return null

  return new GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ['https://www.googleapis.com/auth/indexing'],
  })
}

async function notifyGoogle(url: string, type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED') {
  const auth = getAuth()
  if (!auth) throw new Error('Google Indexing credentials not configured')

  const client = await auth.getClient()
  const token = await client.getAccessToken()

  const res = await fetch(INDEXING_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token.token}`,
    },
    body: JSON.stringify({ url, type }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Google Indexing API error ${res.status}: ${err}`)
  }

  return res.json()
}

// Webhook do Sanity → chama quando um post é publicado/atualizado
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-webhook-secret')
  if (secret !== process.env.SANITY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const slug = body?._type === 'post' ? body?.slug?.current : null

  if (!slug) {
    return NextResponse.json({ error: 'No slug found in payload' }, { status: 400 })
  }

  const url = `${BASE}/blog/${slug}`

  try {
    const result = await notifyGoogle(url)
    return NextResponse.json({ ok: true, url, result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// Endpoint manual: GET /api/indexing?url=/blog/meu-artigo
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.SANITY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const path = req.nextUrl.searchParams.get('url')
  if (!path) return NextResponse.json({ error: 'Missing url param' }, { status: 400 })

  const url = path.startsWith('http') ? path : `${BASE}${path}`

  try {
    const result = await notifyGoogle(url)
    return NextResponse.json({ ok: true, url, result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
