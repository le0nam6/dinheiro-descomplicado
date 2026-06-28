import { NextResponse } from 'next/server'
import { sanity } from '@/lib/publish-core'

export async function GET() {
  const posts = await sanity.fetch<Array<{
    _id: string
    title: string
    excerpt: string
    publishedAt: string
    coverImageUrl: string | null
  }>>(
    `*[_type=="post" && articleType=="news" && igQueued!=true && publishedAt<=now()]
     | order(publishedAt desc)[0..9]
     { _id, title, excerpt, publishedAt, "coverImageUrl": coverImage.url }`
  )

  const result = posts.map(p => ({
    id: p._id,
    title: p.title,
    excerpt: (p.excerpt || '').slice(0, 220),
    date: new Date(p.publishedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    photoUrl: p.coverImageUrl ?? null,
  }))

  return NextResponse.json({ posts: result }, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  })
}
