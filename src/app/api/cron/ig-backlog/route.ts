/**
 * Vercel Cron: para cada notícia nova, gera imagem no Canva via autofill + legenda IG
 * e manda pro Telegram. Admin posta no Instagram manualmente.
 */
import { NextResponse } from 'next/server'
import { sanity, fetchPhoto, tgAlert } from '@/lib/publish-core'
import { getToken, uploadAssetFromUrl, createIgDesign } from '@/lib/canva-api'
import Anthropic from '@anthropic-ai/sdk'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://endinheirados.cc'
const BOT = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`
const CHAT_ID = process.env.TELEGRAM_CHAT_ID!

async function getNextPost() {
  return sanity.fetch<{
    _id: string; slug: string; title: string; excerpt: string
    coverImageUrl: string | null
  } | null>(
    `*[_type=="post" && articleType=="news" && igQueued!=true && publishedAt<=now()]
     | order(publishedAt desc)[0]
     { _id, "slug": slug.current, title, excerpt, "coverImageUrl": coverImage.asset->url }`
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

🔗 endinheirados.cc/blog/${post.slug}

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

    const photoUrl = post.coverImageUrl
      ?? (await fetchPhoto(`${post.title.split(' ').slice(0, 4).join(' ')} Brasil`)).url
    if (!photoUrl) throw new Error('Nenhuma foto disponível')

    // Token único para todo o request (evita rotação dupla)
    const token = await getToken()

    // 1. Upload da foto para o Canva
    const assetId = await uploadAssetFromUrl(photoUrl, `ig-${post.slug}`, token)

    // 2. Autofill do template + export
    const date = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    const { exportUrl } = await createIgDesign({
      title: post.title,
      excerpt: post.excerpt,
      date,
      assetId,
      token,
    })

    // 3. Legenda IG
    const caption = await buildCaption(post)

    // 4. Telegram: imagem do Canva + legenda separada
    const photoRes = await fetch(`${BOT}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, photo: exportUrl, caption: `📲 *${post.title}*`, parse_mode: 'Markdown' }),
    })
    if (!photoRes.ok) throw new Error(`Telegram sendPhoto: ${await photoRes.text()}`)

    await fetch(`${BOT}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text: `📝 *Legenda IG:*\n\n${caption}`, parse_mode: 'Markdown' }),
    })

    await sanity.patch(post._id).set({ igQueued: true }).commit()

    return NextResponse.json({ ok: true, title: post.title, exportUrl, site: SITE })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await tgAlert('Cron IG backlog', err)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
