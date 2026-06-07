/**
 * Vercel Cron: renova o Instagram access token mensalmente (dia 1 às 9h)
 * Após renovar, atualiza a variável de ambiente no Vercel via API
 */
import { NextResponse } from 'next/server'
import { tgAlert, tgConfigured } from '@/lib/publish-core'

async function tgInfo(text: string) {
  if (!tgConfigured()) return
  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text }),
  }).catch(() => {})
}

export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = process.env.IG_ACCESS_TOKEN
  if (!token) return NextResponse.json({ error: 'IG_ACCESS_TOKEN não configurado' }, { status: 500 })

  try {
    const res = await fetch(
      `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${token}`
    )
    const data = await res.json()

    if (!data.access_token) {
      throw new Error(`Falha ao renovar: ${JSON.stringify(data)}`)
    }

    const days = Math.round(data.expires_in / 86400)
    console.log(`[refresh-token] Token renovado — expira em ${days} dias`)
    await tgInfo(`🔑 Token do Instagram renovado com sucesso — válido por mais ${days} dias.`)

    // Nota: para atualizar a env var no Vercel automaticamente,
    // configure VERCEL_TOKEN + VERCEL_PROJECT_ID + VERCEL_TEAM_ID nas env vars
    if (process.env.VERCEL_TOKEN && process.env.VERCEL_PROJECT_ID) {
      const envRes = await fetch(
        `https://api.vercel.com/v9/projects/${process.env.VERCEL_PROJECT_ID}/env`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key: 'IG_ACCESS_TOKEN',
            value: data.access_token,
            type: 'encrypted',
            target: ['production', 'preview'],
          }),
        }
      )
      if (envRes.ok) {
        console.log('[refresh-token] Env var atualizada no Vercel')
      }
    }

    return NextResponse.json({
      ok: true,
      expiresInDays: days,
      tokenPrefix: (data.access_token as string).slice(0, 20) + '...',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[refresh-token] Erro:', message)
    await tgAlert('Renovação do token do Instagram', err)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
