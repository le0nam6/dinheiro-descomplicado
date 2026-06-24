// QA temporário: gera o HTML do e-mail da última edição e grava em public/_email-preview.html
import { createClient } from '@sanity/client'
import { readFileSync, writeFileSync } from 'node:fs'

// Carrega .env.local manualmente
const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const line of env.split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) process.env[m[1]] = m[2]
}

// Importa o builder (rodar com: node --import tsx)
const { buildEditionHtml } = await import('../src/lib/brevo.ts')

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

const edition = await sanity.fetch(
  `*[_type=="edition" && !(_id in path("drafts.**"))] | order(date desc)[0]{
    date, title, punchline, intro, closing, readingTime,
    "marketSnapshot": marketSnapshot[]{ label, value, changePct },
    "stories": stories[]{ emoji, tag, headline, hook, what, why, "image": image{ url, alt, credit } },
    wordOfDay, curiosity, recommendation, reflection,
    "slug": slug.current
  }`
)

const featuredPosts = await sanity
  .fetch(`*[_type=="post" && defined(slug.current) && publishedAt <= now() && articleType != "news"] | order(publishedAt desc)[0...3]{ title, "slug": slug.current, excerpt, category }`)
  .catch(() => [])

const html = buildEditionHtml({
  date: edition.date,
  title: edition.title,
  url: `https://endinheirados.cc/edicao/${edition.slug}`,
  punchline: edition.punchline,
  intro: edition.intro,
  closing: edition.closing,
  readingTime: edition.readingTime,
  marketSnapshot: edition.marketSnapshot,
  stories: edition.stories || [],
  featuredPosts,
  wordOfDay: edition.wordOfDay,
  curiosity: edition.curiosity,
  recommendation: edition.recommendation,
  reflection: edition.reflection,
})

writeFileSync(new URL('../public/_email-preview.html', import.meta.url), html)
console.log('OK:', edition.title, '| stories:', (edition.stories || []).length)
