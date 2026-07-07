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

// Retorna candidatos do pendingEdition do dia (ou da data passada via ?date=)
export async function GET(request: Request) {
  if (!await checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') || new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())

  const pending = await sanity.fetch(
    `*[_type=="pendingEdition" && date==$date] | order(_createdAt desc)[0]{ _id, candidates, date }`,
    { date }
  )

  return NextResponse.json({ candidates: pending?.candidates ?? [], date })
}
