import { createClient } from 'next-sanity'
import { NextResponse } from 'next/server'

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
})

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  if (!code) return NextResponse.json({ error: 'Código inválido' }, { status: 400 })

  const sub = await client.fetch<{ referralCount: number; email: string } | null>(
    `*[_type == "subscriber" && referralCode == $c][0]{ referralCount, email }`,
    { c: code }
  )

  if (!sub) return NextResponse.json({ error: 'Código não encontrado' }, { status: 404 })

  // Não expõe o e-mail — só as iniciais para exibição
  const initials = sub.email.split('@')[0].slice(0, 2).toUpperCase()

  return NextResponse.json({
    ok: true,
    initials,
    referralCount: sub.referralCount ?? 0,
  })
}
