/**
 * Webhook disparado pelo Sanity quando uma notícia é publicada.
 * Gera a imagem via /api/og e manda pro Telegram com botões de aprovação.
 */
import { NextResponse } from 'next/server'
import { sanity, fetchPhoto, SITE } from '@/lib/publish-core'

const BOT  = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`
const CHAT = process.env.TELEGRAM_CHAT_ID!

const FORBIDDEN = [
  'loteria', 'sorteio', 'mega sena', 'mega-sena', 'caixa econômica',
  'caixa economica', 'quina', 'lotomania', 'lotofácil', 'lotofacil',
  'dupla sena', 'timemania', 'federal loteria',
]

function isForbidden(text: string) {
  const lower = text.toLowerCase()
  return FORBIDDEN.some(k => lower.includes(k))
}

async function tg(method: string, body: Record<string, unknown>) {
  return fetch(`${BOT}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(r => r.json())
}

function igKeyboard(postId: string, altCount = 0) {
  return {
    inline_keyboard: [[
      { text: '🔄 Alternativa', callback_data: `igr:${postId}:${altCount}` },
      { text: '✅ OK, já postei', callback_data: `iga:${postId}` },
    ]],
  }
}

export async function POST(request: Request) {
  const secret = new URL(request.url).searchParams.get('secret')
  if (secret !== process.env.SANITY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const post = body as {
    _id: string; _type: string; articleType: string;
    title: string; excerpt: string; publishedAt: string | null; igQueued: boolean | undefined
    slug: { current: string }; coverImage: { url: string } | null
  }

  const isDraft = post._id?.startsWith('drafts.')

  // Só processa notícias publicadas que ainda não foram pro IG
  if (
    isDraft ||
    post._type !== 'post' ||
    post.articleType !== 'news' ||
    !post.publishedAt ||
    post.igQueued === true ||
    (post as Record<string, unknown>)._igTriggered === true
  ) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  if (isForbidden(post.title + ' ' + (post.excerpt || ''))) {
    return NextResponse.json({ ok: true, skipped: 'conteúdo proibido' })
  }

  try {
    // Marca imediatamente para evitar disparo duplo (o próprio patch abaixo dispara o webhook)
    await sanity.patch(post._id).set({ _igTriggered: true }).commit()

    const date = new Date(post.publishedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    const excerpt = (post.excerpt || '').slice(0, 220)

    const photoUrl = post.coverImage?.url
      ?? (await fetchPhoto(`${post.title.split(' ').slice(0, 4).join(' ')} Brasil`)).url

    await sanity.patch(post._id).set({ _igPhotoUrl: photoUrl }).commit()

    const ogUrl = `${SITE}/api/og?title=${encodeURIComponent(post.title)}&photo=${encodeURIComponent(photoUrl)}&excerpt=${encodeURIComponent(excerpt)}&date=${encodeURIComponent(date)}&t=${Date.now()}`

    await tg('sendPhoto', {
      chat_id: CHAT,
      photo: ogUrl,
      caption: `📸 *Nova notícia publicada*\n\n*${post.title}*\n\n${excerpt}`,
      parse_mode: 'Markdown',
      reply_markup: igKeyboard(post._id),
    })

    return NextResponse.json({ ok: true, postId: post._id })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[ig-webhook]', msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
