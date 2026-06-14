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

  const apiKey = process.env.SERPER_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Serper não configurado' }, { status: 500 })
  }

  try {
    const res = await fetch('https://google.serper.dev/images', {
      method: 'POST',
      headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q, gl: 'br', hl: 'pt', num: 6 }),
      signal: AbortSignal.timeout(8000),
    })
    const d = await res.json()

    if (!res.ok) {
      return NextResponse.json({ error: d.message || 'Erro na busca' }, { status: 500 })
    }

    const images = (d.images ?? []).slice(0, 6).map((item: {
      title: string
      imageUrl: string
      thumbnailUrl: string
      source: string
      link: string
    }) => ({
      url: item.imageUrl,
      thumb: item.thumbnailUrl,
      source: item.source,
      title: item.title,
      contextLink: item.link,
    }))

    return NextResponse.json({ images })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
