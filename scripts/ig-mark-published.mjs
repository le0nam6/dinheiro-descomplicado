/**
 * Marca um post como publicado no Instagram.
 * Uso: node scripts/ig-mark-published.mjs --slug <slug> --ig-id <instagram_post_id>
 */
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { readFileSync, writeFileSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const STATE_PATH = resolve(__dirname, 'ig-state.json')

function arg(flag) {
  const i = process.argv.indexOf(flag)
  return i !== -1 ? process.argv[i + 1] : null
}

const slug  = arg('--slug')
const igId  = arg('--ig-id')

if (!slug) { console.error('Uso: node ig-mark-published.mjs --slug <slug> [--ig-id <id>]'); process.exit(1) }

const state = JSON.parse(readFileSync(STATE_PATH, 'utf-8'))
if (!state.published.some(p => p.slug === slug)) {
  state.published.push({ slug, igId: igId || null, publishedAt: new Date().toISOString() })
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2))
  console.log(`✅ Marcado como publicado: ${slug}`)
} else {
  console.log(`ℹ️  Já estava marcado: ${slug}`)
}
