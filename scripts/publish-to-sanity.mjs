/**
 * Publica um post no Sanity CMS.
 * Uso: node scripts/publish-to-sanity.mjs --file /tmp/post.json
 *
 * JSON esperado:
 * {
 *   "title": "Título do Post",
 *   "slug": "titulo-do-post",
 *   "excerpt": "Resumo de até 160 caracteres",
 *   "funnel": "tofu" | "mofu" | "bofu",
 *   "category": "investimentos" | "cartão de crédito" | "empréstimo" | "financiamento" | "previdência" | "educação financeira",
 *   "coverImageUrl": "https://...",
 *   "coverImageAlt": "Descrição da imagem",
 *   "coverImageCredit": "Foto: Unsplash/@autor",
 *   "body": ["parágrafo 1", "## Subtítulo", "parágrafo 2", ...],
 *   "seoKeywords": ["kw1", "kw2"],
 *   "readingTime": 5
 * }
 *
 * Linhas em `body` que começam com ## viram heading h2, ### viram h3.
 */
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { readFileSync } from 'fs'
import { createClient } from '@sanity/client'
import { nanoid } from 'nanoid'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env.local') })

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token:     process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

function toPortableText(lines) {
  return lines.map(line => {
    const key = nanoid(8)
    if (line.startsWith('### ')) {
      return { _type: 'block', _key: key, style: 'h3', markDefs: [], children: [{ _type: 'span', _key: nanoid(6), text: line.slice(4), marks: [] }] }
    }
    if (line.startsWith('## ')) {
      return { _type: 'block', _key: key, style: 'h2', markDefs: [], children: [{ _type: 'span', _key: nanoid(6), text: line.slice(3), marks: [] }] }
    }
    return { _type: 'block', _key: key, style: 'normal', markDefs: [], children: [{ _type: 'span', _key: nanoid(6), text: line, marks: [] }] }
  })
}

function slugify(text) {
  return text.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 96)
}

const fileArg = process.argv.indexOf('--file')
if (fileArg === -1) { console.error('Uso: node publish-to-sanity.mjs --file <json>'); process.exit(1) }

const post = JSON.parse(readFileSync(process.argv[fileArg + 1], 'utf-8'))

const slug = post.slug || slugify(post.title)

// Verifica se o slug já existe
const existing = await sanity.fetch('*[_type=="post" && slug.current==$s][0]._id', { s: slug })
if (existing) {
  console.error(`❌ Post com slug "${slug}" já existe: ${existing}`)
  process.exit(1)
}

const doc = {
  _type: 'post',
  title: post.title,
  slug: { _type: 'slug', current: slug },
  publishedAt: new Date().toISOString(),
  funnel: post.funnel || 'tofu',
  category: post.category || 'educação financeira',
  excerpt: post.excerpt.slice(0, 160),
  coverImage: post.coverImageUrl ? {
    url: post.coverImageUrl,
    alt: post.coverImageAlt || post.title,
    credit: post.coverImageCredit || 'Foto: Unsplash',
  } : undefined,
  body: toPortableText(post.body || []),
  seoKeywords: post.seoKeywords || [],
  readingTime: post.readingTime || Math.ceil((post.body || []).join(' ').split(' ').length / 200),
}

const created = await sanity.create(doc)
console.log(`✅ Post publicado no Sanity: ${created._id}`)
console.log(`SANITY_ID=${created._id}`)
console.log(`POST_SLUG=${slug}`)
