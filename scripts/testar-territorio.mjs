/**
 * Testa o filtro de território contra as notícias que o site realmente publicou.
 *
 * O filtro decide o que entra no blog, então errar aqui é caro nos dois sentidos:
 * deixar passar wire copy de commodity enche o acervo de página invisível, e
 * barrar fato de bolso cala a rota. Este script roda contra o acervo real.
 *
 *   node scripts/testar-territorio.mjs
 */
import { config } from 'dotenv'
import { createClient } from '@sanity/client'
import { readFileSync } from 'fs'
config({ path: '.env.local', quiet: true })

// Transpila o módulo na mão: só precisa das regex e da função, sem tipos.
const src = readFileSync('src/lib/territorio.ts', 'utf8')
  .replace(/^export type[\s\S]*?\n\n/m, '')
  .replace(/export /g, '')
  .replace(/: ItemDeFeed\): boolean/, ')')
const { noTerritorio } = await import(
  'data:text/javascript;base64,' + Buffer.from(src + '\nexport { noTerritorio }').toString('base64')
)

const s = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID, dataset: 'production',
  token: process.env.SANITY_API_TOKEN, apiVersion: '2024-01-01', useCdn: false })

const posts = await s.fetch(
  `*[_type=="post" && articleType=="news"]|order(_createdAt desc)[0...120]{title, excerpt}`
)

let passa = 0
const aprovadas = [], barradas = []
for (const p of posts) {
  const ok = noTerritorio({ title: p.title ?? '', description: p.excerpt ?? '' })
  if (ok) { passa++; aprovadas.push(p.title) } else { barradas.push(p.title) }
}

console.log(`\n${posts.length} notícias publicadas, testadas contra o filtro novo\n`)
console.log(`  passariam: ${passa}  (${(passa / posts.length * 100).toFixed(0)}%)`)
console.log(`  barradas:  ${posts.length - passa}\n`)

console.log('─── PASSARIAM (amostra de 14) ───')
for (const t of aprovadas.slice(0, 14)) console.log(`  ✓ ${t.slice(0, 72)}`)
console.log('\n─── BARRADAS (amostra de 14) ───')
for (const t of barradas.slice(0, 14)) console.log(`  ✗ ${t.slice(0, 72)}`)
