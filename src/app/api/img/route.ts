import { NextRequest } from 'next/server'
import { fetchPhoto } from '@/lib/publish-core'

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

/**
 * Última linha antes do placeholder: busca uma foto de verdade no banco
 * (Pexels, depois Unsplash) usando o termo que veio em ?q=. É o que evita
 * mostrar um quadrado desenhado no lugar de uma imagem — o leitor vê uma foto
 * pertinente, não um defeito.
 */
async function fotoDoBanco(q: string, motivo: string): Promise<Response | null> {
  try {
    const foto = await fetchPhoto(q)
    if (!foto?.url) return null
    const res = await fetch(foto.url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const ct = res.headers.get('content-type') || ''
    if (!ct.startsWith('image/')) return null
    return new Response(await res.arrayBuffer(), {
      headers: {
        'Content-Type': ct,
        'X-Img-Fallback': `banco:${motivo}`,
        // 1 dia: a origem pode voltar, e o backfill pode corrigir o post.
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    })
  } catch {
    return null
  }
}

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
  const q = req.nextUrl.searchParams.get('q') || 'finance money brazil business'

  // Falhar aqui significa: tenta o banco de imagens; só depois o placeholder.
  const desiste = async (motivo: string) => (await fotoDoBanco(q, motivo)) ?? placeholder(motivo)

  if (!url) return desiste('sem-url')

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
    if (!res.ok) return desiste(`http-${res.status}`)

    const ct = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase()
    // A checagem que faltava: 200 com text/html é o caso do YouTube e do Facebook.
    // Mas há servidor que manda 'webp' sem o prefixo — é imagem válida.
    const SOLTOS = ['webp', 'jpeg', 'jpg', 'png', 'gif', 'avif', 'image']
    if (!ct.startsWith('image/') && !SOLTOS.includes(ct)) return desiste(`tipo-${ct || 'vazio'}`)

    const buf = await res.arrayBuffer()
    if (buf.byteLength < 128) return desiste('vazia')

    return new Response(buf, {
      headers: {
        'Content-Type': ct,
        'Cache-Control': 'public, max-age=604800, s-maxage=604800, immutable',
      },
    })
  } catch (err) {
    return desiste(err instanceof Error && err.name === 'TimeoutError' ? 'timeout' : 'erro')
  }
}
