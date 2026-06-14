import { getPosts, getLatestEdition } from '@/lib/sanity'
import { AdUnit } from '@/components/AdUnit'
import Link from 'next/link'

export const revalidate = 60

const categories = [
  { label: 'Notícias', href: '/categoria/noticias', icon: '📰' },
  { label: 'Blog', href: '/blog', icon: '✍️' },
  { label: 'Educação Financeira', href: '/categoria/educacao-financeira', icon: '📚' },
  { label: 'Ganhe Dinheiro', href: '/categoria/ganhar-dinheiro', icon: '🚀' },
  { label: 'Investimentos', href: '/categoria/investimentos', icon: '📈' },
  { label: 'Ferramentas', href: '/ferramentas', icon: '🛠️' },
]

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function editionLabel(date: string) {
  return new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
}

function CategoryBadge({ category, onImage = false }: { category: string; onImage?: boolean }) {
  return onImage ? (
    <span className="inline-block text-[11px] font-bold uppercase tracking-wide text-white bg-green-600/80 px-2 py-0.5 rounded-md mb-1">
      {category}
    </span>
  ) : (
    <span className="text-[11px] font-bold uppercase tracking-wide text-green-700">
      {category}
    </span>
  )
}

function PostCover({ post, className = '' }: { post: Post; className?: string }) {
  if (post.coverImage?.url) {
    return <img src={post.coverImage.url} alt={post.coverImage.alt} className={className} />
  }
  return <div className={`${className} bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center text-3xl`}>💰</div>
}

export default async function Home() {
  const [allPosts, edition] = await Promise.all([getPosts(30) as Promise<Post[]>, getLatestEdition()])

  const featured = allPosts[0] ?? null
  const secondary = allPosts.slice(1, 3)
  const grid = allPosts.slice(3, 12)
  const rest = allPosts.slice(12)

  return (
    <div className="max-w-5xl mx-auto space-y-10">

      {/* ── EDIÇÃO DO DIA ─────────────────────────────────────────────── */}
      {edition && (
        <Link href={`/edicao/${edition.slug.current}`} className="group block">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-700 to-green-900 text-white px-5 py-4 sm:px-6 sm:py-5 flex items-center gap-5">
            <span className="hidden sm:block text-5xl shrink-0 select-none">🗞️</span>
            <div className="min-w-0 flex-1">
              <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider bg-white/15 px-2.5 py-1 rounded-full mb-2">
                A Edição · {editionLabel(edition.date)}
              </p>
              <h2 className="text-lg sm:text-xl font-extrabold leading-tight line-clamp-1">{edition.title}</h2>
              {edition.intro && (
                <p className="text-green-100/80 text-sm mt-1 line-clamp-1">{edition.intro}</p>
              )}
            </div>
            <span className="shrink-0 bg-white text-green-800 font-bold text-sm px-4 py-2 rounded-full group-hover:bg-green-50 transition-colors whitespace-nowrap">
              Ler →
            </span>
          </div>
        </Link>
      )}

      {/* ── HERO + SECUNDÁRIOS ────────────────────────────────────────── */}
      {featured && (
        <section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Featured: ocupa 2/3 */}
            <Link href={`/blog/${featured.slug.current}`} className="group md:col-span-2">
              <article className="relative rounded-2xl overflow-hidden h-[280px] sm:h-[340px]">
                <PostCover post={featured} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
                <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-end">
                  <CategoryBadge category={featured.category} onImage />
                  <h2 className="text-white font-extrabold text-lg sm:text-2xl leading-tight mt-1 mb-2 line-clamp-3">
                    {featured.title}
                  </h2>
                  <p className="text-white/70 text-xs">{formatDate(featured.publishedAt)}{featured.readingTime ? ` · ${featured.readingTime} min` : ''}</p>
                </div>
              </article>
            </Link>

            {/* Secundários: 1/3, empilhados */}
            <div className="flex flex-col gap-4">
              {secondary.map(post => (
                <Link key={post.slug.current} href={`/blog/${post.slug.current}`} className="group flex-1">
                  <article className="relative rounded-2xl overflow-hidden h-[130px] sm:h-[160px]">
                    <PostCover post={post} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute inset-0 p-4 flex flex-col justify-end">
                      <CategoryBadge category={post.category} onImage />
                      <h3 className="text-white font-bold text-sm leading-snug mt-0.5 line-clamp-2">
                        {post.title}
                      </h3>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CATEGORIAS ────────────────────────────────────────────────── */}
      <section>
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {categories.map(cat => (
            <Link
              key={cat.href}
              href={cat.href}
              className="flex-none flex items-center gap-1.5 border border-gray-200 rounded-xl px-3 py-2 hover:border-green-400 hover:bg-green-50 transition-all bg-white whitespace-nowrap"
            >
              <span className="text-base">{cat.icon}</span>
              <span className="font-semibold text-sm text-gray-800">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <AdUnit slot="1234567890" format="horizontal" />

      {/* ── GRID DE ARTIGOS ───────────────────────────────────────────── */}
      {grid.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">Últimas publicações</h2>
            <Link href="/blog" className="text-sm text-green-700 font-medium hover:underline">Ver todos →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {grid.map(post => (
              <Link key={post.slug.current} href={`/blog/${post.slug.current}`} className="group">
                <article className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md hover:border-green-200 transition-all h-full flex flex-col">
                  <div className="relative h-44 shrink-0 overflow-hidden">
                    <PostCover post={post} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <CategoryBadge category={post.category} />
                    <h3 className="font-bold text-gray-900 text-sm leading-snug mt-1.5 mb-2 line-clamp-2 group-hover:text-green-700 transition-colors flex-1">
                      {post.title}
                    </h3>
                    <p className="text-gray-400 text-xs line-clamp-2 mb-3">{post.excerpt}</p>
                    <p className="text-xs text-gray-400">
                      {formatDate(post.publishedAt)}{post.readingTime ? ` · ${post.readingTime} min` : ''}
                    </p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── MAIS ARTIGOS (lista compacta) ────────────────────────────── */}
      {rest.length > 0 && (
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-4">Mais artigos</h2>
          <div className="divide-y divide-gray-100">
            {rest.map(post => (
              <Link
                key={post.slug.current}
                href={`/blog/${post.slug.current}`}
                className="flex gap-4 py-4 group hover:bg-gray-50 -mx-3 px-3 rounded-xl transition-colors"
              >
                {post.coverImage?.url ? (
                  <img src={post.coverImage.url} alt={post.coverImage.alt} className="w-20 h-14 object-cover rounded-xl shrink-0" />
                ) : (
                  <div className="w-20 h-14 bg-gradient-to-br from-green-100 to-emerald-200 rounded-xl shrink-0 flex items-center justify-center text-xl">💰</div>
                )}
                <div className="flex-1 min-w-0">
                  <CategoryBadge category={post.category} />
                  <h3 className="font-bold text-gray-900 text-sm leading-snug mt-0.5 line-clamp-2 group-hover:text-green-700 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(post.publishedAt)}{post.readingTime ? ` · ${post.readingTime} min` : ''}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {allPosts.length === 0 && (
        <div className="text-center py-16 text-gray-400 border border-dashed border-gray-200 rounded-xl">
          <p className="text-4xl mb-3">📝</p>
          <p className="font-medium text-gray-500">Nenhum post publicado ainda.</p>
          <p className="text-sm mt-1">Publicamos artigos diariamente. Volte em breve!</p>
        </div>
      )}

      <AdUnit slot="0987654321" className="mb-8" />

    </div>
  )
}
