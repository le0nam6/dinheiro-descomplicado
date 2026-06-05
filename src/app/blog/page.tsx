import { getPosts } from '@/lib/sanity'
import { AdUnit } from '@/components/AdUnit'
import Link from 'next/link'
import type { Metadata } from 'next'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Blog — Todos os artigos de finanças pessoais',
  description: 'Artigos sobre empréstimo, investimentos, cartão de crédito, financiamento e educação financeira.',
}

const funnelBadge: Record<string, string> = { tofu: 'Educação', mofu: 'Comparativo', bofu: 'Guia de Compra' }
const funnelColor: Record<string, string> = { tofu: 'bg-emerald-500', mofu: 'bg-amber-500', bofu: 'bg-rose-500' }

type Post = {
  title: string
  slug: { current: string }
  publishedAt: string
  funnel: string
  category: string
  excerpt: string
  coverImage?: { url: string; alt: string }
  readingTime?: number
}

export default async function BlogPage() {
  const posts: Post[] = await getPosts(100)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Todos os artigos</h1>
        <p className="text-gray-500">Publicamos 2 artigos por dia. Finanças sem complicação.</p>
      </div>

      <AdUnit slot="1234567890" format="horizontal" />

      {posts.length === 0 ? (
        <div className="text-center py-20 text-gray-400 border border-dashed border-gray-200 rounded-xl mt-6">
          <p className="text-4xl mb-3">📝</p>
          <p className="font-medium">Nenhum post ainda.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 mt-6">
          {posts.map(post => (
            <Link
              key={post.slug.current}
              href={`/blog/${post.slug.current}`}
              className="flex gap-4 py-5 group hover:bg-gray-50 -mx-3 px-3 rounded-xl transition-colors"
            >
              {post.coverImage?.url ? (
                <img src={post.coverImage.url} alt={post.coverImage.alt} className="w-28 h-20 object-cover rounded-xl shrink-0" />
              ) : (
                <div className="w-28 h-20 bg-gradient-to-br from-green-100 to-emerald-200 rounded-xl shrink-0 flex items-center justify-center text-2xl">💰</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold text-white px-2 py-0.5 rounded-full ${funnelColor[post.funnel] ?? 'bg-green-600'}`}>
                    {funnelBadge[post.funnel] ?? post.funnel}
                  </span>
                  <span className="text-xs text-gray-400 capitalize">{post.category}</span>
                </div>
                <h2 className="font-bold text-gray-900 text-sm md:text-base leading-snug line-clamp-2 group-hover:text-green-700 transition-colors">{post.title}</h2>
                <p className="text-gray-500 text-xs mt-1 line-clamp-1">{post.excerpt}</p>
                <p className="text-xs text-gray-400 mt-1.5">
                  {new Date(post.publishedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  {post.readingTime ? ` · ${post.readingTime} min` : ''}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
