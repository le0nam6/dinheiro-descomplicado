import { createClient } from 'next-sanity'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

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

export async function GET() {
  if (!(await checkAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const s = await client.fetch(`*[_type == "siteSettings"][0]{ _id, subscriberGoal, subscriberGoalReward, referralMilestones }`)
  return NextResponse.json(s ?? {})
}

export async function POST(request: Request) {
  if (!(await checkAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { subscriberGoal, subscriberGoalReward, referralMilestones } = body

  const existing = await client.fetch<{ _id: string } | null>(`*[_type == "siteSettings"][0]{ _id }`)

  if (existing?._id) {
    await client.patch(existing._id).set({ subscriberGoal, subscriberGoalReward, referralMilestones }).commit()
  } else {
    await client.create({ _type: 'siteSettings', subscriberGoal, subscriberGoalReward, referralMilestones })
  }

  return NextResponse.json({ ok: true })
}
