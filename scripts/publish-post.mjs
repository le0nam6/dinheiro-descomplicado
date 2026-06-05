/**
 * Publicador: recebe conteúdo via JSON no stdin ou arquivo, busca imagem e publica no Sanity.
 * Chamado pelo Claude Routine após gerar e humanizar o artigo.
 *
 * Uso:
 *   echo '<json>' | node scripts/publish-post.mjs
 *   node scripts/publish-post.mjs --file /tmp/post.json
 *
 * JSON esperado:
 * {
 *   "title": "Título do artigo",
 *   "slug": "titulo-do-artigo",
 *   "excerpt": "Meta description (máx 155 chars)",
 *   "funnel": "tofu|mofu|bofu",
 *   "category": "empréstimo|investimentos|...",
 *   "keywords": ["keyword1", "keyword2"],
 *   "readingTime": 6,
 *   "body": "Conteúdo completo em markdown"
 * }
 */

import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@sanity/client'
import { readFileSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env.local') })

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

// ─── Busca imagem no Unsplash ─────────────────────────────────────────────────
async function fetchUnsplashImage(keyword) {
  const query = encodeURIComponent(`${keyword} finanças dinheiro`)
  const url = `https://api.unsplash.com/photos/random?query=${query}&orientation=landscape`
  try {
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
  } catch {
    return null
  }
}

// ─── Parser inline: detecta negrito e texto normal ───────────────────────────
function uid() { return Math.random().toString(36).slice(2, 10) }

function parseInline(text) {
  const spans = []
  const regex = /\*\*(.+?)\*\*/g
  let last = 0, m
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) spans.push({ _type: 'span', _key: uid(), text: text.slice(last, m.index), marks: [] })
    spans.push({ _type: 'span', _key: uid(), text: m[1], marks: ['strong'] })
    last = regex.lastIndex
  }
  if (last < text.length) spans.push({ _type: 'span', _key: uid(), text: text.slice(last), marks: [] })
  return spans.length ? spans : [{ _type: 'span', _key: uid(), text, marks: [] }]
}

function makeBlock(style, text, extra = {}) {
  return { _type: 'block', _key: uid(), style, markDefs: [], children: parseInline(text), ...extra }
}

// ─── Converte markdown para Portable Text ─────────────────────────────────────
function markdownToBlocks(markdown) {
  const lines = markdown.split('\n')
  const blocks = []
  let listItems = []
  let listStyle = 'bullet'

  const flushList = () => {
    if (!listItems.length) return
    listItems.forEach(({ text, style }) => {
      blocks.push({
        _type: 'block', _key: uid(), style: 'normal',
        listItem: style, level: 1, markDefs: [],
        children: parseInline(text),
      })
    })
    listItems = []
  }

  let tableLines = []
  const flushTable = () => {
    if (tableLines.length < 2) { tableLines = []; return }
    const rows = tableLines
      .filter(l => !/^\s*\|?[\s:|-]+\|?\s*$/.test(l) || !l.includes('-'))
      .map(l => l.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(c => c.trim().replace(/\*\*/g, '')))
    if (rows.length) {
      blocks.push({ _type: 'table', _key: uid(), rows: rows.map(cells => ({ _key: uid(), cells })) })
    }
    tableLines = []
  }

  for (const line of lines) {
    const trimmed = line.trim()

    // Tabela
    if (trimmed.startsWith('|')) { flushList(); tableLines.push(trimmed); continue }
    else if (tableLines.length) flushTable()

    if (!trimmed) { flushList(); continue }

    // Headings
    if (line.startsWith('#### ')) { flushList(); blocks.push(makeBlock('h4', line.slice(5).trim())); continue }
    if (line.startsWith('### '))  { flushList(); blocks.push(makeBlock('h3', line.slice(4).trim())); continue }
    if (line.startsWith('## '))   { flushList(); blocks.push(makeBlock('h2', line.slice(3).trim())); continue }
    if (line.startsWith('# '))    { flushList(); blocks.push(makeBlock('h1', line.slice(2).trim())); continue }

    // Blockquote
    if (line.startsWith('> ')) {
      flushList()
      blocks.push(makeBlock('blockquote', line.slice(2).trim()))
      continue
    }

    // Listas
    if (line.startsWith('- ') || line.startsWith('* ')) {
      listItems.push({ text: line.slice(2).trim(), style: 'bullet' }); continue
    }
    if (/^\d+\.\s/.test(line)) {
      listItems.push({ text: line.replace(/^\d+\.\s/, '').trim(), style: 'number' }); continue
    }

    // Parágrafo normal
    flushList()
    if (trimmed) blocks.push(makeBlock('normal', trimmed))
  }
  flushList()
  flushTable()
  return blocks.filter(b => b._type === 'table' || b.children?.some(s => s.text?.trim()))
}

// ─── Publica no Sanity ────────────────────────────────────────────────────────
async function publishToSanity(post, image) {
  const doc = {
    _type: 'post',
    title: post.title,
    slug: { _type: 'slug', current: post.slug },
    publishedAt: new Date().toISOString(),
    funnel: post.funnel,
    category: post.category,
    excerpt: post.excerpt,
    coverImage: image || null,
    body: markdownToBlocks(post.body),
    seoKeywords: post.keywords || [],
    readingTime: post.readingTime || 5,
  }
  return await sanity.create(doc)
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  // Lê o JSON do argumento --file ou do stdin
  let postData
  const fileArg = process.argv.indexOf('--file')
  if (fileArg !== -1 && process.argv[fileArg + 1]) {
    postData = JSON.parse(readFileSync(process.argv[fileArg + 1], 'utf-8'))
  } else {
    const chunks = []
    for await (const chunk of process.stdin) chunks.push(chunk)
    postData = JSON.parse(Buffer.concat(chunks).toString())
  }

  console.log(`\n🚀 Publicando: "${postData.title}"`)
  console.log(`   Funil: ${postData.funnel?.toUpperCase()} | Categoria: ${postData.category}`)

  console.log('🖼️  Buscando imagem Unsplash...')
  const image = await fetchUnsplashImage(postData.keywords?.[0] || postData.category || 'finanças')
  console.log(`   → ${image ? image.credit : 'Sem imagem (continuando)'}`)

  console.log('📦 Publicando no Sanity...')
  const result = await publishToSanity(postData, image)

  console.log(`\n✅ Post publicado!`)
  console.log(`   ID Sanity: ${result._id}`)
  console.log(`   URL: /blog/${postData.slug}`)
}

main().catch(err => {
  console.error('❌ Erro:', err.message)
  process.exit(1)
})
