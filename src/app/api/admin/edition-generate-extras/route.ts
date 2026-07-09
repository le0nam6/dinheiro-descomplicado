import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { sanity } from '@/lib/publish-core'
import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'
import { nanoid } from 'nanoid'

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

const anthropic = new Anthropic()

// POST /api/admin/edition-generate-extras
// type: 'curiosidade' | 'palavra' | 'intro'
// headlines: string[] (story headlines já selecionadas)
// draftId: string (para 'intro' — salva no Sanity)
export async function POST(request: Request) {
  if (!await checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { type, headlines = [], draftId } = await request.json()

  const context = headlines.length > 0
    ? `Histórias da edição de hoje:\n${headlines.map((h: string, i: number) => `${i + 1}. ${h}`).join('\n')}`
    : 'Edição geral de finanças brasileiras'

  if (type === 'curiosidade') {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Você é redator da newsletter Endinheirados — finanças para brasileiros, tom informal e direto.

${context}

Gere UMA curiosidade financeira surpreendente e relevante para o contexto acima. Pode ser um dado histórico, uma estatística inusitada, uma comparação inesperada. Max 80 palavras. Tom: amigo bem-informado. Sem título ou prefixo — só o texto da curiosidade.`,
      }],
    })
    return NextResponse.json({ ok: true, text: (msg.content[0] as { text: string }).text.trim() })
  }

  if (type === 'palavra') {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 250,
      messages: [{
        role: 'user',
        content: `Você é redator da newsletter Endinheirados — finanças para brasileiros, tom informal e direto.

${context}

Escolha UM termo financeiro relevante para o contexto acima (pode ser técnico mas deve ser útil no dia a dia). Retorne JSON puro, sem markdown:
{"word":"...","meaning":"explicação simples em 1-2 frases, máx 60 palavras","application":"como isso aparece na vida do leitor, 1-2 frases práticas, máx 60 palavras"}`,
      }],
    })
    const raw = (msg.content[0] as { text: string }).text.trim().replace(/^```json\n?|\n?```$/g, '')
    try {
      return NextResponse.json({ ok: true, fields: JSON.parse(raw) })
    } catch {
      return NextResponse.json({ error: 'Falha ao parsear resposta', raw }, { status: 500 })
    }
  }

  if (type === 'intro') {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 700,
      messages: [{
        role: 'user',
        content: `Você é redator da newsletter Endinheirados — finanças para brasileiros, tom informal, direto, como um amigo bem-informado.

${context}

Gere 3 opções de abertura para a edição de hoje, mais um título temático único para a edição. Cada opção de abertura:
- punchline: frase de impacto max 80 chars, informal e curiosa — baseada nas histórias acima, não genérica
- intro: 2-3 frases conectando as histórias do dia com personalidade, max 120 palavras

O título (campo "title", único, não por opção): resume o tema central da edição em poucas palavras, max 60 chars, sem ser genérico tipo "Edição de hoje". Baseie-se no fio condutor das manchetes.

Retorne JSON puro, sem markdown:
{"title":"...","options":[{"punchline":"...","intro":"..."},{"punchline":"...","intro":"..."},{"punchline":"...","intro":"..."}]}`,
      }],
    })
    const raw = (msg.content[0] as { text: string }).text.trim().replace(/^```json\n?|\n?```$/g, '')
    let parsed: { title: string; options: Array<{ punchline: string; intro: string }> }
    try {
      parsed = JSON.parse(raw)
    } catch {
      return NextResponse.json({ error: 'Falha ao parsear resposta', raw }, { status: 500 })
    }

    const title = parsed.title
    const withKeys = parsed.options.map(o => ({ ...o, _key: nanoid(8) }))

    if (draftId) {
      await sanity.patch(draftId).set({ introOptions: withKeys, selectedIntroIndex: null, title }).commit()
    }

    return NextResponse.json({ ok: true, introOptions: withKeys, title })
  }

  return NextResponse.json({ error: 'type inválido' }, { status: 400 })
}
