/**
 * Vercel Cron: publica 1 post do backlog no Instagram (6h diário)
 * Usa o template Canva via Graph API com foto do Unsplash
 */
import { createClient } from '@sanity/client'
import { NextResponse } from 'next/server'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const IG_USER_ID = process.env.IG_USER_ID!
const IG_TOKEN   = process.env.IG_ACCESS_TOKEN!
const GRAPH      = 'https://graph.instagram.com/v21.0'
const SITE       = process.env.NEXT_PUBLIC_SITE_URL || 'https://endinheirados.cc'

// Gera query de busca específica usando Claude Haiku
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
    // Fallback simples se Claude falhar
    return `${title.split(' ').slice(0, 3).join(' ')} Brazil finance`
  }
}

async function getPhoto(query: string): Promise<string | null> {
  // 1. Pexels — busca mais específica e relevante
  if (process.env.PEXELS_API_KEY) {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=square`,
      { headers: { Authorization: process.env.PEXELS_API_KEY } }
    )
    const d = await res.json()
    const photo = d.photos?.[0]
    if (photo) return photo.src.large2x || photo.src.large
  }
  // 2. Unsplash — fallback
  const res = await fetch(
    `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=squarish&content_filter=high`,
    { headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` } }
  )
  const d = await res.json()
  return d.urls?.regular ?? null
}

async function getNextBacklogPost() {
  // Busca todos os posts publicados no IG (lidos via campo igPublished no Sanity)
  const allPosts = await sanity.fetch(
    `*[_type=="post"]|order(publishedAt asc){"slug":slug.current,title,excerpt,igPublished}`
  )
  return allPosts.find((p: { igPublished?: boolean }) => !p.igPublished) ?? null
}

async function markIgPublished(slug: string, igId: string) {
  const doc = await sanity.fetch('*[_type=="post" && slug.current==$s][0]._id', { s: slug })
  if (doc) {
    await sanity.patch(doc).set({ igPublished: true, igPostId: igId }).commit()
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

[PARÁGRAFO 2 — 4-5 linhas: o que o guia ensina de concreto, o que o leitor vai conseguir fazer após ler]

[PARÁGRAFO 3 — 4-5 linhas: gancho final, desperta curiosidade, convida a acessar]

🔗 Acesse o guia completo em endinheirados.cc/blog/${post.slug}

#finançaspessoais #HASHTAG2 #HASHTAG3 #HASHTAG4 #endinheirados

Regras: português BR informal, sem emojis no corpo, sem clickbait, exatamente 5 hashtags minúsculas sem acento. Retorne APENAS a legenda, sem explicações.`,
    }],
  })
  return (msg.content[0] as { text: string }).text.trim()
}

export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const post = await getNextBacklogPost()
    if (!post) return NextResponse.json({ ok: true, message: 'Backlog completo — todos os posts já publicados no IG' })

    console.log(`[ig-backlog] Publicando: "${post.title}"`)

    const photoQuery = await getPhotoQuery(post.title, post.excerpt)
    console.log(`[ig-backlog] Query de foto: "${photoQuery}"`)
    const photoUrl = await getPhoto(photoQuery)
    if (!photoUrl) throw new Error('Unsplash não retornou foto')

    const caption = await buildCaption(post)

    // Gera imagem no padrão Endinheirados via /api/og
    const igTitle = encodeURIComponent(post.title.toUpperCase())
    const igPhoto = encodeURIComponent(photoUrl)
    const igImageUrl = `${SITE}/api/og?title=${igTitle}&photo=${igPhoto}`

    // Criar container de mídia
    const createRes = await fetch(`${GRAPH}/${IG_USER_ID}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: igImageUrl, caption, access_token: IG_TOKEN }),
    })
    const createData = await createRes.json()
    if (!createData.id) throw new Error(`Erro ao criar mídia: ${JSON.stringify(createData)}`)

    await new Promise(r => setTimeout(r, 8000))

    const pubRes = await fetch(`${GRAPH}/${IG_USER_ID}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: createData.id, access_token: IG_TOKEN }),
    })
    const pubData = await pubRes.json()
    if (!pubData.id) throw new Error(`Erro ao publicar: ${JSON.stringify(pubData)}`)

    await markIgPublished(post.slug, pubData.id)

    return NextResponse.json({
      ok: true,
      title: post.title,
      slug: post.slug,
      igPostId: pubData.id,
      url: `${SITE}/blog/${post.slug}`,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[ig-backlog] Erro:', message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
