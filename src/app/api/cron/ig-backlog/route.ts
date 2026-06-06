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
const SITE       = 'https://endinheirados.cc'

const TOPIC_MAP: Record<string, string> = {
  'fii': 'real estate buildings', 'fundo imobiliário': 'real estate buildings',
  'tesouro': 'government treasury bonds', 'selic': 'interest rates bank',
  'cdb': 'bank savings investment', 'lci': 'bank savings',
  'cartão': 'credit card payment wallet', 'crédito': 'credit card wallet',
  'score': 'credit score bank approval', 'dívida': 'debt finance stress',
  'empréstimo': 'loan bank contract', 'financiamento': 'house keys mortgage',
  'imóvel': 'real estate house keys', 'renda passiva': 'passive income growth',
  'investimento': 'investment growth chart', 'carteira': 'portfolio diversification',
  'imposto': 'tax documents calculator', 'previdência': 'retirement savings',
  'reserva': 'emergency savings jar', 'pix': 'mobile payment smartphone',
  'juros': 'compound interest growth', 'negativ': 'debt finance worry',
}

function getPhotoQuery(title: string): string {
  const lower = title.toLowerCase()
  for (const [kw, q] of Object.entries(TOPIC_MAP)) {
    if (lower.includes(kw)) return q
  }
  return 'personal finance money'
}

async function getUnsplashPhoto(query: string) {
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

    const photoUrl = await getUnsplashPhoto(getPhotoQuery(post.title))
    if (!photoUrl) throw new Error('Unsplash não retornou foto')

    const caption = await buildCaption(post)

    // Criar container de mídia
    const createRes = await fetch(`${GRAPH}/${IG_USER_ID}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: photoUrl, caption, access_token: IG_TOKEN }),
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
