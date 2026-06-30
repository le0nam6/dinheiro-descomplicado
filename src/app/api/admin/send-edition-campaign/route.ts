import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'
import { createClient } from 'next-sanity'
import { sendEditionCampaign } from '@/lib/brevo'

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

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

export async function POST(request: Request) {
  if (!await checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { date } = await request.json().catch(() => ({}))

  const edition = await sanity.fetch(
    `*[_type=="edition" && !(_id in path("drafts.**"))${date ? ' && date==$date' : ''}] | order(date desc)[0]{
      date, title, punchline, intro, closing,
      "stories": stories[]{ emoji, tag, headline, hook, what, why, "image": image{ url, alt, credit } },
      wordOfDay, curiosity, recommendation, reflection,
      "slug": slug.current
    }`,
    date ? { date } : {}
  )

  if (!edition) return NextResponse.json({ error: 'Nenhuma edição encontrada' }, { status: 404 })

  try {
    await sendEditionCampaign({
      date: edition.date,
      title: edition.title,
      url: `https://portalendinheirados.com.br/edicao/${edition.slug}`,
      punchline: edition.punchline,
      intro: edition.intro,
      closing: edition.closing,
      stories: edition.stories || [],
      wordOfDay: edition.wordOfDay,
      curiosity: edition.curiosity,
      recommendation: edition.recommendation,
      reflection: edition.reflection,
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }

  return NextResponse.json({ ok: true, date: edition.date, title: edition.title })
}
