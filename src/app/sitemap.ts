import { getPosts } from '@/lib/sanity'
import type { MetadataRoute } from 'next'

const BASE_URL = 'https://endinheirados.cc'

const staticRoutes = [
  { url: BASE_URL, priority: 1.0, changeFrequency: 'daily' as const },
  { url: `${BASE_URL}/blog`, priority: 0.9, changeFrequency: 'daily' as const },
  { url: `${BASE_URL}/mercado`, priority: 0.9, changeFrequency: 'hourly' as const },
  { url: `${BASE_URL}/etica`, priority: 0.4, changeFrequency: 'yearly' as const },
  { url: `${BASE_URL}/calculadora`, priority: 0.8, changeFrequency: 'monthly' as const },
  { url: `${BASE_URL}/sobre`, priority: 0.5, changeFrequency: 'monthly' as const },
  { url: `${BASE_URL}/contato`, priority: 0.4, changeFrequency: 'monthly' as const },
  { url: `${BASE_URL}/privacidade`, priority: 0.3, changeFrequency: 'yearly' as const },
  { url: `${BASE_URL}/termos`, priority: 0.3, changeFrequency: 'yearly' as const },
  { url: `${BASE_URL}/categoria/emprestimo`, priority: 0.7, changeFrequency: 'weekly' as const },
  { url: `${BASE_URL}/categoria/investimentos`, priority: 0.7, changeFrequency: 'weekly' as const },
  { url: `${BASE_URL}/categoria/cartao-de-credito`, priority: 0.7, changeFrequency: 'weekly' as const },
  { url: `${BASE_URL}/categoria/financiamento`, priority: 0.7, changeFrequency: 'weekly' as const },
  { url: `${BASE_URL}/categoria/previdencia`, priority: 0.7, changeFrequency: 'weekly' as const },
  { url: `${BASE_URL}/categoria/educacao-financeira`, priority: 0.7, changeFrequency: 'weekly' as const },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPosts(500)

  const postRoutes = posts.map((post: { slug: { current: string }; publishedAt: string }) => ({
    url: `${BASE_URL}/blog/${post.slug.current}`,
    lastModified: new Date(post.publishedAt),
    priority: 0.8,
    changeFrequency: 'weekly' as const,
  }))

  const now = new Date()
  return [...staticRoutes.map(r => ({ ...r, lastModified: now })), ...postRoutes]
}
