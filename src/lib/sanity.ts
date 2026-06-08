import { createClient } from 'next-sanity'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const isConfigured = projectId && /^[a-z0-9-]+$/.test(projectId)

export const client = isConfigured
  ? createClient({
      projectId,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
      apiVersion: '2024-01-01',
      useCdn: true,
    })
  : null

export async function getPosts(limit = 10) {
  if (!client) return []
  try {
    return await client.fetch(
      `*[_type == "post"] | order(publishedAt desc) [0...$limit] { title, slug, publishedAt, funnel, category, excerpt, coverImage, readingTime }`,
      { limit }
    )
  } catch { return [] }
}

export async function getPostBySlug(slug: string) {
  if (!client) return null
  try {
    return await client.fetch(
      `*[_type == "post" && slug.current == $slug][0] { title, slug, publishedAt, updatedAt, funnel, category, excerpt, coverImage, body, seoKeywords, readingTime, articleType, sources, sponsored, sponsorName }`,
      { slug }
    )
  } catch { return null }
}

// Posts relacionados: mesma categoria primeiro, completa com recentes de outras
export async function getRelatedPosts(slug: string, category: string, limit = 4) {
  if (!client) return []
  try {
    const sameCategory = await client.fetch(
      `*[_type == "post" && category == $category && slug.current != $slug] | order(publishedAt desc) [0...$limit] { title, slug, category }`,
      { category, slug, limit }
    )
    if (sameCategory.length >= limit) return sameCategory
    // completa com outros recentes
    const fillIds = sameCategory.map((p: { slug: { current: string } }) => p.slug.current)
    const extra = await client.fetch(
      `*[_type == "post" && slug.current != $slug && !(slug.current in $exclude)] | order(publishedAt desc) [0...$n] { title, slug, category }`,
      { slug, exclude: fillIds, n: limit - sameCategory.length }
    )
    return [...sameCategory, ...extra]
  } catch { return [] }
}

// --- Edições diárias (digest "The News") ---
export async function getEditions(limit = 30) {
  if (!client) return []
  try {
    return await client.fetch(
      `*[_type == "edition"] | order(date desc) [0...$limit] { date, slug, title, intro, readingTime, "storyCount": count(stories) }`,
      { limit }
    )
  } catch { return [] }
}

export async function getLatestEdition() {
  if (!client) return null
  try {
    return await client.fetch(`*[_type == "edition"] | order(date desc)[0]{ date, slug, title, intro }`)
  } catch { return null }
}

export async function getEditionByDate(date: string) {
  if (!client) return null
  try {
    return await client.fetch(
      `*[_type == "edition" && slug.current == $date][0] { date, slug, title, intro, publishedAt, readingTime, stories, marketSnapshot }`,
      { date }
    )
  } catch { return null }
}

export async function getPostsByCategory(category: string) {
  if (!client) return []
  try {
    return await client.fetch(
      `*[_type == "post" && category == $category] | order(publishedAt desc) [0...50] { title, slug, publishedAt, funnel, category, excerpt, coverImage, readingTime }`,
      { category }
    )
  } catch { return [] }
}

// Conta posts por categoria (para os hubs das editorias)
export async function getCategoryCounts() {
  if (!client) return {}
  try {
    const result = await client.fetch(
      `*[_type == "post"]{ category }`
    )
    const counts: Record<string, number> = {}
    for (const r of result) {
      if (r.category) counts[r.category] = (counts[r.category] || 0) + 1
    }
    return counts
  } catch { return {} }
}
