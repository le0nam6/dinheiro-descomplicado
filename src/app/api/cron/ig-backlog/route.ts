/**
 * Vercel Cron (4x/dia): envia notícia para o Telegram para publicação manual no IG.
 * Segue a diretriz: 4 notícias principais/dia + 1 carrossel à noite (aprovado via /publish).
 * Substitui o auto-post direto no Instagram — o controle editorial fica com você.
 */
import { createClient } from '@sanity/client'
import { NextResponse } from 'next/server'
import { tgAlert, tgSendPhoto, tgSendMessage } from '@/lib/publish-core'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://endinheirados.cc'

async function getPhotoQuery(title: string, excerpt: string): Promise<string> {
  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 60,
      messages: [{
        role: 'user',
        content: `Gere uma query em inglês para buscar uma foto relevante no Pexels para este artigo financeiro brasileiro.

Título: ${title}
Resumo: ${excerpt?.slice(0, 100) || ''}

Regras:
- Máximo 5 palavras em inglês
- Seja ESPECÍFICO: mencione marcas, lugares ou objetos reais quando relevante
- Evite termos genéricos como "money", "business", "finance" sozinhos
- Exemplos bons: "Azul airline Brazil airport", "Nubank credit card Brazil", "real estate apartment keys", "stock market chart screen"

Responda APENAS com a query, sem explicações.`,
      }],
    })
    return (msg.content[0] as { text: string }).text.trim()
  } catch {
    return `${title.split(' ').slice(0, 3).join(' ')} Brazil finance`
  }
}

async function getPhoto(query: string): Promise<string | null> {
  if (process.env.PEXELS_API_KEY) {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=square`,
      { headers: { Authorization: process.env.PEXELS_API_KEY } }
    )
    const d = await res.json()
    const photo = d.photos?.[0]
    if (photo) return photo.src.large2x || photo.src.large
  }
  const res = await fetch(
    `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=squarish&content_filter=high`,
    { headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` } }
  )
  const d = await res.json()
  return d.urls?.regular ?? null
}

async function getNextNewsPost() {
  const news = await sanity.fetch(
    `*[_type=="post" && articleType=="news" && igQueued != true && publishedAt <= now()]|order(publishedAt desc)[0]{"slug":slug.current,title,excerpt}`
  )
  return news ?? null
}

async function markIgQueued(slug: string) {
  const id = await sanity.fetch('*[_type=="post" && slug.current==$s][0]._id', { s: slug })
  if (id) {
    await sanity.patch(id).set({ igQueued: true }).commit()
  }
}

async function buildCaption(post: { title: string; excerpt: string; slug: string }): Promise<string> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    messages: [{
      role: 'user',
      content: `Crie uma legenda para o Instagram sobre este post do blog Endinheirados.

Título: ${post.title}
Resumo: ${post.excerpt}

Formato OBRIGATÓRIO (3 parágrafos + link + hashtags):

[PARÁGRAFO 1 — 4-5 linhas: contexto do tema, por que importa, situação cotidiana que o leitor reconhece. Tom casual, geração Z, sem enrolação]

[PARÁGRAFO 2 — 4-5 linhas: o que a matéria conta de concreto, o impacto real no bolso ou na vida do leitor]

[PARÁGRAFO 3 — 4-5 linhas: gancho final, desperta curiosidade, convida a acessar]

🔗 Leia a matéria completa: endinheirados.cc/blog/${post.slug}

#mercadofinanceiro #HASHTAG2 #HASHTAG3 #HASHTAG4 #endinheirados

Regras de estilo — OBRIGATÓRIAS:
- Português BR com fluidez e coerência textual. Contrações coloquiais ("pra", "pro", "tá", "né") são bem-vindas quando soam naturais — nunca forçadas. Artigos e preposições corretos sempre ("do", "da", "no", "na", "ao", "à"): sintaxe correta é inegociável.
- Varie o ritmo: frases curtas quando o ponto é direto, mais longas quando está desenvolvendo. Nunca todas do mesmo tamanho.
- ZERO travessão (—). Se a frase depende dele, reescreva.
- Sem frases telegráficas empilhadas (3+ frases seguidas com menos de 6 palavras cada)
- Proibido: "crucial", "fundamental", "adicionalmente", "isso se traduz em", "é importante destacar", "no cenário atual", "inovador", "transformador"
- Sem atribuições vagas ("especialistas dizem") — use raciocínio direto
- Sem gerúndio de análise colado no fim: "evidenciando a importância de X" → quebre em frase separada
- Sem conclusão motivacional vaga. Termine com algo concreto ou com gancho real.
- Sem emojis no corpo, sem clickbait, exatamente 5 hashtags minúsculas sem acento. Retorne APENAS a legenda, sem explicações.`,
    }],
  })
  return (msg.content[0] as { text: string }).text.trim()
}

export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const post = await getNextNewsPost()
    if (!post) return NextResponse.json({ ok: true, message: 'Sem notícia nova pra enfileirar no IG agora' })

    console.log(`[ig-backlog] Enfileirando para o IG: "${post.title}"`)

    const photoQuery = await getPhotoQuery(post.title, post.excerpt)
    const photoUrl = await getPhoto(photoQuery)
    if (!photoUrl) throw new Error('Nenhuma foto encontrada para o post')

    const caption = await buildCaption(post)
    const blogUrl = `${SITE}/blog/${post.slug}`

    // Gera imagem no padrão Endinheirados via /api/og
    const igImageUrl = `${SITE}/api/og?title=${encodeURIComponent(post.title.toUpperCase())}&photo=${encodeURIComponent(photoUrl)}`

    // Envia para o Telegram para publicação manual
    await tgSendPhoto(
      igImageUrl,
      `📲 Post para o Instagram\n\n📌 ${post.title}\n\n${blogUrl}`,
    )
    await tgSendMessage(`📋 LEGENDA (copie e cole no IG):\n\n${caption}`)

    await markIgQueued(post.slug)

    return NextResponse.json({ ok: true, channel: 'telegram', title: post.title, slug: post.slug, url: blogUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[ig-backlog] Erro:', message)
    await tgAlert('Cron IG backlog → Telegram', err)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
