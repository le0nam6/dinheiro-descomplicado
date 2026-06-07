/**
 * Vercel Cron (a cada 2h): vertical jornalística.
 * Publica uma notícia do mercado financeiro BR + mundo, com IMPARCIALIDADE
 * mandatória, fontes discriminadas e termômetro de imparcialidade (no front).
 * Auto-publica no blog e notifica no Telegram.
 */
import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import {
  sanity, SITE, type GeneratedPost, type Photo,
  createSanityPost, getRecentTitles, fetchPhoto, tgAlert, tgConfigured,
} from '@/lib/publish-core'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const FEEDS = [
  { source: 'InfoMoney', url: 'https://www.infomoney.com.br/feed/' },
  { source: 'G1 Economia', url: 'https://g1.globo.com/rss/g1/economia/' },
  { source: 'Exame', url: 'https://exame.com/feed/' },
  { source: 'Reuters Business', url: 'https://feeds.reuters.com/reuters/businessNews' },
  { source: 'CNBC', url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147' },
  { source: 'Investing.com', url: 'https://br.investing.com/rss/news_285.rss' },
]

type NewsItem = { source: string; title: string; description: string; url: string; imageUrl?: string }

async function fetchNews(): Promise<NewsItem[]> {
  const cutoff = Date.now() - 48 * 60 * 60 * 1000
  const items: NewsItem[] = []
  await Promise.allSettled(FEEDS.map(async ({ source, url }) => {
    try {
      const xml = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(6000) }).then(r => r.text())
      const re = /<item>([\s\S]*?)<\/item>/g
      let m
      while ((m = re.exec(xml)) !== null) {
        const b = m[1]
        const get = (t: string) => {
          const x = b.match(new RegExp(`<${t}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${t}>|<${t}[^>]*>([\\s\\S]*?)</${t}>`))
          return x ? (x[1] || x[2] || '').trim() : ''
        }
        const title = get('title'), link = get('link'), pub = get('pubDate')
        if (!title || !link) continue
        if (pub && new Date(pub).getTime() < cutoff) continue
        const img = b.match(/<media:content[^>]+url=["']([^"']+)["']/) || b.match(/<enclosure[^>]+url=["']([^"']+\.(?:jpg|jpeg|png|webp))["']/)
        items.push({ source, title, description: get('description').replace(/<[^>]+>/g, '').slice(0, 240), url: link, imageUrl: img?.[1] })
      }
    } catch { /* feed off */ }
  }))
  return items
}

async function generate(news: NewsItem[], recent: string[]): Promise<GeneratedPost & { newsSources: NewsItem[] }> {
  // 1-3 fontes mais relevantes pra basear a matéria
  const top = news.slice(0, 12)
  const prompt = `Você é repórter de finanças do portal Endinheirados (endinheirados.cc). Escreva UMA notícia a partir das manchetes reais abaixo do mercado financeiro (Brasil e mundo).

MANCHETES DISPONÍVEIS (fonte | título | resumo | url):
${top.map((n, i) => `${i + 1}. ${n.source} | ${n.title} | ${n.description} | ${n.url}`).join('\n')}

NÃO repita temas já publicados:
${recent.map(t => `- ${t}`).join('\n')}

IMPARCIALIDADE É MANDATÓRIA (princípio inegociável):
- Reporte os FATOS. Sem opinião, sem adjetivos torcedores, sem especulação apresentada como certeza.
- Se há lados/visões divergentes, apresente os dois de forma equilibrada.
- Atribua afirmações às fontes ("segundo o Banco Central", "de acordo com a InfoMoney").
- Sem alarmismo, sem clickbait. Título descritivo e honesto.
- Não invente números, datas ou falas. Use só o que está nas manchetes; se faltar dado, fale de forma genérica.
- Explique o impacto para o brasileiro comum de forma didática e NEUTRA.

ESTILO: português BR claro e acessível (pode ser levemente informal, mas é jornalismo — priorize precisão sobre gíria).

REGRAS DO body: sem markdown inline (nada de asteriscos), subtítulos começam com "## ". Texto puro.

Escolha as 1 a 3 manchetes que tratam do MESMO fato para basear a matéria. Retorne SOMENTE JSON:
{
  "title": "título jornalístico, descritivo, max 75 chars",
  "slug": "slug-sem-acento",
  "excerpt": "resumo factual até 155 chars",
  "category": "investimentos",
  "seoKeywords": ["kw1","kw2","kw3","kw4","kw5"],
  "readingTime": 3,
  "coverQuery": "termo em inglês p/ foto no Pexels, específico ao tema real da notícia",
  "body": ["## Subtítulo","parágrafo factual","..."],
  "igCaption": "legenda instagram informativa e neutra, 3 parágrafos, termina com \\n\\n🔗 Leia no site: endinheirados.cc/blog/SLUG\\n\\n#mercadofinanceiro #economia #noticias #investimentos #endinheirados",
  "igTitle": "título CAIXA ALTA p/ card, max 3 linhas",
  "sourceIndexes": [1, 2]
}
sourceIndexes = números das manchetes (da lista acima) que você usou como fonte.`

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6', max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })
  const text = (msg.content[0] as { text: string }).text.trim()
  const parsed = JSON.parse(text.replace(/^```json\n?|\n?```$/g, ''))
  const idxs: number[] = Array.isArray(parsed.sourceIndexes) ? parsed.sourceIndexes : [1]
  const newsSources = idxs.map((i: number) => top[i - 1]).filter(Boolean)
  return { ...parsed, funnel: 'tofu', articleType: 'news', newsSources }
}

export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const news = await fetchNews()
    if (!news.length) return NextResponse.json({ ok: true, message: 'Sem notícias novas' })

    const recent = await getRecentTitles(20)
    const post = await generate(news, recent)

    // foto: imagem da própria notícia → Pexels → Unsplash
    const articleImg = post.newsSources[0]?.imageUrl
    const photo: Photo = articleImg
      ? { url: articleImg, alt: post.title, credit: `Foto: ${post.newsSources[0].source}` }
      : await fetchPhoto(post.coverQuery || 'stock market news')

    const doc = await createSanityPost(
      { ...post, articleType: 'news', sources: post.newsSources.map(s => ({ name: s.source, url: s.url })) } as unknown as GeneratedPost,
      photo,
    )
    const finalSlug = (doc.slug as { current: string }).current
    const blogUrl = `${SITE}/blog/${finalSlug}`

    if (tgConfigured()) {
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: `📰 Notícia publicada\n\n${post.title}\n${blogUrl}\n\nFontes: ${post.newsSources.map(s => s.source).join(', ')}` }),
      }).catch(() => {})
    }

    return NextResponse.json({ ok: true, title: post.title, slug: finalSlug, sources: post.newsSources.length })
  } catch (err) {
    await tgAlert('Cron notícias (2h)', err)
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
