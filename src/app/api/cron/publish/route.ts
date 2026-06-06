/**
 * Vercel Cron: gera post no blog + publica no Instagram
 * Roda 4x/dia: 9h (notícia), 12h (evergreen), 15h (notícia), 18h (evergreen)
 * Configurado em vercel.json
 */
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@sanity/client'
import { nanoid } from 'nanoid'
import { NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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

// --- Calendário de conteúdo ---

const EVERGREEN_FUNNEL: Record<number, Record<number, string>> = {
  0: { 12: 'tofu', 18: 'mofu' },
  1: { 12: 'mofu', 18: 'bofu' },
  2: { 12: 'bofu', 18: 'tofu' },
  3: { 12: 'tofu', 18: 'mofu' },
  4: { 12: 'mofu', 18: 'bofu' },
  5: { 12: 'bofu', 18: 'tofu' },
  6: { 12: 'tofu', 18: 'mofu' },
}

const CATEGORY_MAP: Record<string, string> = {
  tofu: 'educação financeira',
  mofu: 'investimentos',
  bofu: 'cartão de crédito',
}

function getSchedule() {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const hour = now.getHours()
  const day  = now.getDay()
  if (hour === 9 || hour === 15) return { type: 'news', funnel: 'tofu', hour }
  const funnel = EVERGREEN_FUNNEL[day]?.[hour] ?? 'mofu'
  return { type: 'evergreen', funnel, hour }
}

// --- Buscar notícias ---

async function fetchNews(): Promise<string> {
  const feeds = [
    'https://www.infomoney.com.br/feed/',
    'https://g1.globo.com/rss/g1/economia/',
    'https://exame.com/feed/',
  ]
  const items: string[] = []
  await Promise.allSettled(feeds.map(async url => {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
      const xml = await res.text()
      const titles = [...xml.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/g)]
        .slice(1, 4).map(m => (m[1] || m[2]).trim())
      items.push(...titles)
    } catch { /* feed indisponível */ }
  }))
  return items.slice(0, 8).join('\n')
}

// --- Gerar post com Claude ---

async function generatePost(schedule: ReturnType<typeof getSchedule>, news: string) {
  const { type, funnel } = schedule

  const funnelGuide = {
    tofu: 'topo de funil (awareness): tema amplo, desperta curiosidade, ideal para quem nunca investiu',
    mofu: 'meio de funil (consideration): comparações, como-fazer, aprofundamento prático',
    bofu: 'fundo de funil (decision): recomendações específicas, ranking, melhores opções do momento',
  }[funnel]

  const context = type === 'news'
    ? `Com base nestas notícias financeiras recentes do mercado brasileiro:\n${news}\n\nEscolha a mais relevante e educativa.`
    : `Crie um post evergreen (${funnelGuide}) sobre finanças pessoais para o público brasileiro.`

  const prompt = `${context}

Você escreve para o blog Endinheirados (endinheirados.cc), portal de finanças pessoais para brasileiros da Geração Z.

ESTILO OBRIGATÓRIO — linguagem informal, descontraída, acessível:
- Tom de amigo que entende de finanças, não de professor
- Frases curtas. Parágrafos curtos (3-4 linhas max).
- Use "você", "bora", "olha", "cara", com naturalidade
- Comparações com coisas do dia a dia: Nubank, Netflix, iFood, PIX
- Zero jargão corporativo. Se usar termo técnico, explica na mesma frase
- Começa o artigo direto no assunto — sem "Olá leitores" nem introduções genéricas

REGRAS DO CORPO (body) — CRÍTICO:
- ZERO markdown inline: sem asteriscos, sem underline, sem backticks, sem colchetes
- Textos em negrito ou itálico são PROIBIDOS — escreva em texto puro
- Subtítulos de seção começam EXATAMENTE com "## " (dois sustenidos + espaço)
- Cada item do array body é uma string: ou "## Subtítulo" ou um parágrafo simples
- Links são proibidos dentro do body

Retorne SOMENTE um JSON válido (sem texto fora do JSON):
{
  "title": "título chamativo em português, max 70 chars",
  "slug": "slug-url-amigavel-sem-acento",
  "excerpt": "resumo de até 155 chars para SEO, direto ao ponto",
  "funnel": "${funnel}",
  "category": "uma de: empréstimo | cartão de crédito | financiamento | investimentos | previdência | educação financeira",
  "seoKeywords": ["kw1", "kw2", "kw3", "kw4", "kw5"],
  "readingTime": 5,
  "coverQuery": "termo em inglês para buscar foto no Unsplash (ex: money investment coins)",
  "body": [
    "## Subtítulo da primeira seção",
    "Parágrafo com texto puro, sem asteriscos nem markdown inline.",
    "Mais um parágrafo simples.",
    "## Outra seção",
    "Parágrafo puro continuando o conteúdo."
  ],
  "igCaption": "legenda instagram com 3 parágrafos de 4-5 linhas cada, tom informal genZ, sem emojis no corpo, finaliza com: \\n\\n🔗 Acesse o guia completo em endinheirados.cc/blog/SLUG\\n\\n#finançaspessoais #HASHTAG2 #HASHTAG3 #HASHTAG4 #endinheirados",
  "igTitle": "título em CAIXA ALTA para o card do Instagram, max 3 linhas de 25 chars"
}`

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = (msg.content[0] as { type: string; text: string }).text.trim()
  return JSON.parse(text.replace(/^```json\n?|\n?```$/g, ''))
}

// --- Foto Unsplash ---

async function getPhoto(query: string) {
  const res = await fetch(
    `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=squarish&content_filter=high`,
    { headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` } }
  )
  const data = await res.json()
  return {
    url: data.urls?.regular ?? null,
    alt: data.alt_description ?? query,
    credit: `Foto: ${data.user?.name ?? 'Unsplash'} via Unsplash`,
  }
}

// --- Publicar no Sanity ---

function toBlocks(lines: string[]) {
  return lines.map(line => ({
    _type: 'block',
    _key: nanoid(8),
    style: line.startsWith('### ') ? 'h3' : line.startsWith('## ') ? 'h2' : 'normal',
    markDefs: [],
    children: [{
      _type: 'span', _key: nanoid(6),
      text: line.replace(/^#{2,3} /, ''),
      marks: [],
    }],
  }))
}

async function publishToSanity(post: Record<string, unknown>, photo: { url: string; alt: string; credit: string }) {
  const existing = await sanity.fetch('*[_type=="post" && slug.current==$s][0]._id', { s: post.slug })
  if (existing) throw new Error(`Slug já existe: ${post.slug}`)

  return sanity.create({
    _type: 'post',
    title: post.title,
    slug: { _type: 'slug', current: post.slug },
    publishedAt: new Date().toISOString(),
    funnel: post.funnel,
    category: post.category,
    excerpt: (post.excerpt as string).slice(0, 160),
    coverImage: photo.url ? { url: photo.url, alt: photo.alt, credit: photo.credit } : undefined,
    body: toBlocks(post.body as string[]),
    seoKeywords: post.seoKeywords,
    readingTime: post.readingTime,
  })
}

// --- Publicar no Instagram via URL ---

async function publishToInstagram(imageUrl: string, caption: string) {
  const createRes = await fetch(`${GRAPH}/${IG_USER_ID}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: imageUrl, caption, access_token: IG_TOKEN }),
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
  return pubData.id as string
}

// --- Handler principal ---

export async function GET(request: Request) {
  // Verifica token de segurança para evitar chamadas não autorizadas
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const schedule = getSchedule()
    console.log(`[cron/publish] Rodando às ${schedule.hour}h — tipo: ${schedule.type}, funil: ${schedule.funnel}`)

    // 1. Buscar notícias se necessário
    const news = schedule.type === 'news' ? await fetchNews() : ''

    // 2. Gerar conteúdo com Claude
    const post = await generatePost(schedule, news)
    console.log(`[cron/publish] Post gerado: "${post.title}"`)

    // 3. Foto Unsplash
    const photo = await getPhoto(post.coverQuery || 'personal finance money')

    // 4. Publicar no Sanity
    const sanityDoc = await publishToSanity(post, photo)
    console.log(`[cron/publish] Publicado no Sanity: ${sanityDoc._id}`)

    // 5. Gerar imagem no padrão Endinheirados via /api/og e publicar no Instagram
    let igPostId: string | null = null
    if (photo.url) {
      const igTitle = encodeURIComponent(post.igTitle as string || post.title as string)
      const igPhoto = encodeURIComponent(photo.url)
      const igImageUrl = `${SITE}/api/og?title=${igTitle}&photo=${igPhoto}`
      const caption = (post.igCaption as string).replace('SLUG', post.slug as string)
      igPostId = await publishToInstagram(igImageUrl, caption)
      console.log(`[cron/publish] Publicado no Instagram: ${igPostId}`)
    }

    return NextResponse.json({
      ok: true,
      title: post.title,
      slug: post.slug,
      sanityId: sanityDoc._id,
      igPostId,
      url: `${SITE}/blog/${post.slug}`,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[cron/publish] Erro:', message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
