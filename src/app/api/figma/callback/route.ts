import { NextResponse } from 'next/server'
import { sanity } from '@/lib/publish-core'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.json({ error: error || 'sem código' }, { status: 400 })
  }

  const credentials = Buffer.from(
    `${process.env.FIGMA_CLIENT_ID}:${process.env.FIGMA_CLIENT_SECRET}`
  ).toString('base64')

  const res = await fetch('https://api.figma.com/v1/oauth/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      redirect_uri: process.env.FIGMA_REDIRECT_URI!,
      code,
      grant_type: 'authorization_code',
    }),
  })

  if (!res.ok) {
    return NextResponse.json({ error: await res.text() }, { status: 500 })
  }

  const { access_token, refresh_token } = await res.json()

  // Salva tokens no Sanity (mesma estratégia do Canva)
  const doc = await sanity.fetch<{ _id: string } | null>(`*[_type=="siteSettings"][0]{ _id }`)
  if (doc) {
    await sanity.patch(doc._id).set({ figmaAccessToken: access_token, figmaRefreshToken: refresh_token }).commit()
  } else {
    await sanity.create({ _type: 'siteSettings', figmaAccessToken: access_token, figmaRefreshToken: refresh_token })
  }

  return new Response(
    `<html><body style="font-family:sans-serif;padding:2rem">
      <h2>✅ Figma conectado!</h2>
      <p>Token salvo. Pode fechar esta janela.</p>
    </body></html>`,
    { headers: { 'Content-Type': 'text/html' } }
  )
}
