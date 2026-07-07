import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'

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

export async function POST(request: Request) {
  if (!await checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { headline, hook, sourceUrl, format } = await request.json()
  if (!headline) return NextResponse.json({ error: 'headline obrigatório' }, { status: 400 })

  const fmt = format || 'standard'

  const fieldsByFormat: Record<string, string> = {
    standard: `- "what": 2-3 frases objetivas sobre o que aconteceu (max 140 palavras)
- "why": 1-2 frases sobre por que isso importa pro bolso/vida do leitor (max 80 palavras)`,
    brief: `- "hook": gancho mais curto e mais impactante que o original (max 60 palavras)`,
    deep: `- "what": 2-3 frases sobre o que aconteceu (max 140 palavras)
- "why": por que importa pro leitor (max 80 palavras)
- "deepStat": um dado numérico marcante sobre o tema — inclua a fonte se souber (ex: "Mercado global de nuvem deve crescer 15-20% ao ano, segundo a Gartner")
- "deepImplication": APENAS o texto da implicação prática, sem prefixo como "Implicação prática:" — direto ao ponto, 2-3 frases (max 80 palavras)
- "deepQuote": citação concreta com números ou atribuição a uma pessoa/empresa real, NÃO uma frase genérica (ex: "A AWS tem 32% do mercado de nuvem. A Meta está chegando do zero." — ou atribua a um analista/executivo se houver declaração real)`,
    stat: `- "statNumber": o número principal da história (ex: "R$ 1,2 trilhão", "42%")
- "statLabel": o que esse número significa em 1 frase curta
- "what": contexto em 2-3 frases (max 120 palavras)
- "why": por que importa pro leitor (max 60 palavras)`,
  }

  const prompt = `Você é redator da newsletter Endinheirados — finanças explicadas de forma simples, informal e direta para brasileiros.

Matéria: ${headline}
${hook ? `Contexto/gancho: ${hook}` : ''}
${sourceUrl ? `Fonte: ${sourceUrl}` : ''}
Formato escolhido: ${fmt}

Gere os campos abaixo em JSON. Tom: amigo bem-informado, sem jargão corporativo, sem buzzwords, sem linguagem de assessoria de imprensa.

${fieldsByFormat[fmt] || fieldsByFormat.standard}

Retorne JSON puro, sem markdown, sem código fence.`

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = (msg.content[0] as { text: string }).text.trim().replace(/^```json\n?|\n?```$/g, '')

  let fields: Record<string, string>
  try {
    fields = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Falha ao parsear resposta da IA', raw }, { status: 500 })
  }

  return NextResponse.json({ ok: true, fields })
}
