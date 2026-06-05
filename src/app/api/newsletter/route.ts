import { createClient } from 'next-sanity'
import { NextResponse } from 'next/server'

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

// Inscreve o e-mail no Beehiiv (envio automático da newsletter)
async function subscribeToBeehiiv(email: string) {
  const apiKey = process.env.BEEHIIV_API_KEY
  const pubId = process.env.BEEHIIV_PUBLICATION_ID
  if (!apiKey || !pubId) return // ainda não configurado — ignora silenciosamente

  await fetch(`https://api.beehiiv.com/v2/publications/${pubId}/subscriptions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      reactivate_existing: false,
      send_welcome_email: true,
      utm_source: 'site',
    }),
  })
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 })
    }

    // 1. Inscreve no Beehiiv (newsletter) — não bloqueia se falhar
    await subscribeToBeehiiv(email).catch(() => {})

    // 2. Salva backup no Sanity
    if (client) {
      const existing = await client.fetch(
        `*[_type == "subscriber" && email == $email][0]`,
        { email }
      )
      if (!existing) {
        await client.create({
          _type: 'subscriber',
          email,
          subscribedAt: new Date().toISOString(),
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 })
  }
}
