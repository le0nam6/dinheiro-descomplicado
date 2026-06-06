import { createClient } from 'next-sanity'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { blocksToMarkdown } from '@/lib/portableText'

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

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await checkAuth()) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!client) return NextResponse.json({ error: 'Sanity não configurado' }, { status: 500 })
  const { id } = await params
  const post = await client.fetch(`*[_type=="post" && _id==$id][0]{ _id, title, slug, category, funnel, excerpt, seoKeywords, body, coverImage }`, { id })
  if (!post) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json({ post: { ...post, bodyMarkdown: blocksToMarkdown(post.body) } })
}
