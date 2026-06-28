import { NextResponse } from 'next/server'

export async function GET() {
  const params = new URLSearchParams({
    client_id: process.env.FIGMA_CLIENT_ID!,
    redirect_uri: process.env.FIGMA_REDIRECT_URI!,
    scope: 'file_read',
    state: process.env.CRON_SECRET!.slice(0, 16),
    response_type: 'code',
  })
  return NextResponse.redirect(`https://www.figma.com/oauth?${params}`)
}
