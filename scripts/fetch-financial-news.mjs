/**
 * Busca as notícias financeiras mais relevantes das últimas 48h em fontes brasileiras.
 * Uso: node scripts/fetch-financial-news.mjs
 * Saída: JSON array com até 5 notícias { title, description, url, source, publishedAt }
 */

const FEEDS = [
  { source: 'InfoMoney',  url: 'https://www.infomoney.com.br/feed/' },
  { source: 'G1 Economia', url: 'https://g1.globo.com/rss/g1/economia/' },
  { source: 'Exame',      url: 'https://exame.com/feed/' },
  { source: 'UOL Economia', url: 'https://rss.uol.com.br/feed/economia.xml' },
]

const CUTOFF = new Date(Date.now() - 48 * 60 * 60 * 1000)

function parseRSS(xml) {
  const items = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1]
    const get = (tag) => {
      const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
      return m ? (m[1] || m[2] || '').trim() : ''
    }
    const title       = get('title')
    const description = get('description').replace(/<[^>]+>/g, '').slice(0, 200)
    const link        = get('link')
    const pubDate     = get('pubDate')
    if (title && link) items.push({ title, description, url: link, publishedAt: pubDate })
  }
  return items
}

const results = []

await Promise.allSettled(
  FEEDS.map(async ({ source, url }) => {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Endinheirados/1.0)' },
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) return
      const xml = await res.text()
      const items = parseRSS(xml)
      for (const item of items) {
        const pub = item.publishedAt ? new Date(item.publishedAt) : new Date()
        if (pub >= CUTOFF) {
          results.push({ ...item, source, publishedAt: pub.toISOString() })
        }
      }
    } catch {
      // feed indisponível — ignora
    }
  })
)

// Ordena por data e pega os 5 mais recentes e relevantes
const sorted = results
  .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
  .slice(0, 5)

if (sorted.length === 0) {
  console.error('❌ Nenhuma notícia encontrada nas últimas 48h')
  process.exit(1)
}

console.log(JSON.stringify(sorted, null, 2))
