/**
 * Gera public/sitemap.xml estaticamente a partir do Sanity.
 * Roda antes do next build e garante que o Google sempre encontra
 * um arquivo estático em vez de uma rota Next.js dinâmica.
 */
import { createClient } from 'next-sanity'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

// Lê .env.local se disponível (desenvolvimento), senão usa variáveis de ambiente
let env = {}
try {
  env = Object.fromEntries(
    readFileSync(join(root, '.env.local'), 'utf8')
      .split('\n')
      .filter(l => l && !l.startsWith('#') && l.includes('='))
      .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim().replace(/^"|"$/g, '')] })
  )
} catch {}

const PROJECT_ID = env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const DATASET   = env.NEXT_PUBLIC_SANITY_DATASET    || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const BASE      = 'https://endinheirados.cc'

const STATIC = [
  [BASE,                                         'daily',   '1.0'],
  [`${BASE}/blog`,                               'daily',   '0.9'],
  [`${BASE}/edicao`,                             'daily',   '0.9'],
  [`${BASE}/mercado`,                            'hourly',  '0.9'],
  [`${BASE}/cotacoes`,                           'hourly',  '0.8'],
  [`${BASE}/ferramentas`,                        'monthly', '0.8'],
  [`${BASE}/ferramentas/calculadora-juros`,      'monthly', '0.7'],
  [`${BASE}/ferramentas/calculadora-consignado`, 'monthly', '0.7'],
  [`${BASE}/ferramentas/simulador-dividas`,      'monthly', '0.7'],
  [`${BASE}/glossario`,                          'monthly', '0.8'],
  [`${BASE}/guias`,                              'monthly', '0.8'],
  [`${BASE}/guias/como-sair-das-dividas`,        'monthly', '0.7'],
  [`${BASE}/guias/como-economizar-dinheiro`,     'monthly', '0.7'],
  [`${BASE}/guias/fundo-de-emergencia`,          'monthly', '0.7'],
  [`${BASE}/guias/score-de-credito`,             'monthly', '0.7'],
  [`${BASE}/guias/como-investir-do-zero`,        'monthly', '0.7'],
  [`${BASE}/guias/previdencia-privada`,          'monthly', '0.7'],
  [`${BASE}/guias/imposto-de-renda`,             'monthly', '0.7'],
  [`${BASE}/calculadora`,                        'monthly', '0.6'],
  [`${BASE}/autor`,                              'monthly', '0.5'],
  [`${BASE}/sobre`,                              'monthly', '0.5'],
  [`${BASE}/contato`,                            'monthly', '0.4'],
  [`${BASE}/etica`,                              'monthly', '0.4'],
  [`${BASE}/privacidade`,                        'monthly', '0.4'],
  [`${BASE}/termos`,                             'monthly', '0.4'],
  ...['dolar','euro','libra','bitcoin','ethereum','petr4','vale3','ibov'].map(s =>
    [`${BASE}/cotacao/${s}`, 'hourly', '0.7']
  ),
  ...['selic','cdi','juros-compostos','score-de-credito','tesouro-direto','renda-fixa',
      'acoes','pix','inflacao','ipca','fgc','fii','etf','pgbl','vgbl'].map(t =>
    [`${BASE}/glossario/${t}`, 'monthly', '0.6']
  ),
]

function urlEntry(loc, changefreq, priority, lastmod) {
  return `  <url>
    <loc>${loc}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
}

async function main() {
  const entries = STATIC.map(([loc, cf, p]) => urlEntry(loc, cf, p))

  if (PROJECT_ID) {
    const sanity = createClient({ projectId: PROJECT_ID, dataset: DATASET, apiVersion: '2024-01-01', useCdn: false })

    const [posts, editions] = await Promise.all([
      sanity.fetch(`*[_type=="post" && defined(slug.current)]|order(publishedAt desc){"slug":slug.current,publishedAt}`).catch(() => []),
      sanity.fetch(`*[_type=="edition" && defined(slug.current)]|order(date desc){"slug":slug.current,date}`).catch(() => []),
    ])

    for (const p of posts) {
      entries.push(urlEntry(`${BASE}/blog/${p.slug}`, 'weekly', '0.8', p.publishedAt?.slice(0,10)))
    }
    for (const e of editions) {
      entries.push(urlEntry(`${BASE}/edicao/${e.slug}`, 'never', '0.6', e.date?.slice(0,10)))
    }

    console.log(`Sitemap: ${entries.length} URLs (${posts.length} posts, ${editions.length} edições)`)
  } else {
    console.log(`Sitemap: ${entries.length} URLs (sem Sanity — apenas páginas estáticas)`)
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>`

  writeFileSync(join(root, 'public', 'sitemap.xml'), xml)
  console.log('public/sitemap.xml gerado com sucesso.')
}

main().catch(e => { console.error(e); process.exit(1) })
