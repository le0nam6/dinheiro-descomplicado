/**
 * Pipeline de automação: pesquisa pauta → gera artigo → humaniza → imagem → publica no Sanity
 * Executado 2x/dia pelo Claude Routines (06h00 e 18h00 BRT)
 *
 * Uso: node scripts/publish-post.mjs [tofu|mofu|bofu]
 */

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@sanity/client'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

// Funil alternado: tofu manhã, bofu tarde (ou força via argumento)
const funnelArg = process.argv[2]
const hour = new Date().getHours()
const funnel = funnelArg || (hour < 12 ? 'tofu' : 'bofu')

const CLUSTERS = {
  empréstimo: ['empréstimo consignado', 'empréstimo pessoal', 'crédito FGTS', 'empréstimo online'],
  'cartão de crédito': ['cartão sem anuidade', 'cartão cashback', 'cartão de crédito para negativado'],
  investimentos: ['renda fixa 2025', 'Tesouro Direto', 'CDB', 'LCI LCA', 'fundos de investimento'],
  financiamento: ['financiamento imobiliário', 'financiamento de veículo', 'FGTS para imóvel'],
  previdência: ['PGBL vs VGBL', 'previdência privada', 'aposentadoria complementar'],
  'educação financeira': ['score de crédito', 'orçamento familiar', 'sair das dívidas', 'reserva de emergência'],
}

const ALL_TOPICS = Object.entries(CLUSTERS).flatMap(([cat, topics]) =>
  topics.map(t => ({ category: cat, topic: t }))
)

// ─── 1. Pesquisa de pauta ────────────────────────────────────────────────────
async function researchTopic() {
  const candidates = ALL_TOPICS.sort(() => Math.random() - 0.5).slice(0, 5)
  const candidateList = candidates.map((c, i) => `${i + 1}. [${c.category}] ${c.topic}`).join('\n')

  const res = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `Você é especialista em SEO para finanças no Brasil.

Analise esses tópicos candidatos e escolha o MELHOR para um artigo ${funnel.toUpperCase()} hoje (${new Date().toLocaleDateString('pt-BR')}), considerando:
- Volume de busca no Brasil
- Intenção de busca alinhada ao funil ${funnel}
- CPC alto no Google AdSense Brasil
- Oportunidade de ranquear (não muito competitivo)

Candidatos:
${candidateList}

Responda em JSON: { "index": número, "topic": "tópico escolhido", "category": "categoria", "keyword": "keyword principal", "searchIntent": "informacional|navegacional|transacional" }`
    }]
  })

  return JSON.parse(res.content[0].text.match(/\{[\s\S]*\}/)[0])
}

// ─── 2. Gera artigo SEO-first ─────────────────────────────────────────────────
async function generateArticle(topic, category, keyword, intent) {
  const funnelInstructions = {
    tofu: 'Foco educacional. Explique o conceito, tire dúvidas básicas, use tom acessível. NÃO force venda.',
    mofu: 'Foco comparativo. Compare opções, mostre prós/contras, ajude o leitor a decidir o que é melhor para o perfil dele.',
    bofu: 'Foco em conversão. Indique as melhores opções do mercado, simule valores, mostre como contratar/aplicar. CTA claro.',
  }

  const res = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `Você é redator especialista em SEO para finanças no Brasil. Escreva um artigo completo seguindo EXATAMENTE as instruções abaixo.

TÓPICO: ${topic}
KEYWORD PRINCIPAL: ${keyword}
CATEGORIA: ${category}
FUNIL: ${funnel} — ${funnelInstructions[funnel]}
INTENÇÃO DE BUSCA: ${intent}
DATA: ${new Date().toLocaleDateString('pt-BR')}

ESTRUTURA OBRIGATÓRIA (use markdown):
# [Título com keyword + ano se fizer sentido + promessa]
(meta: 60 chars máx, keyword no início)

[Introdução de 120-150 palavras que responde DIRETAMENTE a intenção de busca]

## [H2 com keyword secundária]
[conteúdo]

## [H2]
[conteúdo]

## [H2 — Vantagens e Desvantagens / Como Calcular / Como Contratar]
[conteúdo com tabela markdown se aplicável]

## Perguntas Frequentes
**P: [Pergunta que as pessoas pesquisam]**
R: [Resposta direta em 2-3 frases]
(repita 3-4 vezes com perguntas diferentes)

## Conclusão
[Resumo + próximo passo claro]

---
META:
- title_tag: [máx 60 chars, keyword no início]
- meta_description: [máx 155 chars, inclui keyword + benefício + CTA]
- slug: /[keyword-em-kebab-case-sem-stopwords]
- keywords: [5 keywords separadas por vírgula]
- reading_time: [número em minutos]

REGRAS:
- Mínimo 1.200 palavras
- Linguagem simples, BR informal mas profissional
- Dados e estatísticas reais quando relevante (cite ano)
- NUNCA use palavras: "mergulhar", "navegar", "explorar", "aprofundar", "certamente"
- NÃO use listas com marcadores para tudo — varie com parágrafos e tabelas`
    }]
  })

  return res.content[0].text
}

// ─── 3. Humaniza o texto ──────────────────────────────────────────────────────
async function humanizeArticle(article) {
  const res = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 5000,
    messages: [{
      role: 'user',
      content: `Você é um editor de conteúdo especialista. Revise o artigo abaixo para soar COMPLETAMENTE humano e natural em português brasileiro.

REGRAS DE HUMANIZAÇÃO:
1. Varie o tamanho das frases (curtas e longas alternadas)
2. Adicione expressões coloquiais brasileiras quando cabível ("na prática", "no fim do dia", "olha")
3. Remova qualquer estrutura robotizada ou muito formal
4. Mantenha TODA a estrutura SEO (H1, H2, meta, slug) INTACTA
5. NÃO adicione informações novas — apenas reescreva o estilo
6. Preserve tabelas e listas
7. O texto final deve parecer escrito por um jornalista financeiro brasileiro

ARTIGO:
${article}`
    }]
  })

  return res.content[0].text
}

// ─── 4. Busca imagem no Unsplash ──────────────────────────────────────────────
async function fetchUnsplashImage(keyword) {
  const query = encodeURIComponent(`${keyword} finance money brazil`)
  const url = `https://api.unsplash.com/photos/random?query=${query}&orientation=landscape`

  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` },
  })

  if (!res.ok) return null
  const data = await res.json()
  return {
    url: data.urls.regular,
    alt: data.alt_description || keyword,
    credit: `${data.user.name} via Unsplash`,
  }
}

// ─── 5. Parseia o artigo gerado ───────────────────────────────────────────────
function parseArticle(text) {
  const titleMatch = text.match(/^#\s+(.+)$/m)
  const metaDescMatch = text.match(/meta_description:\s*(.+)/i)
  const slugMatch = text.match(/slug:\s*\/?([\w-]+)/i)
  const keywordsMatch = text.match(/keywords:\s*(.+)/i)
  const readingTimeMatch = text.match(/reading_time:\s*(\d+)/i)

  const title = titleMatch?.[1]?.trim() || 'Artigo sem título'
  const excerpt = metaDescMatch?.[1]?.trim() || ''
  const slug = slugMatch?.[1]?.trim() || title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const keywords = keywordsMatch?.[1]?.split(',').map(k => k.trim()) || []
  const readingTime = parseInt(readingTimeMatch?.[1] || '5')

  // Remove seção META do corpo
  const body = text
    .replace(/^---\nMETA:[\s\S]*$/m, '')
    .replace(/^#\s+.+$/m, '') // remove H1 (já vai no título)
    .trim()

  return { title, excerpt, slug, keywords, readingTime, body }
}

// ─── 6. Converte markdown para Portable Text (simplificado) ──────────────────
function markdownToBlocks(markdown) {
  const lines = markdown.split('\n')
  const blocks = []
  let listItems = []

  const flushList = () => {
    if (listItems.length > 0) {
      listItems.forEach(item => {
        blocks.push({
          _type: 'block', _key: Math.random().toString(36).slice(2),
          style: 'normal', listItem: 'bullet', level: 1,
          children: [{ _type: 'span', _key: Math.random().toString(36).slice(2), text: item, marks: [] }],
          markDefs: [],
        })
      })
      listItems = []
    }
  }

  for (const line of lines) {
    if (!line.trim()) { flushList(); continue }

    if (line.startsWith('## ')) {
      flushList()
      blocks.push({ _type: 'block', _key: Math.random().toString(36).slice(2), style: 'h2', children: [{ _type: 'span', _key: Math.random().toString(36).slice(2), text: line.slice(3).trim(), marks: [] }], markDefs: [] })
    } else if (line.startsWith('### ')) {
      flushList()
      blocks.push({ _type: 'block', _key: Math.random().toString(36).slice(2), style: 'h3', children: [{ _type: 'span', _key: Math.random().toString(36).slice(2), text: line.slice(4).trim(), marks: [] }], markDefs: [] })
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      listItems.push(line.slice(2).trim())
    } else if (/^\d+\.\s/.test(line)) {
      listItems.push(line.replace(/^\d+\.\s/, '').trim())
    } else if (line.startsWith('**P:') || line.startsWith('**R:')) {
      flushList()
      const text = line.replace(/\*\*/g, '')
      blocks.push({ _type: 'block', _key: Math.random().toString(36).slice(2), style: 'normal', children: [{ _type: 'span', _key: Math.random().toString(36).slice(2), text, marks: ['strong'] }], markDefs: [] })
    } else if (!line.startsWith('|') && !line.startsWith('#')) {
      flushList()
      const text = line.replace(/\*\*(.+?)\*\*/g, '$1') // simplificado
      blocks.push({ _type: 'block', _key: Math.random().toString(36).slice(2), style: 'normal', children: [{ _type: 'span', _key: Math.random().toString(36).slice(2), text, marks: [] }], markDefs: [] })
    }
  }
  flushList()
  return blocks.filter(b => b.children?.[0]?.text?.trim())
}

// ─── 7. Publica no Sanity ─────────────────────────────────────────────────────
async function publishToSanity(data) {
  const doc = {
    _type: 'post',
    title: data.title,
    slug: { _type: 'slug', current: data.slug },
    publishedAt: new Date().toISOString(),
    funnel,
    category: data.category,
    excerpt: data.excerpt,
    coverImage: data.image || null,
    body: data.blocks,
    seoKeywords: data.keywords,
    readingTime: data.readingTime,
  }

  const result = await sanity.create(doc)
  return result._id
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🚀 Pipeline iniciado — Funil: ${funnel.toUpperCase()} — ${new Date().toLocaleString('pt-BR')}\n`)

  console.log('📰 1/5 Pesquisando pauta...')
  const { topic, category, keyword, searchIntent } = await researchTopic()
  console.log(`   → Tópico: "${topic}" [${category}]`)

  console.log('✍️  2/5 Gerando artigo SEO...')
  const rawArticle = await generateArticle(topic, category, keyword, searchIntent)

  console.log('🧑 3/5 Humanizando texto...')
  const humanized = await humanizeArticle(rawArticle)

  console.log('🖼️  4/5 Buscando imagem Unsplash...')
  const image = await fetchUnsplashImage(keyword)
  console.log(`   → ${image ? image.credit : 'Sem imagem (continuando sem)'}`)

  console.log('📦 5/5 Publicando no Sanity...')
  const parsed = parseArticle(humanized)
  const blocks = markdownToBlocks(parsed.body)
  const docId = await publishToSanity({ ...parsed, category, image, blocks })

  console.log(`\n✅ Post publicado com sucesso!`)
  console.log(`   ID: ${docId}`)
  console.log(`   Slug: /blog/${parsed.slug}`)
  console.log(`   Título: ${parsed.title}`)
  console.log(`   Palavras estimadas: ~${humanized.split(' ').length}`)
}

main().catch(err => {
  console.error('❌ Erro no pipeline:', err)
  process.exit(1)
})
