import { createClient } from 'next-sanity'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const isConfigured = projectId && /^[a-z0-9-]+$/.test(projectId)

const client = isConfigured
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
      `*[_type == "post" && slug.current == $slug][0] { title, slug, publishedAt, funnel, category, excerpt, coverImage, body, seoKeywords, readingTime }`,
      { slug }
    )
  } catch { return null }
}

export async function getPostsByCategory(category: string) {
  if (!client) return []
  try {
    return await client.fetch(
      `*[_type == "post" && category == $category] | order(publishedAt desc) [0...20] { title, slug, publishedAt, funnel, category, excerpt, coverImage, readingTime }`,
      { category }
    )
  } catch { return [] }
}
