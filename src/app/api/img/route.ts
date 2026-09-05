import { NextRequest } from 'next/server'

/**
 * Proxy de imagem de capa.
 *
 * As capas vêm de raspagem de OG de terceiros e nem toda URL guardada é imagem:
 * YouTube e Facebook respondem HTTP 200 com HTML, e o navegador mostra o ícone
 * de quebrado. Aqui o content-type é conferido e, em qualquer falha, devolvemos
 * um placeholder da marca com 200 — assim o card mantém a forma em vez de exibir
 * um defeito. O status real vai no cabeçalho X-Img-Fallback, para depuração.
 */

const PLACEHOLDER = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450">
  <rect width="800" height="450" fill="#EEF6F1"/>
  <g stroke="#12653A" stroke-opacity="0.3" stroke-width="14" fill="none"
     stroke-linecap="round" stroke-linejoin="round">
    <rect x="290" y="160" width="220" height="150" rx="18"/>
    <path d="M310 292l52-52 38 38 30-26 48 42"/>
  </g>
  <circle cx="352" cy="205" r="18" fill="#12653A" fill-opacity="0.3"/>
</svg>`

function placeholder(motivo: string) {
  return new Response(PLACEHOLDER, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'X-Img-Fallback': motivo,
      // cache curto: a origem pode voltar a funcionar
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return placeholder('sem-url')

  // Internas passam direto, sem custo de proxy.
  if (url.startsWith('https://portalendinheirados.com.br') || url.startsWith('/')) {
    return Response.redirect(url, 301)
  }

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Endinheirados/1.0; +https://portalendinheirados.com.br)',
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
    })
    if (!res.ok) return placeholder(`http-${res.status}`)

    const ct = res.headers.get('content-type') || ''
    // A checagem que faltava: 200 com text/html é o caso do YouTube e do Facebook.
    if (!ct.startsWith('image/')) return placeholder(`tipo-${ct.split(';')[0] || 'vazio'}`)

    const buf = await res.arrayBuffer()
    if (buf.byteLength < 128) return placeholder('vazia')

    return new Response(buf, {
      headers: {
        'Content-Type': ct,
        'Cache-Control': 'public, max-age=604800, s-maxage=604800, immutable',
      },
    })
  } catch (err) {
    return placeholder(err instanceof Error && err.name === 'TimeoutError' ? 'timeout' : 'erro')
  }
}
