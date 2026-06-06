/**
 * Renova o IG_ACCESS_TOKEN no .env.local antes de expirar (token dura 60 dias).
 * Deve rodar mensalmente via scheduled task do Claude Code.
 *
 * Uso: node scripts/refresh-ig-token.mjs
 */
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { readFileSync, writeFileSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ENV_PATH = resolve(__dirname, '../.env.local')
config({ path: ENV_PATH })

const token = process.env.IG_ACCESS_TOKEN
if (!token) {
  console.error('❌ IG_ACCESS_TOKEN não encontrado no .env.local')
  process.exit(1)
}

const res = await fetch(
  `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${token}`
)
const data = await res.json()

if (!data.access_token) {
  console.error('❌ Falha ao renovar token:', JSON.stringify(data))
  process.exit(1)
}

// Atualiza o .env.local com o novo token
const env = readFileSync(ENV_PATH, 'utf-8')
const updated = env.replace(
  /^IG_ACCESS_TOKEN=.*/m,
  `IG_ACCESS_TOKEN=${data.access_token}`
)
writeFileSync(ENV_PATH, updated)

const days = Math.round(data.expires_in / 86400)
console.log(`✅ Token renovado! Expira em ${days} dias.`)
console.log(`   Novo token: ${data.access_token.slice(0, 20)}...`)
