/**
 * Vercel Cron: para cada notícia nova, gera imagem via Canva + legenda IG e manda pro Telegram.
 * Admin salva do Telegram e posta no Instagram manualmente.
 */
import { NextResponse } from 'next/server'
import { sanity, fetchPhoto, tgAlert } from '@/lib/publish-core'
import { getToken, uploadAssetFromUrl, createIgDesign } from '@/lib/canva-api'
import Anthropic from '@anthropic-ai/sdk'

const BOT = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`
const CHAT_ID = process.env.TELEGRAM_CHAT_ID!
const TG_CAPTION_LIMIT = 1024

async function getNextPost() {
  return sanity.fetch<{
    _id: string; slug: string; title: string; excerpt: string; publishedAt: string
    coverImageUrl: string | null
  } | null>(
    `*[_type=="post" && articleType=="news" && igQueued!=true && publishedAt<=now()]
     | order(publishedAt desc)[0]
     { _id, "slug": slug.current, title, excerpt, publishedAt, "coverImageUrl": coverImage.asset->url }`
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

Formato OBRIGATÓRIO (3 parágrafos + link + hashtags):

[PARÁGRAFO 1 — 4-5 linhas: contexto, por que importa. Tom casual]

[PARÁGRAFO 2 — 4-5 linhas: o que a matéria conta de concreto]

[PARÁGRAFO 3 — 3-4 linhas: gancho final, convida a acessar]

🔗 endinheirados.cc/blog/${post.slug}

#mercadofinanceiro #HASHTAG2 #HASHTAG3 #HASHTAG4 #endinheirados

Regras: português BR coloquial, ZERO travessão, sem emojis no corpo, 5 hashtags minúsculas sem acento. Máximo 900 caracteres. Retorne APENAS a legenda.`,
    }],
  })
  const text = (msg.content[0] as { text: string }).text.trim()
  return text.slice(0, TG_CAPTION_LIMIT)
}

async function tgSendPhoto(photoUrl: string, caption: string) {
  const res = await fetch(`${BOT}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, photo: photoUrl, caption, parse_mode: 'Markdown' }),
  })
  if (!res.ok) throw new Error(`Telegram sendPhoto failed: ${await res.text()}`)
}

async function tgSendMessage(text: string) {
  await fetch(`${BOT}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'Markdown' }),
  })
}

export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const post = await getNextPost()
    if (!post) return NextResponse.json({ ok: true, message: 'Sem notícia nova para o IG' })

    const photoUrl = post.coverImageUrl
      ?? (await fetchPhoto(`${post.title.split(' ').slice(0, 4).join(' ')} Brasil`)).url
    if (!photoUrl) throw new Error('Nenhuma foto disponível')

    const pub = new Date(post.publishedAt)
    const date = `${String(pub.getDate()).padStart(2, '0')}/${String(pub.getMonth() + 1).padStart(2, '0')} • ${String(pub.getHours()).padStart(2, '0')}:${String(pub.getMinutes()).padStart(2, '0')}`

    // 1. Token Canva (obtido uma vez — rotaciona o refresh_token)
    const canvaToken = await getToken()

    // 2. Upload foto → Canva
    const assetId = await uploadAssetFromUrl(photoUrl, `ig-${post.slug}`, canvaToken)

    // 3. Autofill template + exportar imagem
    const { exportUrl } = await createIgDesign({
      title: post.title.toUpperCase(),
      excerpt: post.excerpt.slice(0, 120),
      date,
      assetId,
      token: canvaToken,
    })

    // 4. Gerar legenda
    const caption = await buildCaption(post)

    // 5. Mandar imagem gerada + legenda pro Telegram
    await tgSendPhoto(exportUrl, `📲 *Post para o Instagram*`)
    await tgSendMessage(`📝 *Legenda:*\n\n${caption}`)

    await sanity.patch(post._id).set({ igQueued: true }).commit()

    return NextResponse.json({ ok: true, title: post.title, exportUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await tgAlert('Cron IG backlog', err)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
