import { createClient } from 'next-sanity'
import { NextResponse } from 'next/server'
import { addContact, sendWelcomeEmail, sendMilestoneEmail } from '@/lib/brevo'
import { getSiteSettings } from '@/lib/sanity'
import { nanoid } from 'nanoid'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const isConfigured = projectId && /^[a-z0-9-]+$/.test(projectId)

const client = isConfigured
  ? createClient({
      projectId,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
      apiVersion: '2024-01-01',
      token: process.env.SANITY_API_TOKEN,
      useCdn: false,
    })
  : null

export async function POST(request: Request) {
  try {
    const { email, referredBy } = await request.json()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 })
    }

    const referralCode = nanoid(8)

    // 1. Adiciona ao Brevo com atributo de código de indicação
    await addContact(email, {
      REFERRAL_CODE: referralCode,
      ...(referredBy ? { REFERRED_BY: referredBy } : {}),
    }).catch(() => {})

    // 2. Salva no Sanity (com referral)
    if (client) {
      const existing = await client.fetch<{ _id: string } | null>(
        `*[_type == "subscriber" && email == $email][0]{_id}`,
        { email }
      )
      if (!existing) {
        await client.create({
          _type: 'subscriber',
          email,
          subscribedAt: new Date().toISOString(),
          referralCode,
          referralCount: 0,
          ...(referredBy ? { referredBy } : {}),
        })

        // E-mail de boas-vindas (fire-and-forget)
        sendWelcomeEmail(email, referralCode).catch(() => {})

        // Incrementa contagem do referente e dispara e-mail de milestone se necessário
        if (referredBy) {
          const referrer = await client.fetch<{ _id: string; email: string; referralCode: string; referralCount: number } | null>(
            `*[_type == "subscriber" && referralCode == $c][0]{_id, email, referralCode, referralCount}`,
            { c: referredBy }
          )
          if (referrer) {
            const newCount = (referrer.referralCount || 0) + 1
            await client.patch(referrer._id).inc({ referralCount: 1 }).commit()
            // Verifica se bateu algum milestone
            const settings = await getSiteSettings().catch(() => null)
            const milestones = settings?.referralMilestones || []
            const hit = milestones.find(m => m.count === newCount)
            if (hit && referrer.email && referrer.referralCode) {
              sendMilestoneEmail(referrer.email, referrer.referralCode, hit).catch(() => {})
            }
          }
        }
      }
    }

    return NextResponse.json({ ok: true, referralCode })
  } catch {
    return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 })
  }
}
