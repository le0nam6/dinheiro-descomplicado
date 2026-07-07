/**
 * Vercel Cron: para cada notícia nova, gera imagem via /api/og com a capa da matéria
 * e manda pro Telegram. Admin posta no Instagram manualmente.
 */
import { NextResponse } from 'next/server'
import { sanity, fetchPhoto, tgAlert } from '@/lib/publish-core'
import Anthropic from '@anthropic-ai/sdk'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://portalendinheirados.com.br'
const BOT = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`
const CHAT_ID = process.env.TELEGRAM_CHAT_ID!

async function getNextPost() {
  return sanity.fetch<{
    _id: string; slug: string; title: string; excerpt: string
    coverImageUrl: string | null
  } | null>(
    `*[_type=="post" && articleType=="news" && igQueued!=true && publishedAt<=now()]
     | order(publishedAt desc)[0]
     { _id, "slug": slug.current, title, excerpt, "coverImageUrl": coverImage.url }`
  )
}

async function buildCaption(post: { title: string; excerpt: string; slug: string }): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    messages: [{
      role: 'user',
      content: `Crie uma legenda para o Instagram sobre este post do blog Endinheirados.

Título: ${post.title}
Resumo: ${post.excerpt}

Formato (3 parágrafos + link + hashtags):

[PARÁGRAFO 1 — 4-5 linhas: contexto, por que importa. Tom casual]

[PARÁGRAFO 2 — 4-5 linhas: o que a matéria conta de concreto]

[PARÁGRAFO 3 — 3-4 linhas: gancho final, convida a acessar]

🔗 portalendinheirados.com.br/blog/${post.slug}

#mercadofinanceiro #HASHTAG2 #HASHTAG3 #HASHTAG4 #endinheirados

Regras: português BR coloquial, ZERO travessão, sem emojis no corpo, 5 hashtags minúsculas sem acento. Máximo 850 caracteres. Retorne APENAS a legenda.`,
    }],
  })
  return (msg.content[0] as { text: string }).text.trim().slice(0, 1024)
}

export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const post = await getNextPost()
    if (!post) return NextResponse.json({ ok: true, message: 'Sem notícia nova para o IG' })

    const date = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

    const photoUrl = post.coverImageUrl
      ?? (await fetchPhoto(`${post.title.split(' ').slice(0, 4).join(' ')} Brasil`)).url
    if (!photoUrl) throw new Error('Nenhuma foto disponível')

    const preview = (post.excerpt || '').slice(0, 220)
    const ogUrl = `${SITE}/api/og?title=${encodeURIComponent(post.title)}&photo=${encodeURIComponent(photoUrl)}&excerpt=${encodeURIComponent(preview)}&date=${encodeURIComponent(date)}&t=${Date.now()}`

    const caption = await buildCaption(post)

    // Busca a imagem gerada pelo /api/og no próprio servidor e envia como bytes
    // (Telegram não consegue acessar URLs do Vercel diretamente)
    const imgRes = await fetch(ogUrl, { signal: AbortSignal.timeout(15000) })
    if (!imgRes.ok) throw new Error(`OG image fetch failed: ${imgRes.status}`)
    const imgBuffer = await imgRes.arrayBuffer()

    const form = new FormData()
    form.append('chat_id', CHAT_ID)
    form.append('photo', new Blob([imgBuffer], { type: 'image/png' }), 'cover.png')

    const photoRes = await fetch(`${BOT}/sendPhoto`, { method: 'POST', body: form })
    if (!photoRes.ok) throw new Error(`Telegram sendPhoto: ${await photoRes.text()}`)

    await fetch(`${BOT}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: `📝 *${post.title}*\n\n${caption}`,
        parse_mode: 'Markdown',
      }),
    })

    await sanity.patch(post._id).set({ igQueued: true }).commit()

    return NextResponse.json({ ok: true, title: post.title, ogUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await tgAlert('Cron IG backlog', err)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
