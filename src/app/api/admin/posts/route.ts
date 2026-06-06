import { createClient } from 'next-sanity'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { markdownToBlocks } from '@/lib/portableText'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const isConfigured = projectId && /^[a-z0-9-]+$/.test(projectId)
const client = isConfigured ? createClient({
  projectId, dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01', token: process.env.SANITY_API_TOKEN, useCdn: false,
}) : null

async function checkAuth() {
  const store = await cookies()
  const auth = store.get('admin_auth')?.value
  return auth && auth === (process.env.ADMIN_PASSWORD || 'endinheirados2026')
}

// Lista todos os posts
export async function GET() {
  if (!await checkAuth()) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!client) return NextResponse.json({ posts: [] })
  const posts = await client.fetch(`*[_type=="post"] | order(publishedAt desc){ _id, title, slug, category, funnel, publishedAt, excerpt }`)
  return NextResponse.json({ posts })
}

// Salva edição
export async function PUT(request: Request) {
  if (!await checkAuth()) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!client) return NextResponse.json({ error: 'Sanity não configurado' }, { status: 500 })

  const { id, title, excerpt, category, keywords, bodyMarkdown } = await request.json()
  const patch: Record<string, unknown> = {}
  if (title !== undefined) patch.title = title
  if (excerpt !== undefined) patch.excerpt = excerpt
  if (category !== undefined) patch.category = category
  if (keywords !== undefined) patch.seoKeywords = keywords
  if (bodyMarkdown !== undefined) patch.body = markdownToBlocks(bodyMarkdown)

  await client.patch(id).set(patch).commit()
  return NextResponse.json({ ok: true })
}
