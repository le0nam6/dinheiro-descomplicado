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
  coverQuery?: string
  articleType?: 'evergreen' | 'news'
  sources?: Array<{ name: string; url: string }>
}

export type Photo = { url: string; alt: string; credit: string }

const DISCLAIMER_LINES = [
  '## Transparência',
  'Este conteúdo é editorial e independente. O Endinheirados não é patrocinado pelas empresas citadas e não recebe comissão por nenhuma indicação aqui. As análises são baseadas em informações públicas e servem apenas como ponto de partida — sempre confirme taxas e condições diretamente com a empresa antes de decidir. Este material é informativo e não constitui recomendação de investimento.',
]

type Block = {
  _type: string
  _key: string
  style?: string
  listItem?: string
  level?: number
  markDefs: Array<Record<string, unknown>>
  children: Array<Record<string, unknown>>
}

function toBlocks(lines: string[]): Block[] {
  return lines.map(line => {
    const trimmed = line.trim()
    // Lista com marcador (- item ou * item)
    if (/^[-*]\s+/.test(trimmed)) {
      return {
        _type: 'block', _key: nanoid(8), style: 'normal', listItem: 'bullet', level: 1,
        markDefs: [], children: [{ _type: 'span', _key: nanoid(6), text: trimmed.replace(/^[-*]\s+/, ''), marks: [] }],
      } as Block
    }
    // Lista numerada (1. item)
    if (/^\d+\.\s+/.test(trimmed)) {
      return {
        _type: 'block', _key: nanoid(8), style: 'normal', listItem: 'number', level: 1,
        markDefs: [], children: [{ _type: 'span', _key: nanoid(6), text: trimmed.replace(/^\d+\.\s+/, ''), marks: [] }],
      } as Block
    }
    // Citação
    if (trimmed.startsWith('> ')) {
      return {
        _type: 'block', _key: nanoid(8), style: 'blockquote',
        markDefs: [], children: [{ _type: 'span', _key: nanoid(6), text: trimmed.slice(2), marks: [] }],
      }
    }
    // Cabeçalhos e parágrafo normal
    return {
      _type: 'block',
      _key: nanoid(8),
      style: line.startsWith('### ') ? 'h3' : line.startsWith('## ') ? 'h2' : 'normal',
      markDefs: [] as Array<Record<string, unknown>>,
      children: [{ _type: 'span', _key: nanoid(6), text: line.replace(/^#{2,3} /, ''), marks: [] }],
    }
  })
}

/** Cria o post publicado no Sanity. Se o slug já existir, gera um sufixo único. */
export async function createSanityPost(post: GeneratedPost, photo: Photo) {
  let slug = post.slug
  for (let n = 2; n <= 20; n++) {
    const existing = await sanity.fetch('*[_type=="post" && slug.current==$s][0]._id', { s: slug })
    if (!existing) break
    slug = `${post.slug}-${n}`
  }

  const bodyLines = [...post.body]
  if (post.funnel === 'bofu') bodyLines.push(...DISCLAIMER_LINES)

  const body = toBlocks(bodyLines)

  // Linkagem interna (SEO): "Leia também" com 2-3 posts relacionados
  const related: Array<{ title: string; slug: string }> = await sanity.fetch(
    `*[_type=="post" && category==$cat && slug.current!=$slug]|order(publishedAt desc)[0...3]{title,"slug":slug.current}`,
    { cat: post.category, slug }
  )
  if (related.length) {
    body.push({
      _type: 'block', _key: nanoid(8), style: 'h2', markDefs: [],
      children: [{ _type: 'span', _key: nanoid(6), text: 'Leia também', marks: [] }],
    })
    for (const r of related) {
      const linkKey = nanoid(6)
      body.push({
        _type: 'block', _key: nanoid(8), style: 'normal',
        markDefs: [{ _type: 'link', _key: linkKey, href: `${SITE}/blog/${r.slug}` }],
        children: [{ _type: 'span', _key: nanoid(6), text: r.title, marks: [linkKey] }],
      })
    }
  }

  return sanity.create({
    _type: 'post',
    title: post.title,
    slug: { _type: 'slug', current: slug },
    publishedAt: new Date().toISOString(),
    funnel: post.funnel,
    category: post.category,
    excerpt: post.excerpt.slice(0, 160),
    coverImage: photo.url ? { url: photo.url, alt: photo.alt, credit: photo.credit } : undefined,
    body,
    seoKeywords: post.seoKeywords,
    readingTime: post.readingTime,
    articleType: post.articleType || 'evergreen',
    ...(post.sources?.length ? { sources: post.sources.map(s => ({ _type: 'source', _key: nanoid(6), name: s.name, url: s.url })) } : {}),
  })
}

// --- Alertas de falha no Telegram (#1) ---
export async function tgAlert(context: string, error: unknown) {
  if (!tgConfigured()) return
  const msg = error instanceof Error ? error.message : String(error)
  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: `❌ FALHA: ${context}\n\n${msg.slice(0, 500)}`,
    }),
  }).catch(() => {})
}

// --- Memória de temas: títulos recentes para evitar repetição (#2) ---
export async function getRecentTitles(limit = 15): Promise<string[]> {
  return sanity.fetch(`*[_type=="post"]|order(publishedAt desc)[0...${limit}].title`)
}

// Todos os títulos já publicados numa categoria específica (evita cluster de tema)
export async function getTitlesByCategory(category: string): Promise<string[]> {
  return sanity.fetch(
    `*[_type=="post" && category==$cat]|order(publishedAt desc).title`,
    { cat: category }
  )
}

// --- Fotos recentes usadas (evita repetição) ---
export async function getRecentPhotoUrls(limit = 30): Promise<string[]> {
  const urls: string[] = await sanity.fetch(
    `*[_type=="post" && defined(coverImage.url)]|order(publishedAt desc)[0...${limit}].coverImage.url`
  )
  return urls.filter(Boolean)
}

// --- Busca de imagens via Serper (Google Images) ---
const BLOCKED_IMAGE_DOMAINS = [
  // Redes sociais
  'instagram.com', 'facebook.com', 'twitter.com', 'x.com', 'tiktok.com',
  'pinterest.com', 'linkedin.com', 'youtube.com', 'reddit.com', 'snapchat.com',
  'tumblr.com', 'threads.net', 'bsky.app',
  // Bancos de imagens com marca d'água
  'dreamstime.com', 'istockphoto.com', 'gettyimages.com', 'shutterstock.com',
  'alamy.com', 'depositphotos.com', '123rf.com', 'stock.adobe.com',
  'bigstockphoto.com', 'canstockphoto.com', 'vectorstock.com',
]

function isBlockedImageUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase()
    return BLOCKED_IMAGE_DOMAINS.some(d => host === d || host.endsWith('.' + d))
  } catch {
    return false
  }
}

export async function fetchSerperImages(query: string, n = 3): Promise<Photo[]> {
  const key = process.env.SERPER_API_KEY
  if (!key) return []
  try {
    const res = await fetch('https://google.serper.dev/images', {
      method: 'POST',
      headers: { 'X-API-KEY': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query, gl: 'br', hl: 'pt', num: n * 4 }),
      signal: AbortSignal.timeout(6000),
    })
    const d = await res.json()
    return ((d.images ?? []) as Array<{ imageUrl: string; title: string; source: string }>)
      .filter(img => img.imageUrl && !isBlockedImageUrl(img.imageUrl))
      .slice(0, n)
      .map(img => ({ url: img.imageUrl, alt: img.title || query, credit: `Foto: ${img.source}` }))
  } catch {
    return []
  }
}

// --- Busca de foto reutilizável: Pexels → Unsplash (#4 trocar foto) ---
export async function fetchPhoto(query: string, excludeUrls: string[] = []): Promise<Photo> {
  if (process.env.PEXELS_API_KEY) {
    // Busca 15 fotos em duas páginas alternadas (evita sempre pegar o mesmo top-1)
    const page = Math.random() < 0.5 ? 1 : 2
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&page=${page}&orientation=square`,
      { headers: { Authorization: process.env.PEXELS_API_KEY } }
    ).then(r => r.json()).catch(() => null)
    const photos = (res?.photos ?? []) as Array<{ src: { large2x: string; large: string }; alt?: string; photographer?: string }>
    const excludeSet = new Set(excludeUrls)
    const pick = photos.find(p => !excludeSet.has(p.src.large2x || p.src.large)) || photos[0]
    if (pick) return { url: pick.src.large2x || pick.src.large, alt: pick.alt || query, credit: `Foto: ${pick.photographer} via Pexels` }
  }
  const u = await fetch(
    `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=squarish&content_filter=high`,
    { headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` } }
  ).then(r => r.json()).catch(() => null)
  return { url: u?.urls?.regular ?? '', alt: u?.alt_description ?? query, credit: `Foto: ${u?.user?.name ?? 'Unsplash'} via Unsplash` }
}

/** Monta as URLs dos slides do carrossel: capa (foto) + conteúdo + CTA. */
export function buildSlideUrls(coverTitle: string, photoUrl: string, slides: Array<{ title: string; body: string }>) {
  const enc = encodeURIComponent
  const total = slides.length + 2
  // Token único por post: o slide CTA tem texto fixo e URL idêntica em todo post,
  // o que faz Telegram/CDN reusarem uma imagem cacheada (tamanho antigo). O token
  // muda a URL a cada post e fura o cache, garantindo a geração 1080x1350.
  const k = enc(coverTitle.slice(0, 48))
  const urls: string[] = []
  urls.push(`${SITE}/api/og?title=${enc(coverTitle)}&photo=${enc(photoUrl)}&cta=${enc('ARRASTA PRO LADO →')}`)
  slides.forEach((s, i) => {
    urls.push(`${SITE}/api/og/slide?title=${enc(s.title)}&body=${enc(s.body)}&index=${i + 2}&total=${total}&kind=content`)
  })
  urls.push(`${SITE}/api/og/slide?title=${enc('QUER O GUIA COMPLETO?')}&body=${enc('Toca no link da bio e leia o conteúdo completo no nosso site. É de graça!')}&index=${total}&total=${total}&kind=cta&k=${k}`)
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
