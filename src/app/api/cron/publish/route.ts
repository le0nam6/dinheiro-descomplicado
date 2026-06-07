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
  const items: Array<{ title: string; description: string; url: string; imageUrl?: string }> = []
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000)

  await Promise.allSettled(feeds.map(async feedUrl => {
    try {
      const res = await fetch(feedUrl, { signal: AbortSignal.timeout(5000) })
      const xml = await res.text()
      const itemRegex = /<item>([\s\S]*?)<\/item>/g
      let match
      while ((match = itemRegex.exec(xml)) !== null) {
        const block = match[1]
        const get = (tag: string) => {
          const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
          return m ? (m[1] || m[2] || '').trim() : ''
        }
        const title = get('title')
        const description = get('description').replace(/<[^>]+>/g, '').slice(0, 300)
        const link = get('link')
        const pubDate = get('pubDate')
        if (!title || !link) continue
        if (pubDate && new Date(pubDate) < cutoff) continue
        const mediaMatch = block.match(/<media:content[^>]+url=["']([^"']+)["']/) ||
                           block.match(/<enclosure[^>]+url=["']([^"']+\.(?:jpg|jpeg|png|webp))["']/)
        const imageUrl = mediaMatch?.[1]
        items.push({ title, description, url: link, imageUrl })
      }
    } catch { /* feed indisponível */ }
  }))
  return JSON.stringify(items.slice(0, 6))
}

// --- Gerar post com Claude ---

async function generatePost(schedule: ReturnType<typeof getSchedule>, news: string) {
  const { type, funnel } = schedule

  const funnelGuide = {
    tofu: 'topo de funil (awareness): tema amplo, desperta curiosidade, ideal para quem nunca investiu',
    mofu: 'meio de funil (consideration): comparações, como-fazer, aprofundamento prático',
    bofu: 'fundo de funil (decision): recomendações específicas, ranking, melhores opções do momento',
  }[funnel]

  // Para notícias, inclui imageUrl do artigo original se disponível
  let articleImageUrl: string | undefined
  let context: string
  if (type === 'news') {
    try {
      const newsItems: Array<{ title: string; description: string; url: string; imageUrl?: string }> = JSON.parse(news)
      const picked = newsItems[0]
      articleImageUrl = picked?.imageUrl || undefined
      context = `Com base nesta notícia financeira recente do mercado brasileiro:\nTítulo: ${picked?.title}\nDescrição: ${picked?.description}\nURL: ${picked?.url}\n\nCrie um post educativo que explica o impacto dessa notícia para o brasileiro comum.`
    } catch {
      context = `Com base nestas notícias financeiras recentes:\n${news}\n\nEscolha a mais relevante.`
    }
  } else {
    context = `Crie um post evergreen (${funnelGuide}) sobre finanças pessoais para o público brasileiro.`
  }

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

INDEPENDÊNCIA EDITORIAL — CRÍTICO quando o conteúdo cita empresas, bancos, corretoras, cartões ou produtos financeiros:
- Este NÃO é um conteúdo patrocinado. NUNCA escreva como se fosse publicidade ou parceria.
- PROIBIDO usar linguagem de venda: "abra sua conta agora", "garanta já", "a melhor escolha é", "recomendamos a empresa X", CTAs para produtos específicos, ou tom promocional de uma marca.
- Mantenha neutralidade jornalística: ao comparar empresas, apresente CRITÉRIOS objetivos (taxas, custos, o que oferece) e cite PRÓS E CONTRAS de cada uma.
- Deixe claro que qualquer ranking é uma análise editorial independente baseada em informações públicas, não indicação paga.
- O leitor deve sair informado para decidir sozinho — não empurrado para uma marca.
- Não invente dados, taxas ou números específicos de empresas. Se não tiver certeza, fale de forma genérica ("costumam cobrar", "varia conforme").

Retorne SOMENTE um JSON válido (sem texto fora do JSON):
{
  "title": "título chamativo em português, max 70 chars",
  "slug": "slug-url-amigavel-sem-acento",
  "excerpt": "resumo de até 155 chars para SEO, direto ao ponto",
  "funnel": "${funnel}",
  "category": "uma de: empréstimo | cartão de crédito | financiamento | investimentos | previdência | educação financeira",
  "seoKeywords": ["kw1", "kw2", "kw3", "kw4", "kw5"],
  "readingTime": 5,
  "coverQuery": "query específica em inglês para buscar foto no Pexels. Para notícias: descreva o assunto real (ex: 'Azul airline Brazil airport plane', 'Selic interest rate Brazil bank', 'Nubank credit card Brazil'). Para evergreen: descreva a cena visual (ex: 'person counting money table', 'couple planning finances laptop'). Seja ESPECÍFICO — evite termos genéricos como 'money', 'finance', 'business'.",
  "body": [
    "## Subtítulo da primeira seção",
    "Parágrafo com texto puro, sem asteriscos nem markdown inline.",
    "Mais um parágrafo simples.",
    "## Outra seção",
    "Parágrafo puro continuando o conteúdo."
  ],
  "igCaption": "legenda instagram com 3 parágrafos de 4-5 linhas cada, tom informal genZ, sem emojis no corpo, finaliza com: \\n\\n🔗 Acesse o guia completo em endinheirados.cc/blog/SLUG\\n\\n#finançaspessoais #HASHTAG2 #HASHTAG3 #HASHTAG4 #endinheirados",
  "igTitle": "título em CAIXA ALTA para o card do Instagram, max 3 linhas de 25 chars",
  "carousel": [
    { "title": "headline curto do slide 2, max 40 chars CAIXA ALTA", "body": "explicação de 1 a 2 frases, linguagem genZ, max 180 chars" },
    { "title": "slide 3", "body": "..." },
    { "title": "slide 4", "body": "..." }
  ]
}

REGRAS DO CARROSSEL (campo carousel):
- Gere de 3 a 4 slides de conteúdo (eles virão DEPOIS do slide de capa e ANTES do slide final de CTA, que são gerados automaticamente).
- Cada slide ensina UMA ideia: um passo, um dado, uma dica prática. Nada de encher linguiça.
- title: manchete curtíssima e impactante. body: explicação clara e direta, tom de amigo.
- O carrossel deve fazer a pessoa entender o tema mesmo sem ler o blog — é conteúdo de valor, não teaser vazio.
- NUNCA soar como publi. Se citar empresa, mantenha neutralidade.`

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = (msg.content[0] as { type: string; text: string }).text.trim()
  const parsed = JSON.parse(text.replace(/^```json\n?|\n?```$/g, ''))
  // Injeta imageUrl do artigo original se existir
  if (articleImageUrl) parsed.articleImageUrl = articleImageUrl
  return parsed
}

// --- Foto: Pexels (primário) → Unsplash (fallback) ---

async function getPhoto(query: string, articleImageUrl?: string) {
  // 1. Imagem extraída diretamente do artigo de notícia (mais relevante)
  if (articleImageUrl) {
    return { url: articleImageUrl, alt: query, credit: 'Foto: Fonte original' }
  }

  // 2. Pexels — melhor para buscas específicas (notícias, marcas, locais)
  if (process.env.PEXELS_API_KEY) {
    const pRes = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=square`,
      { headers: { Authorization: process.env.PEXELS_API_KEY } }
    )
    const pData = await pRes.json()
    const photo = pData.photos?.[0]
    if (photo) {
      return {
        url: photo.src.large2x || photo.src.large,
        alt: photo.alt || query,
        credit: `Foto: ${photo.photographer} via Pexels`,
      }
    }
  }

  // 3. Unsplash — fallback
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

const DISCLAIMER_LINES = [
  '## Transparência',
  'Este conteúdo é editorial e independente. O Endinheirados não é patrocinado pelas empresas citadas e não recebe comissão por nenhuma indicação aqui. As análises são baseadas em informações públicas e servem apenas como ponto de partida — sempre confirme taxas e condições diretamente com a empresa antes de decidir. Este material é informativo e não constitui recomendação de investimento.',
]

async function publishToSanity(post: Record<string, unknown>, photo: { url: string; alt: string; credit: string }) {
  const existing = await sanity.fetch('*[_type=="post" && slug.current==$s][0]._id', { s: post.slug })
  if (existing) throw new Error(`Slug já existe: ${post.slug}`)

  const bodyLines = [...(post.body as string[])]
  // Posts de fundo de funil citam empresas/produtos: anexa disclaimer de independência
  if (post.funnel === 'bofu') bodyLines.push(...DISCLAIMER_LINES)

  return sanity.create({
    _type: 'post',
    title: post.title,
    slug: { _type: 'slug', current: post.slug },
    publishedAt: new Date().toISOString(),
    funnel: post.funnel,
    category: post.category,
    excerpt: (post.excerpt as string).slice(0, 160),
    coverImage: photo.url ? { url: photo.url, alt: photo.alt, credit: photo.credit } : undefined,
    body: toBlocks(bodyLines),
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

// --- Publicar carrossel no Instagram ---

async function publishCarousel(slideUrls: string[], caption: string) {
  // 1. Cria um container por slide (is_carousel_item)
  const childIds: string[] = []
  for (const url of slideUrls) {
    const res = await fetch(`${GRAPH}/${IG_USER_ID}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: url, is_carousel_item: true, access_token: IG_TOKEN }),
    })
    const data = await res.json()
    if (!data.id) throw new Error(`Erro ao criar slide: ${JSON.stringify(data)}`)
    childIds.push(data.id)
  }

  // Aguarda o Instagram processar as imagens
  await new Promise(r => setTimeout(r, 10000))

  // 2. Cria o container do carrossel
  const carRes = await fetch(`${GRAPH}/${IG_USER_ID}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      media_type: 'CAROUSEL',
      children: childIds.join(','),
      caption,
      access_token: IG_TOKEN,
    }),
  })
  const carData = await carRes.json()
  if (!carData.id) throw new Error(`Erro ao criar carrossel: ${JSON.stringify(carData)}`)

  await new Promise(r => setTimeout(r, 5000))

  // 3. Publica
  const pubRes = await fetch(`${GRAPH}/${IG_USER_ID}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: carData.id, access_token: IG_TOKEN }),
  })
  const pubData = await pubRes.json()
  if (!pubData.id) throw new Error(`Erro ao publicar carrossel: ${JSON.stringify(pubData)}`)
  return pubData.id as string
}

// Monta as URLs dos slides: capa (foto) + conteúdo + CTA
function buildSlideUrls(
  coverTitle: string,
  photoUrl: string,
  slides: Array<{ title: string; body: string }>,
) {
  const enc = encodeURIComponent
  const total = slides.length + 2 // capa + conteúdo + cta
  const urls: string[] = []

  // Slide 1 — capa (foto de fundo, mesmo padrão do post simples)
  urls.push(`${SITE}/api/og?title=${enc(coverTitle)}&photo=${enc(photoUrl)}`)

  // Slides de conteúdo
  slides.forEach((s, i) => {
    urls.push(
      `${SITE}/api/og/slide?title=${enc(s.title)}&body=${enc(s.body)}&index=${i + 2}&total=${total}&kind=content`
    )
  })

  // Último slide — CTA
  urls.push(
    `${SITE}/api/og/slide?title=${enc('QUER O GUIA COMPLETO?')}&body=${enc('Toca no link da bio e leia o conteúdo completo no nosso site. É de graça!')}&index=${total}&total=${total}&kind=cta`
  )

  return urls
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

    // 3. Foto: tenta imagem do artigo original → Pexels → Unsplash
    const articleImageUrl = schedule.type === 'news' ? (post.articleImageUrl as string | undefined) : undefined
    const photo = await getPhoto(post.coverQuery || 'personal finance money', articleImageUrl)

    // 4. Publicar no Sanity
    const sanityDoc = await publishToSanity(post, photo)
    console.log(`[cron/publish] Publicado no Sanity: ${sanityDoc._id}`)

    // 5. Publicar no Instagram: carrossel explicativo (capa + slides + CTA)
    let igPostId: string | null = null
    if (photo.url) {
      const coverTitle = (post.igTitle as string) || (post.title as string)
      const caption = (post.igCaption as string).replace('SLUG', post.slug as string)
      const slides = Array.isArray(post.carousel)
        ? (post.carousel as Array<{ title: string; body: string }>)
            .filter(s => s?.title && s?.body)
            .slice(0, 4)
        : []

      if (slides.length >= 2) {
        // Carrossel: capa + slides de conteúdo + CTA
        const slideUrls = buildSlideUrls(coverTitle, photo.url, slides)
        try {
          igPostId = await publishCarousel(slideUrls, caption)
          console.log(`[cron/publish] Carrossel publicado: ${igPostId} (${slideUrls.length} slides)`)
        } catch (e) {
          // Fallback para imagem única se o carrossel falhar
          console.error('[cron/publish] Carrossel falhou, usando imagem única:', e instanceof Error ? e.message : e)
          const single = `${SITE}/api/og?title=${encodeURIComponent(coverTitle)}&photo=${encodeURIComponent(photo.url)}`
          igPostId = await publishToInstagram(single, caption)
        }
      } else {
        // Sem slides suficientes: imagem única
        const single = `${SITE}/api/og?title=${encodeURIComponent(coverTitle)}&photo=${encodeURIComponent(photo.url)}`
        igPostId = await publishToInstagram(single, caption)
        console.log(`[cron/publish] Imagem única publicada: ${igPostId}`)
      }
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
