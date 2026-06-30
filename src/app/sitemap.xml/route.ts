import { createClient } from '@sanity/client'

export const dynamic = 'force-dynamic'

const BASE = 'https://portalendinheirados.com.br'

const STATIC: [string, string, string][] = [
  [BASE,                                              'daily',   '1.0'],
  [`${BASE}/blog`,                                    'daily',   '0.9'],
  [`${BASE}/edicao`,                                  'daily',   '0.9'],
  [`${BASE}/mercado`,                                 'hourly',  '0.9'],
  [`${BASE}/cotacoes`,                                'hourly',  '0.8'],
  [`${BASE}/ferramentas`,                             'monthly', '0.8'],
  [`${BASE}/ferramentas/calculadora-juros`,           'monthly', '0.7'],
  [`${BASE}/ferramentas/calculadora-consignado`,      'monthly', '0.7'],
  [`${BASE}/ferramentas/simulador-dividas`,           'monthly', '0.7'],
  [`${BASE}/glossario`,                               'monthly', '0.8'],
  [`${BASE}/guias`,                                   'monthly', '0.8'],
  [`${BASE}/guias/como-sair-das-dividas`,             'monthly', '0.7'],
  [`${BASE}/guias/como-economizar-dinheiro`,          'monthly', '0.7'],
  [`${BASE}/guias/fundo-de-emergencia`,               'monthly', '0.7'],
  [`${BASE}/guias/score-de-credito`,                  'monthly', '0.7'],
  [`${BASE}/guias/como-investir-do-zero`,             'monthly', '0.7'],
  [`${BASE}/guias/previdencia-privada`,               'monthly', '0.7'],
  [`${BASE}/guias/imposto-de-renda`,                  'monthly', '0.7'],
  [`${BASE}/calculadora`,                             'monthly', '0.6'],
  [`${BASE}/autor`,                                   'monthly', '0.5'],
  [`${BASE}/sobre`,                                   'monthly', '0.5'],
  [`${BASE}/contato`,                                 'monthly', '0.4'],
  [`${BASE}/etica`,                                   'monthly', '0.4'],
  [`${BASE}/privacidade`,                             'monthly', '0.4'],
  [`${BASE}/termos`,                                  'monthly', '0.4'],
  ...(['dolar','euro','libra','bitcoin','ethereum','petr4','vale3','ibov'] as const).map(
    s => [`${BASE}/cotacao/${s}`, 'hourly', '0.7'] as [string, string, string]
  ),
  ...(['selic','cdi','juros-compostos','score-de-credito','tesouro-direto','renda-fixa',
       'acoes','pix','inflacao','ipca','fgc','fii','etf','pgbl','vgbl'] as const).map(
    t => [`${BASE}/glossario/${t}`, 'monthly', '0.6'] as [string, string, string]
  ),
]

function url(loc: string, changefreq: string, priority: string, lastmod?: string) {
  return `  <url>
    <loc>${loc}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
}

export async function GET() {
  const sanity = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    useCdn: true,
  })

  const [posts, editions] = await Promise.all([
    sanity.fetch<{ slug: string; publishedAt: string }[]>(
      `*[_type=="post" && defined(slug.current)]|order(publishedAt desc){"slug":slug.current,publishedAt}`
    ).catch(() => [] as { slug: string; publishedAt: string }[]),
    sanity.fetch<{ slug: string; date: string }[]>(
      `*[_type=="edition" && defined(slug.current)]|order(date desc){"slug":slug.current,date}`
    ).catch(() => [] as { slug: string; date: string }[]),
  ])

  const entries = [
    ...STATIC.map(([loc, cf, p]) => url(loc, cf, p)),
    ...posts.map(p => url(`${BASE}/blog/${p.slug}`, 'weekly', '0.8', p.publishedAt?.slice(0, 10))),
    ...editions.map(e => url(`${BASE}/edicao/${e.slug}`, 'never', '0.6', e.date?.slice(0, 10))),
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
