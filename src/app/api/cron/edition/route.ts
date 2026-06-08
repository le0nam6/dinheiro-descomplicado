/**
 * Edição diária — o compilado curado do mercado (estilo "The News").
 * Roda todo dia às ~6h (BRT) via GitHub Actions.
 * Curadoria com profundidade das notícias de Brasil e Mundo que impactam o
 * mercado financeiro (inclusive política). Objetivo: o leitor sair mais
 * inteligente em poucos minutos. Publica em /edicao/[data] e avisa no Telegram.
 */
import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { sanity, SITE, tgAlert, tgConfigured } from '@/lib/publish-core'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const FEEDS = [
  { source: 'InfoMoney', url: 'https://www.infomoney.com.br/feed/' },
  { source: 'G1 Economia', url: 'https://g1.globo.com/rss/g1/economia/' },
  { source: 'G1 Política', url: 'https://g1.globo.com/rss/g1/politica/' },
  { source: 'Exame', url: 'https://exame.com/feed/' },
  { source: 'Valor (Brazil Journal)', url: 'https://braziljournal.com/feed/' },
  { source: 'Reuters Business', url: 'https://feeds.reuters.com/reuters/businessNews' },
  { source: 'CNBC', url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147' },
  { source: 'Investing.com', url: 'https://br.investing.com/rss/news_285.rss' },
  { source: 'Investing.com Mundo', url: 'https://br.investing.com/rss/news_25.rss' },
]

type NewsItem = { source: string; title: string; description: string; url: string }

async function fetchNews(): Promise<NewsItem[]> {
  const cutoff = Date.now() - 30 * 60 * 60 * 1000 // últimas ~30h
  const items: NewsItem[] = []
  await Promise.allSettled(FEEDS.map(async ({ source, url }) => {
    try {
      const xml = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(7000) }).then(r => r.text())
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
        items.push({ source, title, description: get('description').replace(/<[^>]+>/g, '').slice(0, 260), url: link })
      }
    } catch { /* feed off */ }
  }))
  return items
}

type Story = { emoji: string; tag: string; headline: string; what: string; why: string; sourceIndexes: number[] }
type Curation = { title: string; intro: string; readingTime: number; stories: Story[] }

async function curate(news: NewsItem[], previousHeadlines: string[]): Promise<{ curation: Curation; news: NewsItem[] }> {
  const pool = news.slice(0, 45)
  const prompt = `Você é o editor-chefe do "Endinheirados" (endinheirados.cc). Monte a EDIÇÃO DIÁRIA: uma curadoria do que aconteceu de mais importante no mercado financeiro — Brasil e Mundo — que impacta a vida financeira das pessoas. Inclua POLÍTICA, mas só quando ela afeta o mercado (juros, câmbio, fiscal, eleições, regulação, etc.).

Inspiração de estrutura e tom: newsletter "The News" — direto, inteligente, escaneável, leve mas preciso. A pessoa deve sair MAIS INTELIGENTE da edição em poucos minutos.

MANCHETES REAIS DAS ÚLTIMAS HORAS (índice | fonte | título | resumo):
${pool.map((n, i) => `${i + 1}. ${n.source} | ${n.title} | ${n.description}`).join('\n')}

NÃO repita o que saiu na edição de ontem:
${previousHeadlines.length ? previousHeadlines.map(h => `- ${h}`).join('\n') : '(primeira edição)'}

REGRAS:
- Selecione de 5 a 7 assuntos REALMENTE relevantes para o mercado financeiro. Priorize o que move juros, câmbio, bolsa, inflação, emprego e o bolso do brasileiro.
- Agrupe manchetes que tratam do MESMO fato numa única matéria.
- IMPARCIALIDADE mandatória: reporte fatos, atribua às fontes ("segundo o Banco Central"), sem opinião torcedora, sem alarmismo, sem clickbait, sem inventar números.
- Para cada matéria escreva DOIS blocos curtos:
  - "what" (O que aconteceu): 2 a 4 frases factuais, com contexto.
  - "why" (Por que importa): 2 a 3 frases explicando o impacto prático no dinheiro do leitor, de forma didática e neutra.
- "tag" = editoria curta (ex.: "Juros", "Câmbio", "Bolsa", "Política", "Global", "Cripto", "Economia").
- "emoji" = 1 emoji que represente a matéria.
- "intro" = 1 ou 2 frases de abertura amigáveis resumindo o dia (sem clichê).
- Português BR claro. Sem markdown, sem asteriscos.

Retorne SOMENTE JSON:
{
  "title": "Edição de DD de mês de AAAA",
  "intro": "abertura curta",
  "readingTime": 4,
  "stories": [
    { "emoji": "📈", "tag": "Juros", "headline": "manchete curta e descritiva", "what": "...", "why": "...", "sourceIndexes": [1, 4] }
  ]
}
sourceIndexes = números das manchetes (da lista) usadas como fonte de cada matéria.`

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6', max_tokens: 6000,
    messages: [{ role: 'user', content: prompt }],
  })
  const text = (msg.content[0] as { text: string }).text.trim()
  const curation = JSON.parse(text.replace(/^```json\n?|\n?```$/g, '')) as Curation
  return { curation, news: pool }
}

async function fetchMarketSnapshot(): Promise<Array<{ label: string; value: string; changePct: number }>> {
  try {
    const d = await fetch(`${SITE}/api/quotes`, { signal: AbortSignal.timeout(7000) }).then(r => r.json())
    if (!d?.ok) return []
    const want = ['USDBRL', 'EURBRL', '^BVSP', 'BTCBRL']
    return (d.quotes as Array<{ symbol: string; label: string; price: number; changePct: number; kind: string }>)
      .filter(q => want.includes(q.symbol))
      .map(q => ({
        label: q.label,
        value: (q.kind === 'moeda' || q.kind === 'cripto' ? 'R$ ' : '') + q.price.toLocaleString('pt-BR', { maximumFractionDigits: 2 }),
        changePct: q.changePct,
      }))
  } catch { return [] }
}

// Data no fuso de Brasília (YYYY-MM-DD)
function brtDate(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
}

// Título da edição com a data real (nunca confiar na data inventada pelo modelo)
function editionTitle(dateISO: string): string {
  const d = new Date(dateISO + 'T12:00:00')
  return `Edição de ${d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' })}`
}

export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const date = brtDate()

    // idempotência: se já existe edição de hoje, não duplica
    const existing = await sanity.fetch('*[_type=="edition" && slug.current==$d][0]._id', { d: date })
    if (existing) return NextResponse.json({ ok: true, message: 'Edição de hoje já publicada', date })

    const news = await fetchNews()
    if (news.length < 4) return NextResponse.json({ ok: false, message: 'Notícias insuficientes' }, { status: 200 })

    const prev: string[] = await sanity.fetch('*[_type=="edition"] | order(date desc)[0].stories[].headline')
    const [{ curation, news: pool }, marketSnapshot] = await Promise.all([
      curate(news, prev || []),
      fetchMarketSnapshot(),
    ])

    const stories = (curation.stories || []).map(s => {
      const idxs = Array.isArray(s.sourceIndexes) ? s.sourceIndexes : []
      const sources = idxs.map(i => pool[i - 1]).filter(Boolean).map(n => ({
        _type: 'source', _key: nanoid(6), name: n.source, url: n.url,
      }))
      return {
        _type: 'story', _key: nanoid(8),
        emoji: s.emoji || '•', tag: s.tag || '', headline: s.headline,
        what: s.what, why: s.why, sources,
      }
    })

    await sanity.create({
      _type: 'edition',
      date,
      slug: { _type: 'slug', current: date },
      title: editionTitle(date),
      publishedAt: new Date().toISOString(),
      intro: curation.intro || '',
      readingTime: curation.readingTime || Math.max(3, Math.round(stories.length * 0.8)),
      stories,
      marketSnapshot: marketSnapshot.map(m => ({ _type: 'quote', _key: nanoid(6), ...m })),
    })

    const url = `${SITE}/edicao/${date}`
    if (tgConfigured()) {
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: `🗞️ Edição publicada (${stories.length} matérias)\n\n${curation.title}\n${url}`,
        }),
      }).catch(() => {})
    }

    return NextResponse.json({ ok: true, date, stories: stories.length, url })
  } catch (err) {
    await tgAlert('Cron edição diária (6h)', err)
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
