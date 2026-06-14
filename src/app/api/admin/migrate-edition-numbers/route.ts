import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'
import { createClient } from '@sanity/client'

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

export async function POST() {
  if (!await checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sanity = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    token: process.env.SANITY_API_TOKEN,
    apiVersion: '2024-01-01',
    useCdn: false,
  })

  // Busca todas as edições reais (não rascunhos) ordenadas por data crescente
  const editions: Array<{ _id: string; date: string; number?: number }> = await sanity.fetch(
    `*[_type=="edition" && !($prefix in [slug.current]) && date match "20*"] | order(date asc) { _id, date, number }`,
    { prefix: 'rascunho' }
  )

  // Filtra só as que ainda não têm número
  const toNumber = editions.filter(e => !e.number)

  if (toNumber.length === 0) {
    return NextResponse.json({ ok: true, message: 'Todas as edições já têm número', total: editions.length })
  }

  // Número inicial = último número existente + 1 (ou 1 se nenhuma tem número ainda)
  const maxExisting = editions.reduce((max, e) => e.number && e.number > max ? e.number : max, 0)
  let next = maxExisting + 1

  const updated: string[] = []
  const failed: string[] = []

  for (const e of toNumber) {
    try {
      await sanity.patch(e._id).set({ number: next }).commit()
      updated.push(`#${next} → ${e.date}`)
      next++
    } catch {
      failed.push(e.date)
    }
  }

  return NextResponse.json({ ok: true, updated, failed, total: editions.length })
}
