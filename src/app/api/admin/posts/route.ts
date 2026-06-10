import { createClient } from 'next-sanity'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'
import { markdownToBlocks } from '@/lib/portableText'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const isConfigured = projectId && /^[a-z0-9-]+$/.test(projectId)
const client = isConfigured ? createClient({
  projectId, dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01', token: process.env.SANITY_API_TOKEN, useCdn: false,
}) : null

function sessionToken(password: string): string {
  const secret = process.env.CRON_SECRET || 'fallback-dev-secret'
  return createHmac('sha256', secret).update(password).digest('hex')
}

async function checkAuth(): Promise<boolean> {
  const password = process.env.ADMIN_PASSWORD
  if (!password) return false
  const store = await cookies()
  const cookie = store.get('admin_auth')?.value
  if (!cookie) return false
  const expected = sessionToken(password)
  const a = Buffer.from(cookie)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

function slugify(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
}

function readingTime(markdown: string): number {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

export async function GET() {
  if (!await checkAuth()) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!client) return NextResponse.json({ posts: [] })
  const posts = await client.fetch(`*[_type=="post"] | order(publishedAt desc){ _id, title, slug, category, funnel, publishedAt, excerpt }`)
  return NextResponse.json({ posts })
}

// Criar novo post (publicar agora ou agendar via publishedAt no futuro)
export async function POST(request: Request) {
  if (!await checkAuth()) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!client) return NextResponse.json({ error: 'Sanity não configurado' }, { status: 500 })

  const b = await request.json()
  const title = (b.title || '').trim()
  if (!title) return NextResponse.json({ error: 'Título obrigatório' }, { status: 400 })

  // slug único
  let slug = slugify(b.slug || title)
  const base = slug
  for (let n = 2; n <= 30; n++) {
    const exists = await client.fetch('*[_type=="post" && slug.current==$s][0]._id', { s: slug })
    if (!exists) break
    slug = `${base}-${n}`
  }

  const bodyMarkdown = b.bodyMarkdown || ''
  const doc = await client.create({
    _type: 'post',
    title,
    slug: { _type: 'slug', current: slug },
    publishedAt: b.publishedAt || new Date().toISOString(),
    funnel: b.funnel || 'tofu',
    category: b.category || 'educação financeira',
    excerpt: (b.excerpt || '').slice(0, 160),
    body: markdownToBlocks(bodyMarkdown),
    seoKeywords: Array.isArray(b.keywords) ? b.keywords : [],
    readingTime: readingTime(bodyMarkdown),
    articleType: 'evergreen',
    ...(b.coverUrl ? { coverImage: { url: b.coverUrl, alt: title, credit: b.coverCredit || '' } } : {}),
  })
  return NextResponse.json({ ok: true, id: doc._id, slug })
}

export async function PUT(request: Request) {
  if (!await checkAuth()) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!client) return NextResponse.json({ error: 'Sanity não configurado' }, { status: 500 })

  const { id, title, excerpt, category, funnel, keywords, bodyMarkdown, publishedAt, coverUrl } = await request.json()
  const patch: Record<string, unknown> = {}
  if (title !== undefined) patch.title = title
  if (excerpt !== undefined) patch.excerpt = excerpt
  if (category !== undefined) patch.category = category
  if (funnel !== undefined) patch.funnel = funnel
  if (keywords !== undefined) patch.seoKeywords = keywords
  if (publishedAt !== undefined) patch.publishedAt = publishedAt
  if (bodyMarkdown !== undefined) {
    patch.body = markdownToBlocks(bodyMarkdown)
    patch.readingTime = readingTime(bodyMarkdown)
  }
  if (coverUrl !== undefined && coverUrl) patch.coverImage = { url: coverUrl, alt: title || '', credit: '' }

  await client.patch(id).set(patch).commit()
  return NextResponse.json({ ok: true })
}
