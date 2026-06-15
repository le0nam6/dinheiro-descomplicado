/**
 * Curadoria humana da edição (noite anterior).
 * Roda ~22h BRT. Busca as notícias publicadas no Endinheirados durante o dia,
 * salva um pendingEdition e manda no Telegram com botões toggle. O editor marca
 * quais entram; o cron das 6h monta a edição só com as escolhidas.
 */
import { NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { sanity, SITE, tgConfigured, tgAlert } from '@/lib/publish-core'
import { type Candidate, candidatesKeyboard, candidatesMessage } from '@/lib/editionCuration'

// Meia-noite do dia atual em BRT (America/Sao_Paulo = UTC-3)
function startOfTodayBRT(): string {
  const todayBRT = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
  return new Date(`${todayBRT}T00:00:00-03:00`).toISOString()
}

async function fetchNews(): Promise<Omit<Candidate, '_key' | 'idx' | 'selected'>[]> {
  const since = startOfTodayBRT()
  const posts: Array<{ title: string; excerpt: string; slug: string; publishedAt: string }> = await sanity.fetch(
    `*[_type=="post" && articleType=="news" && publishedAt >= $since] | order(publishedAt desc) { title, excerpt, "slug": slug.current, publishedAt }`,
    { since }
  )
  return posts.map(p => ({
    source: 'Endinheirados',
    title: p.title,
    description: p.excerpt?.slice(0, 220) || '',
    url: `${SITE}/blog/${p.slug}`,
    pubDate: p.publishedAt,
  }))
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
