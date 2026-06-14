import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'
import { createClient } from '@sanity/client'
import Anthropic from '@anthropic-ai/sdk'

function sessionToken(password: string) {
  const secret = process.env.CRON_SECRET || 'fallback-dev-secret'
  return createHmac('sha256', secret).update(password).digest('hex')
}

async function checkAuth() {
  const password = process.env.ADMIN_PASSWORD
  if (!password) return false
  const store = await cookies()
  const cookie = store.get('admin_auth')?.value
  if (!cookie) return false
  const expected = sessionToken(password)
  const a = Buffer.from(cookie)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

async function generateTitle(headlines: string[], tags: string[]): Promise<string> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const context = headlines.map((h, i) => `${tags[i] ? `[${tags[i]}] ` : ''}${h}`).join(' | ')
  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 100,
    messages: [{
      role: 'user',
      content: `Com base nessas manchetes de uma edição diária de finanças pessoais brasileira, gere UM título jornalístico temático.

Manchetes: ${context}

Regras:
- Máximo 70 caracteres
- Inclua a keyword principal do dia (Dólar, Selic, Ibovespa, Bitcoin, nome de empresa, etc.)
- Tom direto, sem clickbait, sem ponto de exclamação
- Exemplos: "Dólar sobe e Copom mantém juros: o que muda no seu bolso" / "Bitcoin passa dos R$ 600 mil e FIIs pagam dividendo recorde"
- Retorne APENAS o título, sem aspas, sem explicação`,
    }],
  })
  return ((msg.content[0] as { text: string }).text || '').trim().replace(/^["']|["']$/g, '')
}

export async function POST() {
  if (!await checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sanity = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    token: process.env.SANITY_API_TOKEN,
    apiVersion: '2024-01-01',
    useCdn: false,
  })

  // Busca edições com título genérico
  const editions: Array<{
    _id: string
    date: string
    title: string
    stories?: Array<{ headline?: string; tag?: string }>
  }> = await sanity.fetch(
    `*[_type=="edition" && title match "Edição de *"] | order(date asc) { _id, date, title, "stories": stories[]{ headline, tag } }`
  )

  if (editions.length === 0) {
    return NextResponse.json({ ok: true, message: 'Nenhuma edição com título genérico encontrada' })
  }

  const updated: string[] = []
  const failed: string[] = []

  for (const e of editions) {
    try {
      const headlines = (e.stories || []).map(s => s.headline || '').filter(Boolean)
      const tags = (e.stories || []).map(s => s.tag || '')

      if (headlines.length === 0) {
        failed.push(`${e.date} (sem manchetes)`)
        continue
      }

      const title = await generateTitle(headlines, tags)

      if (!title || title.length > 120) {
        failed.push(`${e.date} (título inválido: ${title})`)
        continue
      }

      await sanity.patch(e._id).set({ title }).commit()
      updated.push(`${e.date} → ${title}`)

      // Pequena pausa para não sobrecarregar a API
      await new Promise(r => setTimeout(r, 300))
    } catch (err) {
      failed.push(`${e.date} (${err instanceof Error ? err.message : String(err)})`)
    }
  }

  return NextResponse.json({ ok: true, updated, failed, total: editions.length })
}
