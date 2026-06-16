import { getPosts, getEditions } from '@/lib/sanity'
import { terms } from '@/lib/glossario'

export const dynamic = 'force-dynamic'

const BASE = 'https://endinheirados.cc'

function isoNoMs(d: Date): string {
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z')
}

function safeDate(value: string | undefined | null): string {
  if (!value) return isoNoMs(new Date())
  const d = new Date(value)
  return isoNoMs(isNaN(d.getTime()) ? new Date() : d)
}

function url(loc: string, lastmod: string, changefreq: string, priority: string) {
  return `<url><loc>${loc}</loc><lastmod>${lastmod}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`
}

const staticUrls = [
  url(BASE, '', 'daily', '1.0'),
  url(`${BASE}/blog`, '', 'daily', '0.9'),
  url(`${BASE}/edicao`, '', 'daily', '0.9'),
  url(`${BASE}/mercado`, '', 'hourly', '0.9'),
  url(`${BASE}/cotacoes`, '', 'hourly', '0.8'),
  url(`${BASE}/ferramentas`, '', 'monthly', '0.8'),
  url(`${BASE}/ferramentas/calculadora-juros`, '', 'monthly', '0.7'),
  url(`${BASE}/ferramentas/calculadora-consignado`, '', 'monthly', '0.7'),
  url(`${BASE}/ferramentas/simulador-dividas`, '', 'monthly', '0.7'),
  url(`${BASE}/glossario`, '', 'monthly', '0.8'),
  url(`${BASE}/autor`, '', 'monthly', '0.5'),
  url(`${BASE}/sobre`, '', 'monthly', '0.5'),
  url(`${BASE}/contato`, '', 'monthly', '0.4'),
  url(`${BASE}/etica`, '', 'yearly', '0.4'),
  url(`${BASE}/privacidade`, '', 'yearly', '0.3'),
  url(`${BASE}/termos`, '', 'yearly', '0.3'),
  url(`${BASE}/categoria/noticias`, '', 'daily', '0.8'),
  url(`${BASE}/categoria/ganhar-dinheiro`, '', 'weekly', '0.7'),
  url(`${BASE}/categoria/investimentos`, '', 'weekly', '0.7'),
  url(`${BASE}/categoria/educacao-financeira`, '', 'weekly', '0.7'),
  url(`${BASE}/categoria/cartao-de-credito`, '', 'weekly', '0.7'),
  url(`${BASE}/categoria/emprestimo`, '', 'weekly', '0.7'),
  url(`${BASE}/categoria/financiamento`, '', 'weekly', '0.7'),
  url(`${BASE}/categoria/previdencia`, '', 'weekly', '0.7'),
]

export async function GET() {
  const now = isoNoMs(new Date())

  // Substitui placeholder '' por now nas rotas estáticas
  const staticXml = staticUrls.map(u => u.replace(/><lastmod><\/lastmod>/, `><lastmod>${now}</lastmod>`))

  let posts: Array<{ slug: { current: string }; publishedAt: string }> = []
  let editions: Array<{ slug: { current: string }; date: string }> = []

  try {
    ;[posts, editions] = await Promise.all([getPosts(500), getEditions(120)])
  } catch {
    // Sanity indisponível — retorna só rotas estáticas
  }

  const postXml = posts
    .filter(p => p?.slug?.current)
    .map(p => url(`${BASE}/blog/${p.slug.current}`, safeDate(p.publishedAt), 'weekly', '0.8'))

  const editionXml = editions
    .filter(e => e?.slug?.current)
    .map(e => url(`${BASE}/edicao/${e.slug.current}`, safeDate(e.date ? e.date + 'T12:00:00' : null), 'monthly', '0.7'))

  const glossarioXml = terms.map(t =>
    url(`${BASE}/glossario/${t.slug}`, now, 'yearly', '0.7')
  )

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticXml, ...editionXml, ...postXml, ...glossarioXml].join('\n')}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
    },
  })
}
