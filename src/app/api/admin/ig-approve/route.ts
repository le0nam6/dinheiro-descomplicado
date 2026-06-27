/**
 * POST /api/admin/ig-approve?postId=<sanity_id>
 * Marca o post IG como aprovado — remove da fila pendente.
 * A publicação no Instagram é feita manualmente pelo usuário.
 */
import { NextRequest, NextResponse } from 'next/server'
import { sanity } from '@/lib/publish-core'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const postId = req.nextUrl.searchParams.get('postId')
  if (!postId) return NextResponse.json({ error: 'postId obrigatório' }, { status: 400 })

  const post = await sanity.fetch<{ _id: string; igPending?: boolean } | null>(
    `*[_type=="post" && _id==$id][0]{ _id, igPending }`,
    { id: postId }
  )
  if (!post) return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 })

  await sanity.patch(postId).set({ igPending: false, igPublished: true }).commit()

  return NextResponse.json({ ok: true })
}
