import { NextResponse } from 'next/server'
import { sanity } from '@/lib/publish-core'
import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'

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

// POST: agenda edição (muda status para 'agendado')
export async function POST(request: Request) {
  if (!await checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const draft = await sanity.fetch(`*[_id==$id][0]{ _id, date, blocks, punchline, intro }`, { id })
  if (!draft) return NextResponse.json({ error: 'Rascunho não encontrado' }, { status: 404 })

  const storyCount = (draft.blocks ?? []).filter((b: { _type: string }) =>
    b._type === 'storyBlock' || b._type === 'headlinesBlock'
  ).length
  if (storyCount === 0) return NextResponse.json({ error: 'Adicione pelo menos uma matéria antes de agendar' }, { status: 400 })
  if (!draft.punchline && !draft.intro) return NextResponse.json({ error: 'Escolha uma abertura antes de agendar' }, { status: 400 })

  // Publishe às 5h BRT do dia da edição
  const publishedAt = new Date(`${draft.date}T05:00:00-03:00`).toISOString()

  await sanity.patch(id).set({ status: 'agendado', publishedAt }).commit()

  return NextResponse.json({ ok: true, publishedAt })
}

// DELETE: volta para rascunho
export async function DELETE(request: Request) {
  if (!await checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  await sanity.patch(id).set({ status: 'rascunho' }).commit()
  return NextResponse.json({ ok: true })
}
