/**
 * Publica no Instagram uma imagem gerada pelo Canva MCP.
 *
 * Uso: node scripts/create-ig-post.mjs --image <url> --slug <slug> --caption <texto>
 *
 * Requer no .env.local: IG_USER_ID, IG_ACCESS_TOKEN, SANITY_*
 */
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@sanity/client'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env.local') })

const IG_USER_ID = process.env.IG_USER_ID
const IG_TOKEN   = process.env.IG_ACCESS_TOKEN
const GRAPH      = 'https://graph.instagram.com/v21.0'

if (!IG_USER_ID || !IG_TOKEN) {
  console.error('❌ Faltam IG_USER_ID e/ou IG_ACCESS_TOKEN no .env.local')
  process.exit(1)
}

function arg(flag) {
  const i = process.argv.indexOf(flag)
  if (i === -1) return null
  // suporta valor com espaços se vier entre aspas (já resolvido pelo shell)
  return process.argv[i + 1]
}

const imageUrl = arg('--image')
const slug     = arg('--slug')
const caption  = arg('--caption')

if (!imageUrl || !slug || !caption) {
  console.error('Uso: node create-ig-post.mjs --image <url> --slug <slug> --caption <texto>')
  process.exit(1)
}

console.log(`\n📸 Publicando no Instagram: ${slug}`)
console.log(`   Imagem: ${imageUrl.slice(0, 80)}...`)

// Passo 1: criar container de mídia
const createRes = await fetch(`${GRAPH}/${IG_USER_ID}/media`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ image_url: imageUrl, caption, access_token: IG_TOKEN }),
})
const createData = await createRes.json()
if (!createData.id) {
  console.error('❌ Erro ao criar mídia:', JSON.stringify(createData))
  process.exit(1)
}
console.log(`   Container criado: ${createData.id}`)

// Aguarda a mídia ser processada pelo Instagram
await new Promise(r => setTimeout(r, 8000))

// Passo 2: publicar
const pubRes = await fetch(`${GRAPH}/${IG_USER_ID}/media_publish`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ creation_id: createData.id, access_token: IG_TOKEN }),
})
const pubData = await pubRes.json()
if (!pubData.id) {
  console.error('❌ Erro ao publicar:', JSON.stringify(pubData))
  process.exit(1)
}

console.log(`\n✅ Publicado! ID do post: ${pubData.id}`)
// Imprime o ID para o orquestrador capturar
process.stdout.write(`IG_POST_ID=${pubData.id}\n`)
