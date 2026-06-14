import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'

function sessionToken(password: string): string {
  const secret = process.env.CRON_SECRET || 'fallback-dev-secret'
  return createHmac('sha256', secret).update(password).digest('hex')
}

async function checkAuth(): Promise<boolean> {
  const password = process.env.ADMIN_PASSWORD
  if (!password) return false
  const store = await cookies()
  const cookie = store.get('admin_auth')?.value
  if (!cookie) return false
  const expected = sessionToken(password)
  const a = Buffer.from(cookie)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export async function GET(req: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const q = new URL(req.url).searchParams.get('q')?.trim()
  if (!q) return NextResponse.json({ images: [] })

  const apiKey = process.env.GOOGLE_SEARCH_API_KEY
  const cx = process.env.GOOGLE_SEARCH_ENGINE_ID
  if (!apiKey || !cx) {
    return NextResponse.json({ error: 'Google Search não configurado' }, { status: 500 })
  }

  try {
    const url = new URL('https://www.googleapis.com/customsearch/v1')
    url.searchParams.set('key', apiKey)
    url.searchParams.set('cx', cx)
    url.searchParams.set('searchType', 'image')
    url.searchParams.set('q', q)
    url.searchParams.set('num', '3')
    url.searchParams.set('imgType', 'photo')
    url.searchParams.set('safe', 'active')
    url.searchParams.set('lr', 'lang_pt')

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) })
    const d = await res.json()

    if (!res.ok) {
      return NextResponse.json({ error: d.error?.message || 'Erro na busca' }, { status: 500 })
    }

    const images = (d.items ?? []).map((item: {
      link: string
      image: { thumbnailLink: string; contextLink: string }
      displayLink: string
      title: string
    }) => ({
      url: item.link,
      thumb: item.image.thumbnailLink,
      source: item.displayLink,
      title: item.title,
      contextLink: item.image.contextLink,
    }))

    return NextResponse.json({ images })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
