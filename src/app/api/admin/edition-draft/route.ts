import { NextResponse } from 'next/server'
import { sanity } from '@/lib/publish-core'
import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'
import { nanoid } from 'nanoid'

function sessionToken(password: string) {
  const secret = process.env.CRON_SECRET || 'fallback-dev-secret'
  return createHmac('sha256', secret).update(password).digest('hex')
}

async function checkAuth() {
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

function todayBRT() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
}

// GET: busca o rascunho de hoje (ou ?date=)
export async function GET(request: Request) {
  if (!await checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') || todayBRT()

  const draft = await sanity.fetch(
    `*[_type=="edition" && date==$date] | order(_createdAt desc)[0]{
      _id, date, number, status, introOptions, selectedIntroIndex,
      title, punchline, intro, closing, blocks
    }`,
    { date }
  )

  return NextResponse.json({ draft: draft ?? null, date })
}

// PATCH: salva blocos + intro escolhida no rascunho
export async function PATCH(request: Request) {
  if (!await checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { id, blocks, selectedIntroIndex, punchline, intro, title, closing } = body

  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  // Garante _key em cada bloco e sub-item
  const normalizedBlocks = (blocks ?? []).map((b: Record<string, unknown>) => {
    const block = { ...b, _key: (b._key as string) || nanoid(8) } as Record<string, unknown>
    if (block._type === 'headlinesBlock' && Array.isArray(block.items)) {
      block.items = (block.items as Record<string, unknown>[]).map(item => ({
        ...item, _key: (item._key as string) || nanoid(8),
      }))
    }
    if (block._type === 'marketBlock' && Array.isArray(block.items)) {
      block.items = (block.items as Record<string, unknown>[]).map(item => ({
        ...item, _key: (item._key as string) || nanoid(8),
      }))
    }
    if (block._type === 'featuredPostsBlock' && Array.isArray(block.posts)) {
      block.posts = (block.posts as Record<string, unknown>[]).map(item => ({
        ...item, _key: (item._key as string) || nanoid(8),
      }))
    }
    return block
  })

  await sanity.patch(id).set({
    blocks: normalizedBlocks,
    ...(selectedIntroIndex !== undefined ? { selectedIntroIndex } : {}),
    ...(punchline !== undefined ? { punchline } : {}),
    ...(intro !== undefined ? { intro } : {}),
    ...(title !== undefined ? { title } : {}),
    ...(closing !== undefined ? { closing } : {}),
  }).commit()

  return NextResponse.json({ ok: true })
}
