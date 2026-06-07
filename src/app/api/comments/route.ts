/**
 * Comentários próprios (sem login).
 * GET  /api/comments?slug=...      → lista comentários aprovados
 * POST /api/comments {slug,name,body,website?}  → cria comentário (website = honeypot)
 */
import { NextResponse } from 'next/server'
import { sanity, SITE, tgConfigured } from '@/lib/publish-core'

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'slug obrigatório' }, { status: 400 })
  const comments = await sanity.fetch(
    `*[_type=="comment" && slug==$slug && approved==true]|order(createdAt asc){_id, name, body, createdAt}`,
    { slug }
  )
  return NextResponse.json({ ok: true, comments })
}

export async function POST(request: Request) {
  const { slug, name, body, website } = await request.json().catch(() => ({}))

  // honeypot: bots preenchem o campo escondido "website"
  if (website) return NextResponse.json({ ok: true })

  const cleanName = (name || '').toString().trim().slice(0, 60)
  const cleanBody = (body || '').toString().trim().slice(0, 2000)
  if (!slug || cleanName.length < 2 || cleanBody.length < 2) {
    return NextResponse.json({ error: 'Preencha nome e comentário.' }, { status: 400 })
  }
  // bloqueio simples de spam: muitos links
  if ((cleanBody.match(/https?:\/\//g) || []).length > 2) {
    return NextResponse.json({ error: 'Comentário com muitos links.' }, { status: 400 })
  }

  const doc = await sanity.create({
    _type: 'comment', slug, name: cleanName, body: cleanBody,
    createdAt: new Date().toISOString(), approved: true,
  })

  // avisa no Telegram (para moderação)
  if (tgConfigured()) {
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: `💬 Novo comentário\n\n👤 ${cleanName}\n"${cleanBody.slice(0, 200)}"\n\n${SITE}/blog/${slug}`,
        disable_web_page_preview: true,
      }),
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true, comment: { _id: doc._id, name: cleanName, body: cleanBody, createdAt: doc.createdAt } })
}
