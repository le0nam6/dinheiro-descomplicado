/**
 * Curadoria humana da edição (noite anterior).
 * Roda ~22h BRT. Busca o TRIPLO de manchetes candidatas, salva um
 * pendingEdition e manda no Telegram com botões toggle. O editor marca quais
 * entram; o cron das 5h monta a edição só com as escolhidas (com fallback
 * automático se ninguém selecionar).
 *
 * Fontes: notícias do portal Endinheirados publicadas hoje (aparecem no topo)
 * + notícias externas dos feeds RSS do dia.
 */
import { NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { sanity, SITE, tgConfigured, tgAlert } from '@/lib/publish-core'
import { type Candidate, candidatesKeyboard, candidatesMessage } from '@/lib/editionCuration'

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
  { source: 'NeoFeed', url: 'https://neofeed.com.br/feed/' },
  { source: 'InvestNews', url: 'https://investnews.com.br/feed/' },
  { source: 'Money Times', url: 'https://www.moneytimes.com.br/feed/' },
  { source: 'Seu Dinheiro', url: 'https://www.seudinheiro.com/feed/' },
  { source: 'Finsiders', url: 'https://finsiders.com.br/feed/' },
]

const STOPWORDS = new Set(['de','do','da','dos','das','e','o','a','os','as','em','no','na','nos','nas','por','para','com','que','um','uma','se','ao','à','ou','foi','são','mais','mas','este','esta','esse','essa','pelo','pela','como','está','pelo','num','numa','entre','já','não','isso','isso','sua','seu','suas','seus','também'])

function titleFingerprint(title: string): Set<string> {
  return new Set(
    title.toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !STOPWORDS.has(w))
  )
}

function isDuplicate(title: string, seen: Set<string>[]): boolean {
  const fp = titleFingerprint(title)
  if (fp.size === 0) return false
  for (const s of seen) {
    const inter = [...fp].filter(w => s.has(w)).length
    const sim = inter / Math.min(fp.size, s.size)
    if (sim >= 0.6) return true
  }
  return false
}

// Meia-noite do dia atual em BRT (America/Sao_Paulo = UTC-3)
function startOfTodayBRT(): string {
  const todayBRT = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
  return new Date(`${todayBRT}T00:00:00-03:00`).toISOString()
}

async function fetchNews(): Promise<Omit<Candidate, '_key' | 'idx' | 'selected'>[]> {
  const since = startOfTodayBRT()

  // 1. Notícias do próprio portal publicadas hoje (vão no topo)
  const ownPosts: Array<{ title: string; excerpt: string; slug: string; publishedAt: string }> = await sanity.fetch(
    `*[_type=="post" && articleType=="news" && publishedAt >= $since] | order(publishedAt desc) { title, excerpt, "slug": slug.current, publishedAt }`,
    { since }
  )
  const ownItems: Omit<Candidate, '_key' | 'idx' | 'selected'>[] = ownPosts.map(p => ({
    source: '⭐ Endinheirados',
    title: p.title,
    description: p.excerpt?.slice(0, 220) || '',
    url: `${SITE}/blog/${p.slug}`,
    pubDate: p.publishedAt,
  }))

  // 2. Notícias externas do dia via RSS
  const sinceMs = new Date(since).getTime()
  const raw: Omit<Candidate, '_key' | 'idx' | 'selected'>[] = []
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
        if (pub && new Date(pub).getTime() < sinceMs) continue
        raw.push({ source, title, description: get('description').replace(/<[^>]+>/g, '').slice(0, 220), url: link, pubDate: pub || '' })
      }
    } catch { /* feed off */ }
  }))

  // Deduplicação dos itens externos entre si
  const seen: Set<string>[] = ownItems.map(i => titleFingerprint(i.title))
  const externalItems: Omit<Candidate, '_key' | 'idx' | 'selected'>[] = []
  for (const item of raw) {
    if (!isDuplicate(item.title, seen)) {
      seen.push(titleFingerprint(item.title))
      externalItems.push(item)
    }
  }

  // Notícias do portal primeiro, depois as externas
  return [...ownItems, ...externalItems]
}

// Data BRT do dia da PRÓXIMA edição (a manhã que vem). +8h cobre a virada da noite.
function targetEditionDate(): string {
  const d = new Date(Date.now() + 8 * 60 * 60 * 1000)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(d)
}

export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const date = targetEditionDate()
    const force = new URL(request.url).searchParams.get('force') === '1'

    // idempotência: se já existe seleção em andamento/pronta para essa data, não duplica.
    // Com ?force=1, apaga as anteriores e recria (útil pra re-disparar/testar).
    const existingIds: string[] = await sanity.fetch('*[_type=="pendingEdition" && date==$d && status in ["selecting","selected"]]._id', { d: date })
    if (existingIds?.length) {
      if (!force) return NextResponse.json({ ok: true, message: 'Já existe seleção para essa data', date })
      for (const eid of existingIds) { try { await sanity.delete(eid) } catch { /* ignore */ } }
    }

    const news = await fetchNews()
    if (news.length < 6) return NextResponse.json({ ok: false, message: 'Notícias insuficientes' }, { status: 200 })

    const candidates: Candidate[] = news.slice(0, 45).map((n, i) => ({
      _key: nanoid(8), idx: i, source: n.source, title: n.title, description: n.description, url: n.url, pubDate: n.pubDate, selected: false,
    }))

    if (!tgConfigured()) {
      return NextResponse.json({ ok: false, message: 'Telegram não configurado — curadoria precisa do Telegram' }, { status: 200 })
    }

    const doc = await sanity.create({
      _type: 'pendingEdition', date, status: 'selecting', candidates, createdAt: new Date().toISOString(),
    })

    const tgPost = async (body: object) =>
      fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, disable_web_page_preview: true, ...body }),
      }).then(r => r.json())

    // Parte a lista em chunks de ≤4000 chars para não bater o limite do Telegram
    const fullText = candidatesMessage(date, candidates)
    const LIMIT = 4000
    const chunks: string[] = []
    if (fullText.length <= LIMIT) {
      chunks.push(fullText)
    } else {
      const lines = fullText.split('\n\n')
      let cur = ''
      for (const line of lines) {
        if ((cur + '\n\n' + line).length > LIMIT && cur) { chunks.push(cur.trim()); cur = line }
        else { cur = cur ? cur + '\n\n' + line : line }
      }
      if (cur.trim()) chunks.push(cur.trim())
    }

    // Envia partes de texto sem teclado, exceto a última que leva o teclado
    for (let i = 0; i < chunks.length - 1; i++) {
      await tgPost({ text: chunks[i] })
    }
    const sent = await tgPost({ text: chunks[chunks.length - 1], reply_markup: candidatesKeyboard(doc._id, candidates) })

    // guarda o id da mensagem com o teclado pra editar nos toggles
    if (sent?.result?.message_id) {
      await sanity.patch(doc._id).set({ chatId: sent.result.chat.id, messageId: sent.result.message_id }).commit()
    }

    return NextResponse.json({ ok: true, date, candidates: candidates.length, pendingId: doc._id })
  } catch (err) {
    await tgAlert('Cron candidatas da edição (noite)', err)
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
