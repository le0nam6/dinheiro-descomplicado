/**
 * Núcleo de publicação compartilhado entre o cron e o webhook do Telegram.
 */
import { createClient } from '@sanity/client'
import { nanoid } from 'nanoid'
import { createHmac } from 'crypto'
import { GoogleAuth } from 'google-auth-library'
import Anthropic from '@anthropic-ai/sdk'

export const SITE = 'https://portalendinheirados.com.br'

// Parse tolerante de JSON gerado por IA: às vezes vem com aspas ou quebras de
// linha não escapadas dentro de strings. Se o parse direto falhar, pede pra
// IA reparar a sintaxe (sem alterar conteúdo) antes de desistir.
export async function parseJsonSafe<T>(rawText: string, model = 'claude-haiku-4-5-20251001'): Promise<T> {
  const cleaned = rawText.replace(/^```json\n?|\n?```$/g, '')
  try {
    return JSON.parse(cleaned) as T
  } catch (err) {
    console.log('[parseJsonSafe] JSON malformado, tentando reparar via IA:', err instanceof Error ? err.message : err)
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const repairMsg = await anthropic.messages.create({
      model,
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `O JSON abaixo veio malformado (provavelmente aspas ou quebras de linha não escapadas dentro de alguma string). Conserte a sintaxe SEM alterar nenhum conteúdo de texto. Retorne SOMENTE o JSON válido, sem markdown, sem explicação:\n\n${cleaned}`,
      }],
    })
    const repairedText = (repairMsg.content[0] as { type: string; text: string }).text.trim().replace(/^```json\n?|\n?```$/g, '')
    return JSON.parse(repairedText) as T
  }
}

async function notifyGoogleIndexing(url: string) {
  const privateKey = process.env.GOOGLE_INDEXING_PRIVATE_KEY?.replace(/\\n/g, '\n')
  const clientEmail = process.env.GOOGLE_INDEXING_CLIENT_EMAIL
  if (!privateKey || !clientEmail) return

  try {
    const auth = new GoogleAuth({
      credentials: { client_email: clientEmail, private_key: privateKey },
      scopes: ['https://www.googleapis.com/auth/indexing'],
    })
    const client = await auth.getClient()
    const token = await (client as { getAccessToken: () => Promise<{ token: string }> }).getAccessToken()
    const res = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token.token}` },
      body: JSON.stringify({ url, type: 'URL_UPDATED' }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`[notifyGoogleIndexing] ${res.status} para ${url}: ${body}`)
    }
  } catch (err) {
    // não bloqueia a publicação se a indexação falhar, mas registra pra não ficar invisível
    console.error('[notifyGoogleIndexing] erro:', err instanceof Error ? err.message : err)
  }
}

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
export async function createSanityPost(post: GeneratedPost, photo: Photo, status: 'rascunho' | 'aprovado' = 'rascunho') {
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

  const created = await sanity.create({
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
    status,
    ...(post.sources?.length ? { sources: post.sources.map(s => ({ _type: 'source', _key: nanoid(6), name: s.name, url: s.url })) } : {}),
  })

  notifyGoogleIndexing(`${SITE}/blog/${slug}`)

  return created
}

// --- Humanizer (segunda passagem anti-IA) ---

const HUMANIZER_SYSTEM = `Você é um editor de copy especializado em remover marcas de texto gerado por IA e reescrever em português brasileiro coloquial, natural e com profundidade. Sua função é fazer o texto soar como um humano brasileiro escrevendo com personalidade.

REGRAS ABSOLUTAS:
1. ZERO travessão (—) em qualquer contexto. Se a frase depende dele, reescreva inteira.
2. Frases telegráficas empilhadas são proibidas: 3+ frases seguidas com menos de 6 palavras cada. Junte num raciocínio completo.
3. Paralelismo negativo ("Não é X. É Y.") máximo 1x por texto. Nunca repetido.
4. Vocabulário proibido: "crucial", "fundamental" (no sentido vago), "delve", "highlight" (verbo), "adicionalmente", "no mundo atual", "em um cenário onde", "é fundamental que", "isso se traduz em", "evidencia"/"ressalta" como gerúndio, "inovador"/"revolucionário"/"transformador", "adicionalmente". Substitua sempre por alternativas diretas.
5. Sem atribuições vagas: "especialistas afirmam", "pesquisas mostram" sem fonte real são proibidos.
6. Sem gerúndio superficial no fim de frase: "evidenciando a importância de X", "demonstrando como Y" são proibidos.
7. Sem conclusões genéricas motivacionais: "o futuro é promissor para quem abraça a mudança" e variações.
8. Use contrações naturais do português falado: "pra"/"pro", "tá", "né", "num", "numa" quando soam naturais.
9. Varie o ritmo organicamente: frases curtas para pontos diretos, mais longas para desenvolvimento. Nunca todas iguais.
10. Preserve 100% do conteúdo, dados e profundidade. Humanizar nunca é cortar.
11. Preserve subtítulos (## e ###) exatamente como estão.
12. Preserve listas com "- " no início.
13. Preserve os dados, fontes e fatos do original.

Retorne APENAS o texto humanizado, sem comentários, sem explicações, sem prefácio. Só o texto.`

export async function humanizePostBody(lines: string[]): Promise<string[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return lines

  const client = new Anthropic({ apiKey })
  const rawText = lines.join('\n\n')

  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: HUMANIZER_SYSTEM,
      messages: [{ role: 'user', content: rawText }],
    })

    const humanized = (msg.content[0] as { type: string; text: string }).text?.trim()
    if (!humanized) return lines

    // Divide de volta em linhas preservando marcadores de subtítulo e listas
    return humanized.split(/\n\n+/).map(l => l.trim()).filter(Boolean)
  } catch {
    return lines
  }
}

// --- Teclado de aprovação de post do blog ---

function adminPreviewToken(): string {
  const password = process.env.ADMIN_PASSWORD || ''
  const secret = process.env.CRON_SECRET || 'fallback-dev-secret'
  return createHmac('sha256', secret).update(password).digest('hex')
}

export function blogApprovalKeyboard(sanityId: string) {
  const previewUrl = `${SITE}/admin/preview/${sanityId}?token=${adminPreviewToken()}`
  return {
    inline_keyboard: [
      [
        { text: '✅ Aprovar', callback_data: `ba:${sanityId}` },
        { text: '❌ Rejeitar', callback_data: `br:${sanityId}` },
      ],
      [{ text: '👁 Ver conteúdo completo', url: previewUrl }],
    ],
  }
}

export function originalDraftKeyboard(sanityId: string, canDirectPublish: boolean) {
  const previewUrl = `${SITE}/admin/preview/${sanityId}?token=${adminPreviewToken()}`
  if (canDirectPublish) {
    return {
      inline_keyboard: [
        [
          { text: '✅ Publicar agora', callback_data: `ori_pub:${sanityId}` },
          { text: '❌ Descartar', callback_data: `br:${sanityId}` },
        ],
        [{ text: '👁 Ler rascunho', url: previewUrl }],
      ],
    }
  }
  return {
    inline_keyboard: [
      [{ text: '✏️ Revisar no Sanity', url: previewUrl }],
      [{ text: '❌ Descartar', callback_data: `br:${sanityId}` }],
    ],
  }
}

export function adminToken(): string {
  return adminPreviewToken()
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

/** Monta as URLs dos slides do carrossel: capa flat + conteúdo + CTA. */
export function buildSlideUrls(
  coverTitle: string,
  _photoUrl: string,
  slides: Array<{ title: string; body: string }>,
  tag = 'ENDINHEIRADOS',
) {
  const enc = encodeURIComponent
  const total = slides.length + 2
  const k = enc(coverTitle.slice(0, 48))
  const urls: string[] = []
  // Cover flat (estilo minimalista)
  urls.push(`${SITE}/api/og/slide?kind=cover&title=${enc(coverTitle)}&tag=${enc(tag)}&index=1&total=${total}`)
  slides.forEach((s, i) => {
    urls.push(`${SITE}/api/og/slide?title=${enc(s.title)}&body=${enc(s.body)}&index=${i + 2}&total=${total}&kind=content&tag=${enc(tag)}`)
  })
  urls.push(`${SITE}/api/og/slide?title=${enc('GOSTOU?')}&body=${enc('Segue @endinheirados e leia o conteúdo completo no link da bio. É de graça!')}&kind=cta&k=${k}`)
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
  // Pré-aquece os slides OG antes de chamar o Telegram.
  // Os slides são gerados dinamicamente pelo /api/og — sem pre-warm, o Telegram
  // faz download deles simultaneamente e pode timeout no cold start da Vercel,
  // causando falha silenciosa do sendMediaGroup enquanto o caption ainda chega.
  await Promise.allSettled(
    slideUrls.map(url => fetch(url, { signal: AbortSignal.timeout(12000) }))
  )

  const media = slideUrls.slice(0, 10).map((url, i) => ({
    type: 'photo',
    media: url,
    ...(i === 0 ? { caption: firstCaption } : {}),
  }))
  const res = await fetch(`https://api.telegram.org/bot${TG_TOKEN()}/sendMediaGroup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TG_CHAT(), media }),
  }).then(r => r.json())

  if (!res.ok) {
    console.error('[tgSendAlbum] sendMediaGroup falhou:', JSON.stringify(res))
    throw new Error(`sendMediaGroup falhou: ${res.description ?? JSON.stringify(res)}`)
  }
  return res
}

/** Entrega final: carrossel + legenda pronta no Telegram (para postagem manual com música). */
export async function deliverCarousel(slideUrls: string[], caption: string, blogUrl: string) {
  try {
    await tgSendAlbum(slideUrls, `🎠 Carrossel pronto pra postar (adicione a música no app)\n\n${blogUrl}`)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await tgSendMessage(`⚠️ Carrossel falhou ao ser enviado. Erro: ${msg}\n\nTente novamente via "🖼 Trocar foto e refazer carrossel" ou refaz o post.`)
  }
  await tgSendMessage(`📋 LEGENDA (copie e cole):\n\n${caption}`)
}

// ─── Fila editorial: pautas sugeridas pelo admin (Telegram ou /admin) ──────────
export type QueueKind = 'noticia' | 'materia' | 'curiosidade'
export type QueueItem = { _id: string; kind: QueueKind; brief: string; priority: number; status: string; createdAt?: string; usedRef?: string }

/** Próximo item da fila de um tipo (maior prioridade, depois mais antigo). null se vazia. */
export async function nextQueueItem(kind: QueueKind): Promise<{ _id: string; brief: string } | null> {
  return sanity.fetch(
    `*[_type=="editorialQueue" && status=="fila" && kind==$kind]|order(priority desc, createdAt asc)[0]{_id, brief}`,
    { kind }
  )
}

/** Marca um item da fila como usado, guardando o que saiu dele. */
export async function markQueueUsed(id: string, usedRef?: string) {
  await sanity.patch(id).set({ status: 'usado', usedAt: new Date().toISOString(), ...(usedRef ? { usedRef } : {}) }).commit()
}

/** Adiciona uma pauta à fila. */
export async function addQueueItem(kind: QueueKind, brief: string, source: 'telegram' | 'admin', priority = 0) {
  return sanity.create({
    _type: 'editorialQueue',
    kind, brief, priority, status: 'fila', source,
    createdAt: new Date().toISOString(),
  })
}

/** Lista a fila ativa (status "fila"), ordenada por prioridade. */
export async function listQueue(): Promise<QueueItem[]> {
  return sanity.fetch(
    `*[_type=="editorialQueue" && status=="fila"]|order(priority desc, createdAt asc){_id, kind, brief, priority, status, createdAt}`
  )
}
