import { createClient } from 'next-sanity'
import { GoogleAuth } from 'google-auth-library'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '../.env.local')

// Parse .env.local
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => {
      const [key, ...rest] = l.split('=')
      return [key.trim(), rest.join('=').trim().replace(/^"|"$/g, '')]
    })
)

const BASE = 'https://endinheirados.cc'
const INDEXING_ENDPOINT = 'https://indexing.googleapis.com/v3/urlNotifications:publish'

const sanity = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
})

const auth = new GoogleAuth({
  credentials: {
    client_email: env.GOOGLE_INDEXING_CLIENT_EMAIL,
    private_key: env.GOOGLE_INDEXING_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/indexing'],
})

async function getAccessToken() {
  const client = await auth.getClient()
  const token = await client.getAccessToken()
  return token.token
}

async function notifyUrl(url, token) {
  const res = await fetch(INDEXING_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ url, type: 'URL_UPDATED' }),
  })
  return res.ok ? '✓' : `✗ ${res.status}`
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function main() {
  console.log('Buscando posts no Sanity...')
  const posts = await sanity.fetch(
    `*[_type == "post" && defined(slug.current)] | order(publishedAt desc) { "slug": slug.current }`
  )
  console.log(`${posts.length} posts encontrados\n`)

  const token = await getAccessToken()
  let ok = 0
  let fail = 0

  for (const [i, post] of posts.entries()) {
    const url = `${BASE}/blog/${post.slug}`
    const status = await notifyUrl(url, token)
    const symbol = status === '✓' ? '✓' : '✗'
    console.log(`[${i + 1}/${posts.length}] ${symbol} ${url}`)
    if (status === '✓') { ok++ } else { fail++ }
    if (i < posts.length - 1) await sleep(200)
  }

  console.log(`\nConcluído: ${ok} enviados, ${fail} falhas`)
  console.log('Google pode levar até 48h para indexar cada URL.')
}

main().catch(console.error)
