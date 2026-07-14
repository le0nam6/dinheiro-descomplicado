import { createClient } from 'next-sanity'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const isConfigured = projectId && /^[a-z0-9-]+$/.test(projectId)

export const client = isConfigured
  ? createClient({
      projectId,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
      apiVersion: '2024-01-01',
      useCdn: false,
    })
  : null

export async function getPosts(limit = 10) {
  if (!client) return []
  try {
    return await client.fetch(
      `*[_type == "post" && publishedAt <= now() && status == "aprovado"] | order(publishedAt desc) [0...$limit] { title, slug, publishedAt, funnel, category, excerpt, coverImage, readingTime }`,
      { limit },
      { next: { revalidate: 300, tags: ['post'] } }
    )
  } catch { return [] }
}

export async function getPostBySlug(slug: string) {
  if (!client) return null
  try {
    return await client.fetch(
      `*[_type == "post" && slug.current == $slug && status == "aprovado"][0] { title, slug, publishedAt, updatedAt, funnel, category, excerpt, coverImage, body, seoKeywords, readingTime, articleType, sources, sponsored, sponsorName }`,
      { slug },
      { next: { revalidate: 3600, tags: [`post:${slug}`] } }
    )
  } catch { return null }
}

export async function getRelatedPosts(slug: string, category: string, limit = 4) {
  if (!client) return []
  try {
    const sameCategory = await client.fetch(
      `*[_type == "post" && publishedAt <= now() && status == "aprovado" && category == $category && slug.current != $slug] | order(publishedAt desc) [0...$limit] { title, slug, category }`,
      { category, slug, limit },
      { next: { revalidate: 600, tags: ['post'] } }
    )
    if (sameCategory.length >= limit) return sameCategory
    const fillIds = sameCategory.map((p: { slug: { current: string } }) => p.slug.current)
    const extra = await client.fetch(
      `*[_type == "post" && publishedAt <= now() && status == "aprovado" && slug.current != $slug && !(slug.current in $exclude)] | order(publishedAt desc) [0...$n] { title, slug, category }`,
      { slug, exclude: fillIds, n: limit - sameCategory.length },
      { next: { revalidate: 600, tags: ['post'] } }
    )
    return [...sameCategory, ...extra]
  } catch { return [] }
}

// --- Edições diárias ---
export async function getEditions(limit = 30) {
  if (!client) return []
  try {
    return await client.fetch(
      `*[_type == "edition"] | order(date desc) [0...$limit] { date, slug, number, title, intro, readingTime, "storyCount": count(stories) + count(blocks[_type == "storyBlock"]) }`,
      { limit },
      { next: { revalidate: 60, tags: ['edition'] } }
    )
  } catch { return [] }
}

export async function getLatestEdition() {
  if (!client) return null
  try {
    return await client.fetch(
      `*[_type == "edition"] | order(date desc)[0]{ date, slug, number, title, intro }`,
      {},
      { next: { revalidate: 60, tags: ['edition'] } }
    )
  } catch { return null }
}

export async function getEditionByDate(date: string) {
  if (!client) return null
  try {
    return await client.fetch(
      `*[_type == "edition" && slug.current == $date][0] { date, slug, number, title, punchline, intro, closing, publishedAt, readingTime, stories, blocks, marketSnapshot, wordOfDay, curiosity, recommendation, reflection }`,
      { date },
      { next: { revalidate: 60, tags: [`edition:${date}`] } }
    )
  } catch { return null }
}

export async function getPostsByCategory(category: string) {
  if (!client) return []
  try {
    return await client.fetch(
      `*[_type == "post" && publishedAt <= now() && category == $category] | order(publishedAt desc) [0...50] { title, slug, publishedAt, funnel, category, excerpt, coverImage, readingTime }`,
      { category },
      { next: { revalidate: 600, tags: ['post'] } }
    )
  } catch { return [] }
}

export type ReferralMilestone = { count: number; emoji: string; label: string; reward: string }
export type SiteSettings = {
  subscriberGoal: number
  subscriberGoalReward: string
  referralMilestones: ReferralMilestone[]
  referralPrizeName: string
  referralPrizeImage: string
}

const DEFAULT_SETTINGS: SiteSettings = {
  subscriberGoal: 100,
  subscriberGoalReward: 'sortearemos um livro de finanças entre todos os inscritos',
  referralPrizeName: 'Psicologia Financeira',
  referralPrizeImage: '',
  referralMilestones: [
    { count: 1,  emoji: '🌱', label: 'Poupador Ativo',          reward: 'Acesso ao grupo exclusivo no Telegram' },
    { count: 3,  emoji: '📊', label: 'Investidor Descoberto',   reward: 'Planilha de controle financeiro personalizada' },
    { count: 5,  emoji: '💼', label: 'Gestor de Dinheiro',      reward: 'Kit Digital Endinheirados (guias + templates)' },
    { count: 10, emoji: '🏆', label: 'Guardião da Grana',       reward: 'Menção especial na newsletter + badge exclusivo' },
    { count: 20, emoji: '👑', label: 'Embaixador Endinheirado', reward: 'Acesso antecipado a conteúdos e ferramentas' },
  ],
}

export async function getSiteSettings(): Promise<SiteSettings> {
  if (!client) return DEFAULT_SETTINGS
  try {
    const s = await client.fetch(
      `*[_type == "siteSettings"][0]{ subscriberGoal, subscriberGoalReward, referralMilestones, referralPrizeName, referralPrizeImage }`,
      {},
      { next: { revalidate: 300, tags: ['siteSettings'] } }
    )
    if (!s) return DEFAULT_SETTINGS
    return {
      subscriberGoal: s.subscriberGoal ?? DEFAULT_SETTINGS.subscriberGoal,
      subscriberGoalReward: s.subscriberGoalReward ?? DEFAULT_SETTINGS.subscriberGoalReward,
      referralMilestones: s.referralMilestones?.length ? s.referralMilestones : DEFAULT_SETTINGS.referralMilestones,
      referralPrizeName: s.referralPrizeName ?? DEFAULT_SETTINGS.referralPrizeName,
      referralPrizeImage: s.referralPrizeImage ?? DEFAULT_SETTINGS.referralPrizeImage,
    }
  } catch { return DEFAULT_SETTINGS }
}

export async function getCategoryCounts() {
  if (!client) return {}
  try {
    const result = await client.fetch(
      `*[_type == "post" && publishedAt <= now()]{ category }`,
      {},
      { next: { revalidate: 1800, tags: ['post'] } }
    )
    const counts: Record<string, number> = {}
    for (const r of result) {
      if (r.category) counts[r.category] = (counts[r.category] || 0) + 1
    }
    return counts
  } catch { return {} }
}
