/**
 * Vercel Cron: gera post no blog + publica no Instagram
 * Roda 4x/dia: 9h (notícia), 12h (evergreen), 15h (notícia), 18h (evergreen)
 * Configurado em vercel.json
 */
import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import {
  sanity, SITE, type GeneratedPost,
  createSanityPost, buildSlideUrls, deliverCarousel,
  tgConfigured, tgSendPhoto, tgAlert, getRecentTitles,
} from '@/lib/publish-core'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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

async function generatePost(schedule: ReturnType<typeof getSchedule>, news: string, recentTitles: string[]) {
  const { type, funnel } = schedule

  const funnelGuide = {
    tofu: 'topo de funil (awareness): tema amplo, desperta curiosidade, ideal para quem nunca investiu',
    mofu: 'meio de funil (consideration): comparações, como-fazer, aprofundamento prático',
    bofu: 'fundo de funil (decision): recomendações específicas, ranking, melhores opções do momento',
  }[funnel]

  // Rotação de foco: garante cobertura recorrente do novo pilar "Ganhar Dinheiro"
  // (renda extra, MMO, sair da CLT) — ~3x/semana nos slots evergreen.
  const focusByDay = ['ganhar dinheiro', 'investimentos', 'educação financeira', 'ganhar dinheiro', 'cartão de crédito', 'investimentos', 'ganhar dinheiro']
  const focusCategory = type === 'evergreen' ? focusByDay[new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })).getDay()] : ''
  const focusGuide = focusCategory === 'ganhar dinheiro'
    ? `\n\nFOCO OBRIGATÓRIO DE HOJE — categoria "ganhar dinheiro": escreva sobre AUMENTAR A RENDA. Temas válidos: renda extra, trabalhar pela internet (MMO), freelancing, vender online, side hustle, empreender pequeno, sair da CLT com segurança, monetizar habilidades, liberdade financeira via múltiplas fontes de renda. NADA de "ganhar dinheiro rápido/garantido" — só caminhos reais e honestos. Defina "category": "ganhar dinheiro".`
    : focusCategory
      ? `\n\nFOCO DE HOJE: priorize a categoria "${focusCategory}".`
      : ''

  const avoid = recentTitles.length
    ? `\n\nNÃO REPITA estes temas já publicados recentemente (escolha um ângulo ou assunto diferente):\n${recentTitles.map(t => `- ${t}`).join('\n')}`
    : ''

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
  context += focusGuide + avoid

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
  "category": "uma de: ganhar dinheiro | empréstimo | cartão de crédito | financiamento | investimentos | previdência | educação financeira",
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

    // 2. Gerar conteúdo com Claude (evitando repetir temas recentes)
    const recentTitles = await getRecentTitles(15)
    const post = await generatePost(schedule, news, recentTitles)
    console.log(`[cron/publish] Post gerado: "${post.title}"`)

    // 3. Foto: tenta imagem do artigo original → Pexels → Unsplash
    const articleImageUrl = schedule.type === 'news' ? (post.articleImageUrl as string | undefined) : undefined
    const photo = await getPhoto(post.coverQuery || 'personal finance money', articleImageUrl)

    // 4. Modo aprovação: cria rascunho pendente e manda os botões no Telegram.
    //    O blog e o carrossel só saem depois do seu OK.
    const coverTitle = (post.igTitle as string) || (post.title as string)
    const caption = (post.igCaption as string).replace('SLUG', post.slug as string)
    const slides = Array.isArray(post.carousel)
      ? (post.carousel as Array<{ title: string; body: string }>).filter(s => s?.title && s?.body).slice(0, 4)
      : []
    const slideUrls =
      slides.length >= 2
        ? buildSlideUrls(coverTitle, photo.url, slides)
        : [`${SITE}/api/og?title=${encodeURIComponent(coverTitle)}&photo=${encodeURIComponent(photo.url)}&cta=${encodeURIComponent('LEIA A LEGENDA')}`]

    if (!tgConfigured()) {
      // Sem Telegram: fallback publica direto (comportamento antigo)
      const doc = await createSanityPost(post as unknown as GeneratedPost, photo)
      await deliverCarousel(slideUrls, caption, `${SITE}/blog/${post.slug}`)
      return NextResponse.json({ ok: true, mode: 'auto', sanityId: doc._id, slug: post.slug })
    }

    // Guarda o rascunho pendente (inclui coverQuery p/ "trocar foto")
    const coverQuery = (post.coverQuery as string) || 'personal finance money'
    const pending = await sanity.create({
      _type: 'pendingPost',
      status: 'pending',
      createdAt: new Date().toISOString(),
      data: JSON.stringify({ post: { ...post, coverQuery }, photo, slideUrls, caption }),
    })
    const id = pending._id

    const tipo = schedule.type === 'news' ? '🔥 Notícia quente' : `📚 Evergreen (${schedule.funnel.toUpperCase()})`
    await tgSendPhoto(
      slideUrls[0],
      `🆕 Post pronto pra revisão\n\n${tipo}\n📌 ${post.title}\n\n${(post.excerpt as string)}\n\nAprovar publica no blog + manda o carrossel aqui.`,
      {
        inline_keyboard: [[
          { text: '✅ Aprovar', callback_data: `ap:${id}` },
          { text: '❌ Rejeitar', callback_data: `rj:${id}` },
        ], [
          { text: '✏️ Título', callback_data: `ed:${id}` },
          { text: '📝 Legenda', callback_data: `ec:${id}` },
          { text: '🖼 Foto', callback_data: `ph:${id}` },
        ]],
      }
    )

    return NextResponse.json({ ok: true, mode: 'approval', pendingId: id, slug: post.slug })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[cron/publish] Erro:', message)
    await tgAlert(`Cron publish (${new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })})`, err)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
