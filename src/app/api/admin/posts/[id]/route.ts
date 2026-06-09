import { createClient } from 'next-sanity'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'
import { blocksToMarkdown } from '@/lib/portableText'

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

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await checkAuth()) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!client) return NextResponse.json({ error: 'Sanity não configurado' }, { status: 500 })
  const { id } = await params
  const post = await client.fetch(`*[_type=="post" && _id==$id][0]{ _id, title, slug, category, funnel, excerpt, seoKeywords, body, coverImage }`, { id })
  if (!post) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json({ post: { ...post, bodyMarkdown: blocksToMarkdown(post.body) } })
}
