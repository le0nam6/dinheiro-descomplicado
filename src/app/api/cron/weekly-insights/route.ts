/**
 * Vercel Cron (semanal): resume a performance dos posts no Instagram
 * dos últimos 7 dias e manda um digest no Telegram.
 * GA4 do blog fica como evolução futura (precisa de service account + property id).
 */
import { NextResponse } from 'next/server'
import { sanity, tgConfigured, tgAlert } from '@/lib/publish-core'
import { ga4Configured, getGA4Summary } from '@/lib/ga4'

const IG_USER_ID = process.env.IG_USER_ID!
const IG_TOKEN   = process.env.IG_ACCESS_TOKEN!
const GRAPH      = 'https://graph.instagram.com/v21.0'

type Media = {
  id: string
  caption?: string
  permalink: string
  timestamp: string
  like_count?: number
  comments_count?: number
  media_type?: string
}

async function getInsights(mediaId: string): Promise<{ reach: number; saved: number }> {
  const res = await fetch(
    `${GRAPH}/${mediaId}/insights?metric=reach,saved&access_token=${IG_TOKEN}`
  ).then(r => r.json()).catch(() => null)
  const out = { reach: 0, saved: 0 }
  for (const m of res?.data ?? []) {
    const v = m.values?.[0]?.value ?? 0
    if (m.name === 'reach') out.reach = v
    if (m.name === 'saved') out.saved = v
  }
  return out
}

export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!tgConfigured()) return NextResponse.json({ ok: false, error: 'Telegram não configurado' })

  try {
    // 1. Posts no IG dos últimos 7 dias
    const since = Date.now() - 7 * 24 * 60 * 60 * 1000
    const mediaRes = await fetch(
      `${GRAPH}/${IG_USER_ID}/media?fields=id,caption,permalink,timestamp,like_count,comments_count,media_type&limit=25&access_token=${IG_TOKEN}`
    ).then(r => r.json())
    const recent: Media[] = (mediaRes.data ?? []).filter((m: Media) => new Date(m.timestamp).getTime() >= since)

    // 2. Métricas por post
    const rows = await Promise.all(recent.map(async m => {
      const ins = await getInsights(m.id)
      return {
        title: (m.caption ?? '').split('\n')[0].slice(0, 50) || '(sem legenda)',
        likes: m.like_count ?? 0,
        comments: m.comments_count ?? 0,
        ...ins,
      }
    }))

    // 3. Blog: quantos posts saíram na semana
    const blogCount = await sanity.fetch(
      `count(*[_type=="post" && publishedAt > $since])`,
      { since: new Date(since).toISOString() }
    )

    if (rows.length === 0) {
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: `📊 Resumo semanal\n\n📝 ${blogCount} posts no blog\n📸 Nenhum post no Instagram nos últimos 7 dias ainda.` }),
      })
      return NextResponse.json({ ok: true, igPosts: 0, blogCount })
    }

    // 4. Rankings
    const totalReach = rows.reduce((s, r) => s + r.reach, 0)
    const totalSaved = rows.reduce((s, r) => s + r.saved, 0)
    const totalLikes = rows.reduce((s, r) => s + r.likes, 0)
    const bySaved = [...rows].sort((a, b) => b.saved - a.saved)
    const top = bySaved.slice(0, 3)
    const worst = bySaved[bySaved.length - 1]

    const fmt = (r: typeof rows[0]) => `• ${r.title}\n   👁 ${r.reach}  💾 ${r.saved}  ❤️ ${r.likes}`

    // Bloco do GA4 (tráfego do blog), se configurado
    let ga4Block = ''
    if (ga4Configured()) {
      try {
        const g = await getGA4Summary()
        const topPages = g.topPages.map(p => `   ${p.path} — ${p.views}`).join('\n')
        const topSources = g.sources.slice(0, 4).map(s => `   ${s.source}: ${s.sessions}`).join('\n')
        ga4Block =
          `\n\n🌐 BLOG (Google Analytics)\n` +
          `👥 ${g.users} visitantes · 🔁 ${g.sessions} sessões · 📄 ${g.pageViews} páginas\n` +
          `📲 Vindos do Instagram: ${g.instagramSessions} sessões\n\n` +
          `📄 Páginas mais vistas:\n${topPages}\n\n` +
          `🚪 De onde vem o tráfego:\n${topSources}`
      } catch (e) {
        ga4Block = `\n\n🌐 Blog: erro ao puxar GA4 (${e instanceof Error ? e.message.slice(0, 80) : 'desconhecido'})`
      }
    }

    const text =
      `📊 RESUMO DA SEMANA (Instagram)\n\n` +
      `📝 ${blogCount} posts no blog · 📸 ${rows.length} no Instagram\n` +
      `👁 Alcance total: ${totalReach}\n💾 Salvamentos: ${totalSaved}\n❤️ Curtidas: ${totalLikes}\n\n` +
      `🏆 TOP 3 (por salvamentos — melhor sinal pra finanças):\n${top.map(fmt).join('\n')}\n\n` +
      `📉 Menos engajou:\n${fmt(worst)}` +
      ga4Block +
      `\n\n💡 Salvamento alto = conteúdo útil. Vale fazer mais sobre os temas do top 3.`

    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text }),
    })

    return NextResponse.json({ ok: true, igPosts: rows.length, blogCount, totalSaved })
  } catch (err) {
    await tgAlert('Resumo semanal de insights', err)
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
