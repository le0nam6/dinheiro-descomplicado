import { NextResponse } from 'next/server'
import { sanity } from '@/lib/publish-core'
import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'
import { buildEditionHtmlFromBlocks } from '@/lib/brevo'

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

export async function GET(request: Request) {
  if (!await checkAuth()) {
    return new Response('<h1>Não autorizado</h1>', { status: 401, headers: { 'Content-Type': 'text/html' } })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const date = searchParams.get('date')

  if (!id && !date) {
    return new Response('<h1>Parâmetro id ou date obrigatório</h1>', { status: 400, headers: { 'Content-Type': 'text/html' } })
  }

  const query = id
    ? `*[_id==$id][0]{ _id, date, number, status, punchline, intro, title, closing, readingTime, blocks }`
    : `*[_type=="edition" && date==$date] | order(_createdAt desc)[0]{ _id, date, number, status, punchline, intro, title, closing, readingTime, blocks }`

  const draft = await sanity.fetch(query, id ? { id } : { date })

  if (!draft) {
    return new Response('<h1>Rascunho não encontrado</h1>', { status: 404, headers: { 'Content-Type': 'text/html' } })
  }

  const html = buildEditionHtmlFromBlocks({
    date: draft.date,
    title: draft.title,
    punchline: draft.punchline,
    intro: draft.intro,
    closing: draft.closing,
    readingTime: draft.readingTime,
    blocks: draft.blocks ?? [],
  }, { preview: true })

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
