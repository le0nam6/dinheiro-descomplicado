/**
 * Curadoria humana da edição (noite anterior).
 * Roda ~22h BRT. Busca o TRIPLO de manchetes candidatas, salva um
 * pendingEdition e manda no Telegram com botões toggle. O editor marca quais
 * entram; o cron das 6h monta a edição só com as escolhidas (com fallback
 * automático se ninguém selecionar).
 */
import { NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { sanity, tgConfigured, tgAlert } from '@/lib/publish-core'
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
]

async function fetchNews(): Promise<Omit<Candidate, '_key' | 'idx' | 'selected'>[]> {
  const cutoff = Date.now() - 30 * 60 * 60 * 1000
  const items: Omit<Candidate, '_key' | 'idx' | 'selected'>[] = []
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
        items.push({ source, title, description: get('description').replace(/<[^>]+>/g, '').slice(0, 220), url: link, pubDate: pub || '' })
      }
    } catch { /* feed off */ }
  }))
  return items
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

    // 3x as finais: ~18 candidatas
    const candidates: Candidate[] = news.slice(0, 18).map((n, i) => ({
      _key: nanoid(8), idx: i, source: n.source, title: n.title, description: n.description, url: n.url, pubDate: n.pubDate, selected: false,
    }))

    if (!tgConfigured()) {
      return NextResponse.json({ ok: false, message: 'Telegram não configurado — curadoria precisa do Telegram' }, { status: 200 })
    }

    const doc = await sanity.create({
      _type: 'pendingEdition', date, status: 'selecting', candidates, createdAt: new Date().toISOString(),
    })

    const sent = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: candidatesMessage(date, candidates),
        reply_markup: candidatesKeyboard(doc._id, candidates),
        disable_web_page_preview: true,
      }),
    }).then(r => r.json())

    // guarda o id da mensagem pra poder editar o teclado nos toggles
    if (sent?.result?.message_id) {
      await sanity.patch(doc._id).set({ chatId: sent.result.chat.id, messageId: sent.result.message_id }).commit()
    }

    return NextResponse.json({ ok: true, date, candidates: candidates.length, pendingId: doc._id })
  } catch (err) {
    await tgAlert('Cron candidatas da edição (noite)', err)
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
