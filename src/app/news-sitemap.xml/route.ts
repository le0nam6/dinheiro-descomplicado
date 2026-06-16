/**
 * Sitemap de notícias (Google News) — artigos do tipo "news" das últimas 48h.
 */
import { client } from '@/lib/sanity'

const BASE = 'https://endinheirados.cc'
export const revalidate = 600

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export async function GET() {
  let posts: Array<{ slug: { current: string }; title: string; publishedAt: string }> = []
  if (client) {
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    posts = await client.fetch(
      `*[_type=="post" && articleType=="news" && publishedAt > $since && publishedAt <= now()]|order(publishedAt desc){title, slug, publishedAt}`,
      { since }
    ).catch(() => [])
  }

  const items = posts.map(p => `
  <url>
    <loc>${BASE}/blog/${p.slug.current}</loc>
    <news:news>
      <news:publication>
        <news:name>Endinheirados</news:name>
        <news:language>pt</news:language>
      </news:publication>
      <news:publication_date>${new Date(p.publishedAt).toISOString().replace(/\.\d{3}Z$/, 'Z')}</news:publication_date>
      <news:title>${esc(p.title)}</news:title>
    </news:news>
  </url>`).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${items}
</urlset>`

  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } })
}
