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

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 })
    }

    if (!client) {
      // Sem Sanity configurado — aceita silenciosamente para não quebrar o front
      return NextResponse.json({ ok: true })
    }

    // Evita duplicados
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

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 })
  }
}
