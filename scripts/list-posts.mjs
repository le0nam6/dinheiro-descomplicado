/**
 * Lista os posts já publicados (para o routine evitar duplicatas e criar links internos).
 * Uso: node scripts/list-posts.mjs
 */
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@sanity/client'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env.local') })

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const posts = await sanity.fetch('*[_type=="post"] | order(category){ title, "slug": slug.current, category }')
console.log(`\n=== ${posts.length} POSTS JÁ PUBLICADOS (NÃO REPITA ESTES TEMAS) ===\n`)
for (const p of posts) {
  console.log(`[${p.category}] ${p.title}\n   → link interno: /blog/${p.slug}\n`)
}
console.log('=== Use 2 a 4 destes como links internos [texto](/blog/slug) no corpo do novo artigo ===')
