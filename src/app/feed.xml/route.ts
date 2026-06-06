import { getPosts } from '@/lib/sanity'

const BASE_URL = 'https://endinheirados.cc'

type Post = {
  title: string
  slug: { current: string }
  publishedAt: string
  excerpt: string
  category: string
  coverImage?: { url: string }
}

function escapeXml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const posts: Post[] = await getPosts(30)

  const items = posts
    .map(
      (post) => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${BASE_URL}/blog/${post.slug.current}</link>
      <guid isPermaLink="true">${BASE_URL}/blog/${post.slug.current}</guid>
      <description>${escapeXml(post.excerpt)}</description>
      <category>${escapeXml(post.category)}</category>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      ${post.coverImage?.url ? `<enclosure url="${escapeXml(post.coverImage.url)}" type="image/jpeg" />` : ''}
    </item>`
    )
    .join('')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Endinheirados</title>
    <link>${BASE_URL}</link>
    <description>Aprenda a ganhar dinheiro e garantir que ele nunca acabe. Finanças sem complicação.</description>
    <language>pt-BR</language>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate',
    },
  })
}
