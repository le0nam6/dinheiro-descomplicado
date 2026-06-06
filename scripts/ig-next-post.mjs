/**
 * Retorna o próximo post a publicar no Instagram (JSON).
 * Prioridade: posts novos (últimas 25h) → backlog mais antigo não publicado.
 *
 * Uso: node scripts/ig-next-post.mjs
 * Saída: JSON { title, slug, excerpt, categories } ou { done: true }
 */
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { readFileSync } from 'fs'
import { createClient } from '@sanity/client'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env.local') })

const STATE_PATH = resolve(__dirname, 'ig-state.json')
const state = JSON.parse(readFileSync(STATE_PATH, 'utf-8'))
const published = new Set(state.published.map(p => p.slug))

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token:     process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const posts = await sanity.fetch(
  `*[_type=="post"]|order(_createdAt desc){title,"slug":slug.current,excerpt,_createdAt,"cats":categories[]->{title}}`
)

const cutoff = new Date(Date.now() - 25 * 60 * 60 * 1000)

// Prioridade 1: posts novos ainda não publicados no IG
const fresh = posts.find(p => !published.has(p.slug) && new Date(p._createdAt) > cutoff)
if (fresh) { console.log(JSON.stringify(fresh)); process.exit(0) }

// Prioridade 2: backlog (mais antigo primeiro)
const backlog = [...posts].reverse().find(p => !published.has(p.slug))
if (backlog) { console.log(JSON.stringify(backlog)); process.exit(0) }

console.log(JSON.stringify({ done: true }))
