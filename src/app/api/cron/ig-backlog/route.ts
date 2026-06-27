/**
 * Vercel Cron: para cada notícia nova, gera 3 opções de imagem via /api/og e manda pro Telegram.
 * Opção 1: imagem de capa da matéria | Opções 2-3: fotos alternativas do Pexels
 * Admin escolhe qual imagem usar e posta no Instagram manualmente.
 */
import { NextResponse } from 'next/server'
import { sanity, fetchPhoto, tgAlert } from '@/lib/publish-core'
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

function firstSentence(text: string): string {
  const match = text.match(/^[^.!?]+[.!?]/)
  return match ? match[0].trim() : text.slice(0, 100)
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

function ogUrl(photo: string, post: { title: string; excerpt: string }, date: string): string {
  const preview = firstSentence(post.excerpt || '')
  return `${SITE}/api/og?title=${encodeURIComponent(post.title)}&photo=${encodeURIComponent(photo)}&excerpt=${encodeURIComponent(preview)}&date=${encodeURIComponent(date)}`
}

async function tgSendPhoto(url: string, label: string) {
  const res = await fetch(`${BOT}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, photo: url, caption: label }),
  })
  if (!res.ok) throw new Error(`Telegram sendPhoto (${label}): ${await res.text()}`)
}

export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const post = await getNextPost()
    if (!post) return NextResponse.json({ ok: true, message: 'Sem notícia nova para o IG' })

    const date = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    const query = post.title.split(' ').slice(0, 4).join(' ')

    // Foto 1: capa da matéria (ou Pexels se não tiver)
    const photo1 = post.coverImageUrl ?? (await fetchPhoto(`${query} Brasil`)).url
    if (!photo1) throw new Error('Nenhuma foto disponível')

    // Fotos 2 e 3: alternativas do Pexels, excluindo a anterior
    const alt2 = await fetchPhoto(`${query} Brasil`, [photo1])
    const alt3 = await fetchPhoto(`${query} economia`, [photo1, alt2.url])

    // Gera legenda em paralelo com as imagens
    const [caption] = await Promise.all([buildCaption(post)])

    // Envia 3 opções de imagem para o Telegram
    await tgSendPhoto(ogUrl(photo1, post, date), `🖼 Opção 1 — capa da matéria`)
    await tgSendPhoto(ogUrl(alt2.url, post, date), `🖼 Opção 2 — alternativa`)
    await tgSendPhoto(ogUrl(alt3.url, post, date), `🖼 Opção 3 — alternativa`)

    // Legenda separada
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

    return NextResponse.json({ ok: true, title: post.title })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await tgAlert('Cron IG backlog', err)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
