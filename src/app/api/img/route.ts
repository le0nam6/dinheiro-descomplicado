import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return new Response('Missing url', { status: 400 })

  // Só proxy de URLs externas — internas passam direto
  if (url.startsWith('https://portalendinheirados.com.br') || url.startsWith('/')) {
    return Response.redirect(url, 301)
  }

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Endinheirados/1.0)' },
    })
    if (!res.ok) return new Response('Image fetch failed', { status: 502 })

    const ct = res.headers.get('content-type') || 'image/jpeg'
    const buf = await res.arrayBuffer()

    return new Response(buf, {
      headers: {
        'Content-Type': ct,
        'Cache-Control': 'public, max-age=604800, s-maxage=604800, immutable',
      },
    })
  } catch {
    return new Response('Image fetch error', { status: 502 })
  }
}
