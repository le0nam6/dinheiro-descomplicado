/**
 * Atualiza um post existente no Sanity (body + campos opcionais).
 * Uso: node scripts/update-post.mjs --id <sanity_id> --file /tmp/post.json
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

function makeBlock(style, text) {
  return { _type: 'block', _key: uid(), style, markDefs: [], children: parseInline(text) }
}

function markdownToBlocks(markdown) {
  const lines = markdown.split('\n')
  const blocks = []
  let listItems = []

  const flushList = () => {
    if (!listItems.length) return
    listItems.forEach(({ text, style }) => {
      blocks.push({ _type: 'block', _key: uid(), style: 'normal', listItem: style, level: 1, markDefs: [], children: parseInline(text) })
    })
    listItems = []
  }

  let tableLines = []
  const flushTable = () => {
    if (tableLines.length < 2) { tableLines = []; return }
    // Remove a linha separadora (|---|---|)
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

    if (trimmed.startsWith('|')) { flushList(); tableLines.push(trimmed); continue }
    else if (tableLines.length) flushTable()

    if (!trimmed) { flushList(); continue }
    if (line.startsWith('#### ')) { flushList(); blocks.push(makeBlock('h4', line.slice(5).trim())); continue }
    if (line.startsWith('### '))  { flushList(); blocks.push(makeBlock('h3', line.slice(4).trim())); continue }
    if (line.startsWith('## '))   { flushList(); blocks.push(makeBlock('h2', line.slice(3).trim())); continue }
    if (line.startsWith('> '))    { flushList(); blocks.push(makeBlock('blockquote', line.slice(2).trim())); continue }
    if (line.startsWith('- ') || line.startsWith('* ')) { listItems.push({ text: line.slice(2).trim(), style: 'bullet' }); continue }
    if (/^\d+\.\s/.test(line))   { listItems.push({ text: line.replace(/^\d+\.\s/, '').trim(), style: 'number' }); continue }
    flushList()
    if (trimmed) blocks.push(makeBlock('normal', trimmed))
  }
  flushList()
  flushTable()
  return blocks.filter(b => b._type === 'table' || b.children?.some(s => s.text?.trim()))
}

async function main() {
  const idArg = process.argv.indexOf('--id')
  const fileArg = process.argv.indexOf('--file')
  if (idArg === -1 || fileArg === -1) { console.error('Uso: node update-post.mjs --id <id> --file <json>'); process.exit(1) }

  const id = process.argv[idArg + 1]
  const postData = JSON.parse(readFileSync(process.argv[fileArg + 1], 'utf-8'))

  console.log(`\n✏️  Atualizando: "${postData.title}" (${id})`)

  const patch = { body: markdownToBlocks(postData.body) }
  if (postData.title)       patch.title = postData.title
  if (postData.excerpt)     patch.excerpt = postData.excerpt
  if (postData.keywords)    patch.seoKeywords = postData.keywords
  if (postData.readingTime) patch.readingTime = postData.readingTime
  if (postData.category)    patch.category = postData.category
  if (postData.funnel)      patch.funnel = postData.funnel

  await sanity.patch(id).set(patch).commit()
  console.log('✅ Post atualizado com sucesso!')
}

main().catch(err => { console.error('❌ Erro:', err.message); process.exit(1) })
