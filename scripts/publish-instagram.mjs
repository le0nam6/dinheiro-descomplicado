/**
 * Publica no Instagram via Graph API oficial da Meta.
 * Pega o post mais recente do Sanity (imagem + link) e publica com a legenda fornecida.
 *
 * Uso: node scripts/publish-instagram.mjs --file /tmp/ig-caption.json
 *   JSON: { "caption": "legenda completa com hashtags", "slug": "slug-do-post-opcional" }
 *   Se slug não for dado, usa o post mais recente.
 *
 * Requer no .env.local: IG_USER_ID, IG_ACCESS_TOKEN (token de longa duração)
 */
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@sanity/client'
import { readFileSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env.local') })

const IG_USER_ID = process.env.IG_USER_ID
const IG_TOKEN = process.env.IG_ACCESS_TOKEN
const SITE = 'https://endinheirados.cc'
const GRAPH = 'https://graph.instagram.com/v21.0'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

async function main() {
  if (!IG_USER_ID || !IG_TOKEN) {
    console.error('❌ Faltam IG_USER_ID e/ou IG_ACCESS_TOKEN no .env.local')
    process.exit(1)
  }

  // Lê a legenda
  const fileArg = process.argv.indexOf('--file')
  if (fileArg === -1) { console.error('Uso: node scripts/publish-instagram.mjs --file <json>'); process.exit(1) }
  const data = JSON.parse(readFileSync(process.argv[fileArg + 1], 'utf-8'))

  // Busca o post (mais recente ou pelo slug)
  const post = data.slug
    ? await sanity.fetch('*[_type=="post" && slug.current==$s][0]{title,"slug":slug.current,coverImage}', { s: data.slug })
    : await sanity.fetch('*[_type=="post"]|order(_createdAt desc)[0]{title,"slug":slug.current,coverImage}')

  if (!post) { console.error('❌ Nenhum post encontrado'); process.exit(1) }
  const imageUrl = post.coverImage?.url
  if (!imageUrl) { console.error('❌ Post sem imagem de capa'); process.exit(1) }

  const caption = `${data.caption}\n\n📲 Guia completo no link da bio: ${SITE}/blog/${post.slug}`

  console.log(`\n📸 Publicando no Instagram: "${post.title}"`)
  console.log(`   Imagem: ${imageUrl.slice(0, 60)}...`)

  // Passo 1: criar container de mídia
  const createRes = await fetch(`${GRAPH}/${IG_USER_ID}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: imageUrl, caption, access_token: IG_TOKEN }),
  })
  const createData = await createRes.json()
  if (!createData.id) { console.error('❌ Erro ao criar mídia:', JSON.stringify(createData)); process.exit(1) }
  console.log(`   Container criado: ${createData.id}`)

  // Passo 2: publicar
  const pubRes = await fetch(`${GRAPH}/${IG_USER_ID}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: createData.id, access_token: IG_TOKEN }),
  })
  const pubData = await pubRes.json()
  if (!pubData.id) { console.error('❌ Erro ao publicar:', JSON.stringify(pubData)); process.exit(1) }

  console.log(`\n✅ Publicado no Instagram! ID: ${pubData.id}`)
}

main().catch(err => { console.error('❌ Erro:', err.message); process.exit(1) })
