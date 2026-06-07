/**
 * Núcleo de publicação compartilhado entre o cron e o webhook do Telegram.
 */
import { createClient } from '@sanity/client'
import { nanoid } from 'nanoid'

export const SITE = 'https://endinheirados.cc'

export const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

export type GeneratedPost = {
  title: string
  slug: string
  excerpt: string
  funnel: string
  category: string
  seoKeywords?: string[]
  readingTime?: number
  body: string[]
  igCaption: string
  igTitle?: string
  carousel?: Array<{ title: string; body: string }>
}

export type Photo = { url: string; alt: string; credit: string }

const DISCLAIMER_LINES = [
  '## Transparência',
  'Este conteúdo é editorial e independente. O Endinheirados não é patrocinado pelas empresas citadas e não recebe comissão por nenhuma indicação aqui. As análises são baseadas em informações públicas e servem apenas como ponto de partida — sempre confirme taxas e condições diretamente com a empresa antes de decidir. Este material é informativo e não constitui recomendação de investimento.',
]

function toBlocks(lines: string[]) {
  return lines.map(line => ({
    _type: 'block',
    _key: nanoid(8),
    style: line.startsWith('### ') ? 'h3' : line.startsWith('## ') ? 'h2' : 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: nanoid(6), text: line.replace(/^#{2,3} /, ''), marks: [] }],
  }))
}

/** Cria o post publicado no Sanity. Lança erro se o slug já existir. */
export async function createSanityPost(post: GeneratedPost, photo: Photo) {
  const existing = await sanity.fetch('*[_type=="post" && slug.current==$s][0]._id', { s: post.slug })
  if (existing) throw new Error(`Slug já existe: ${post.slug}`)

  const bodyLines = [...post.body]
  if (post.funnel === 'bofu') bodyLines.push(...DISCLAIMER_LINES)

  return sanity.create({
    _type: 'post',
    title: post.title,
    slug: { _type: 'slug', current: post.slug },
    publishedAt: new Date().toISOString(),
    funnel: post.funnel,
    category: post.category,
    excerpt: post.excerpt.slice(0, 160),
    coverImage: photo.url ? { url: photo.url, alt: photo.alt, credit: photo.credit } : undefined,
    body: toBlocks(bodyLines),
    seoKeywords: post.seoKeywords,
    readingTime: post.readingTime,
  })
}

/** Monta as URLs dos slides do carrossel: capa (foto) + conteúdo + CTA. */
export function buildSlideUrls(coverTitle: string, photoUrl: string, slides: Array<{ title: string; body: string }>) {
  const enc = encodeURIComponent
  const total = slides.length + 2
  const urls: string[] = []
  urls.push(`${SITE}/api/og?title=${enc(coverTitle)}&photo=${enc(photoUrl)}&cta=${enc('ARRASTA PRO LADO →')}`)
  slides.forEach((s, i) => {
    urls.push(`${SITE}/api/og/slide?title=${enc(s.title)}&body=${enc(s.body)}&index=${i + 2}&total=${total}&kind=content`)
  })
  urls.push(`${SITE}/api/og/slide?title=${enc('QUER O GUIA COMPLETO?')}&body=${enc('Toca no link da bio e leia o conteúdo completo no nosso site. É de graça!')}&index=${total}&total=${total}&kind=cta`)
  return urls
}

// --- Telegram ---

const TG_TOKEN = () => process.env.TELEGRAM_BOT_TOKEN
const TG_CHAT  = () => process.env.TELEGRAM_CHAT_ID

export function tgConfigured() {
  return Boolean(TG_TOKEN() && TG_CHAT())
}

export async function tgSendMessage(text: string, replyMarkup?: unknown) {
  return fetch(`https://api.telegram.org/bot${TG_TOKEN()}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TG_CHAT(),
      text,
      disable_web_page_preview: false,
      ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
    }),
  }).then(r => r.json())
}

export async function tgSendPhoto(photoUrl: string, caption: string, replyMarkup?: unknown) {
  return fetch(`https://api.telegram.org/bot${TG_TOKEN()}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TG_CHAT(),
      photo: photoUrl,
      caption,
      ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
    }),
  }).then(r => r.json())
}

export async function tgSendAlbum(slideUrls: string[], firstCaption: string) {
  const media = slideUrls.slice(0, 10).map((url, i) => ({
    type: 'photo',
    media: url,
    ...(i === 0 ? { caption: firstCaption } : {}),
  }))
  return fetch(`https://api.telegram.org/bot${TG_TOKEN()}/sendMediaGroup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TG_CHAT(), media }),
  }).then(r => r.json())
}

/** Entrega final: carrossel + legenda pronta no Telegram (para postagem manual com música). */
export async function deliverCarousel(slideUrls: string[], caption: string, blogUrl: string) {
  await tgSendAlbum(slideUrls, `🎠 Carrossel pronto pra postar (adicione a música no app)\n\n${blogUrl}`)
  await tgSendMessage(`📋 LEGENDA (copie e cole):\n\n${caption}`)
}
