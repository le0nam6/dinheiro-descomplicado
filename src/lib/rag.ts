/**
 * RAG — busca semântica no banco editorial (Supabase pgvector + Voyage AI).
 * Retorna chunks relevantes formatados para injeção em prompts Claude.
 */

const VOYAGE_URL = 'https://api.voyageai.com/v1/embeddings'
const SUPABASE_RPC = `${process.env.SUPABASE_URL}/rest/v1/rpc/search_editorial_knowledge`

type KnowledgeChunk = {
  source: string
  category: string
  content: string
  example: string | null
  similarity: number
}

async function embedQuery(text: string): Promise<number[]> {
  const res = await fetch(VOYAGE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: 'voyage-3-lite', input: [text] }),
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) throw new Error(`Voyage AI ${res.status}`)
  const data = await res.json()
  return data.data[0].embedding as number[]
}

async function searchKnowledge(
  embedding: number[],
  category?: string,
  matchCount = 5,
  minSimilarity = 0.45,
): Promise<KnowledgeChunk[]> {
  const res = await fetch(SUPABASE_RPC, {
    method: 'POST',
    headers: {
      apikey: process.env.SUPABASE_SERVICE_KEY!,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query_embedding: `[${embedding.join(',')}]`,
      match_count: matchCount,
      filter_category: category ?? null,
      filter_source: null,
      min_similarity: minSimilarity,
    }),
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) return []
  return (await res.json()) as KnowledgeChunk[]
}

/**
 * Busca padrões editoriais relevantes para o contexto fornecido.
 * Retorna string formatada pronta para injeção em prompt.
 */
export async function getEditorialContext(
  contextHint: string,
  categories: ('abertura' | 'tom' | 'estrutura' | 'titulo' | 'zoom-out' | 'collab' | 'geral')[],
): Promise<string> {
  if (!process.env.VOYAGE_API_KEY || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    return ''
  }

  try {
    const embedding = await embedQuery(contextHint)

    const results = await Promise.all(
      categories.map(cat => searchKnowledge(embedding, cat, 4, 0.4)),
    )

    const chunks = results
      .flat()
      .filter((c, i, arr) => arr.findIndex(x => x.content === c.content) === i)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 12)

    if (chunks.length === 0) return ''

    const grouped: Record<string, string[]> = {}
    for (const c of chunks) {
      const key = c.category
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(c.content + (c.example ? ` (ex: "${c.example}")` : ''))
    }

    const LABELS: Record<string, string> = {
      abertura: 'ABERTURAS',
      tom: 'TOM DE VOZ',
      estrutura: 'ESTRUTURA',
      titulo: 'PADRÕES DE TÍTULO',
      'zoom-out': 'MARCADORES DE PROFUNDIDADE',
      collab: 'COLLAB/PUBLICIDADE NATIVA',
      geral: 'PADRÕES GERAIS',
    }

    const lines = Object.entries(grouped).map(([cat, items]) => {
      return `${LABELS[cat] ?? cat.toUpperCase()}:\n${items.map(i => `• ${i}`).join('\n')}`
    })

    return `\nREFERÊNCIA EDITORIAL (padrões aprendidos de newsletters de referência — use como inspiração, não como template):\n${lines.join('\n\n')}\n`
  } catch {
    return ''
  }
}

const SUPABASE_RPC_SOURCE = `${process.env.SUPABASE_URL}/rest/v1/rpc/search_editorial_knowledge`

async function searchBySource(
  embedding: number[],
  source: string,
  category?: string,
  matchCount = 8,
  minSimilarity = 0.72,
): Promise<KnowledgeChunk[]> {
  const url = process.env.SUPABASE_URL
    ? `${process.env.SUPABASE_URL}/rest/v1/rpc/search_editorial_knowledge`
    : SUPABASE_RPC_SOURCE
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: process.env.SUPABASE_SERVICE_KEY!,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query_embedding: `[${embedding.join(',')}]`,
      match_count: matchCount,
      filter_category: category ?? null,
      filter_source: source,
      min_similarity: minSimilarity,
    }),
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) return []
  return (await res.json()) as KnowledgeChunk[]
}

/**
 * Busca semanticamente tópicos já publicados no blog similares ao hint fornecido.
 * Retorna string pronta para injeção no prompt, listando posts similares já publicados.
 * Threshold alto (0.72) para detectar sobreposição real de assunto.
 */
export async function getSimilarPublishedTopics(
  topicHint: string,
  category?: string,
): Promise<string> {
  if (!process.env.VOYAGE_API_KEY || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    return ''
  }
  try {
    const embedding = await embedQuery(topicHint)
    const hits = await searchBySource(embedding, 'blog-post', category, 10, 0.72)
    if (hits.length === 0) return ''
    const list = hits.map(h => `- ${h.content.split('\n')[0]} (similaridade: ${(h.similarity * 100).toFixed(0)}%)`).join('\n')
    return `\nTÓPICOS SEMANTICAMENTE SIMILARES já publicados no blog (similaridade semântica ≥ 72% — NÃO cubra o mesmo ângulo):\n${list}\n`
  } catch {
    return ''
  }
}

/**
 * Retorna TODOS os títulos já publicados na categoria via query direta no Supabase.
 * Mais confiável que busca semântica para deduplicação por categoria — sem threshold, sem miss.
 */
export async function getPublishedPostsByCategory(category: string): Promise<string> {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) return ''
  try {
    const url = new URL(`${process.env.SUPABASE_URL}/rest/v1/editorial_knowledge`)
    url.searchParams.set('source', 'eq.blog-post')
    url.searchParams.set('category', `eq.${category}`)
    url.searchParams.set('select', 'content')
    url.searchParams.set('order', 'edition_date.desc.nullslast')
    url.searchParams.set('limit', '200')

    const res = await fetch(url.toString(), {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
      },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return ''
    const rows = (await res.json()) as Array<{ content: string }>
    if (rows.length === 0) return ''
    const list = rows.map(r => `- ${r.content.split('\n')[0]}`).join('\n')
    return `\nTODOS OS TÓPICOS JÁ PUBLICADOS na categoria "${category}" (${rows.length} posts) — NÃO repita nenhum desses ângulos, nem variações próximas:\n${list}\n`
  } catch {
    return ''
  }
}

/**
 * Indexa um post recém-publicado no RAG para evitar repetição futura.
 * Chamado após createSanityPost no cron de publish.
 */
export async function indexPublishedPost(post: {
  title: string
  excerpt?: string
  category?: string
  slug?: string
  publishedAt?: string
}): Promise<void> {
  if (!process.env.VOYAGE_API_KEY || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) return
  try {
    const content = post.excerpt ? `${post.title}\n${post.excerpt}` : post.title
    const embedding = await embedQuery(content)
    const hash = Array.from(
      new Uint8Array(
        await crypto.subtle.digest('MD5' as AlgorithmIdentifier, new TextEncoder().encode(content))
      )
    ).map(b => b.toString(16).padStart(2, '0')).join('')

    await fetch(`${process.env.SUPABASE_URL}/rest/v1/editorial_knowledge?on_conflict=source,content_hash`, {
      method: 'POST',
      headers: {
        apikey: process.env.SUPABASE_SERVICE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify([{
        source: 'blog-post',
        category: post.category ?? 'geral',
        content,
        content_hash: hash,
        example: null,
        edition_date: post.publishedAt?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
        metadata: JSON.stringify({ slug: post.slug }),
        embedding: `[${embedding.join(',')}]`,
      }]),
    })
  } catch { /* não bloqueia publicação em caso de falha */ }
}
