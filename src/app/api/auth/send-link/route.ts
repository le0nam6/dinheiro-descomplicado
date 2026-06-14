import { createClient } from 'next-sanity'
import { NextResponse } from 'next/server'
import { sendReferralLinkEmail, addContact } from '@/lib/brevo'
import { nanoid } from 'nanoid'

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: true })
    }

    const sub = await client.fetch<{ _id: string; referralCode: string | null } | null>(
      `*[_type == "subscriber" && email == $email][0]{ _id, referralCode }`,
      { email }
    )

    if (!sub) return NextResponse.json({ ok: true })

    let code = sub.referralCode

    // Subscriber antigo sem código — gera agora e salva
    if (!code) {
      code = nanoid(8)
      await client.patch(sub._id).set({ referralCode: code, referralCount: 0 }).commit()
      await addContact(email, { REFERRAL_CODE: code }).catch(() => {})
    }

    await sendReferralLinkEmail(email, code).catch(() => {})

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
