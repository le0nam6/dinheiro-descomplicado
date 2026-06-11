import { getPosts, getLatestEdition } from '@/lib/sanity'
import { AdUnit } from '@/components/AdUnit'
import { IconArrowRight } from '@tabler/icons-react'
import Link from 'next/link'

export const revalidate = 60

const categories = [
  { label: 'Ganhar Dinheiro', href: '/categoria/ganhar-dinheiro', icon: '🚀', desc: 'Renda extra, MMO, sair da CLT' },
  { label: 'Investimentos', href: '/categoria/investimentos', icon: '📈', desc: 'Renda fixa, ações, fundos' },
  { label: 'Educação Financeira', href: '/categoria/educacao-financeira', icon: '📚', desc: 'Score, orçamento, hábitos' },
  { label: 'Cartão', href: '/categoria/cartao-de-credito', icon: '🏦', desc: 'Cashback, milhas, sem anuidade' },
  { label: 'Empréstimo', href: '/categoria/emprestimo', icon: '💳', desc: 'Consignado, pessoal, FGTS' },
  { label: 'Financiamento', href: '/categoria/financiamento', icon: '🏠', desc: 'Imóvel, veículo, simulação' },
  { label: 'Previdência', href: '/categoria/previdencia', icon: '📊', desc: 'PGBL, VGBL, aposentadoria' },
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
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function editionLabel(date: string) {
  return new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
}

export default async function Home() {
  const [allPosts, edition] = await Promise.all([getPosts(20) as Promise<Post[]>, getLatestEdition()])
  const featured = allPosts[0] ?? null
  const popular = allPosts.slice(1, 5)
  const recent = allPosts.slice(5)

  return (
    <div className="max-w-5xl mx-auto">

      {/* ── A EDIÇÃO DO DIA (destaque) ──────────────────────────────────── */}
      {edition && (
        <Link href={`/edicao/${edition.slug.current}`} className="group block mb-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-700 to-green-900 text-white p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide bg-white/15 px-2.5 py-1 rounded-full mb-3">
                  🗞️ A Edição · {editionLabel(edition.date)}
                </p>
                <h2 className="text-xl sm:text-2xl font-extrabold leading-tight">{edition.title}</h2>
                <p className="text-green-50 text-sm mt-1.5">O mercado do dia em poucos minutos — Brasil, mundo e o que mexe no seu bolso.</p>
                {edition.intro && <p className="text-green-100/90 text-sm mt-2 line-clamp-2 max-w-2xl">{edition.intro}</p>}
                <span className="inline-flex items-center gap-1.5 mt-4 bg-white text-green-800 font-bold text-sm px-4 py-2 rounded-full group-hover:bg-green-50 transition-colors">
                  Ler a edição de hoje <IconArrowRight size={16} stroke={2.25} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
              <span className="hidden sm:block text-6xl shrink-0 select-none opacity-90">🗞️</span>
            </div>
          </div>
        </Link>
      )}

      {/* ── HERO CANVAS ─────────────────────────────────────────────────── */}
      {featured ? (
        <section className="relative rounded-2xl overflow-hidden mb-10 min-h-[420px] flex items-end">
          {featured.coverImage?.url ? (
            <img
              src={featured.coverImage.url}
              alt={featured.coverImage.alt}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-green-900 to-green-700" />
          )}
          {/* gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

          {/* content */}
          <div className="relative z-10 p-7 md:p-10 w-full">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-white/70 capitalize font-semibold">{featured.category}</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-white leading-tight mb-3 max-w-2xl">
              {featured.title}
            </h1>
            <p className="text-white/75 text-sm md:text-base mb-5 max-w-xl line-clamp-2">
              {featured.excerpt}
            </p>
            <Link
              href={`/blog/${featured.slug.current}`}
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white font-semibold text-sm px-5 py-2.5 rounded-full transition-colors"
            >
              Ler agora →
            </Link>
          </div>
        </section>
      ) : (
        <section className="relative rounded-2xl overflow-hidden mb-10 min-h-[320px] flex items-center justify-center bg-gradient-to-br from-green-900 to-green-700">
          <div className="text-center text-white/60 px-8">
            <p className="text-5xl mb-4">💰</p>
            <p className="text-xl font-bold text-white">Endinheirados</p>
            <p className="text-sm mt-2">Ganhe dinheiro. Garanta que ele nunca acabe.</p>
          </div>
        </section>
      )}

      <AdUnit slot="1234567890" format="horizontal" />

      {/* ── MAIS LIDOS ─────────────────────────────────────────────────── */}
      {popular.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              🔥 Mais Lidos
            </h2>
            <Link href="/blog" className="text-sm text-green-700 font-medium hover:underline">
              Ver todos →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {popular.map((post, i) => (
              <Link
                key={post.slug.current}
                href={`/blog/${post.slug.current}`}
                className="flex gap-4 items-start group bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-green-200 transition-all"
              >
                {/* number */}
                <span className="text-3xl font-black text-gray-100 leading-none w-8 shrink-0 select-none">
                  {i + 1}
                </span>
                {/* text */}
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-green-700 font-semibold capitalize">{post.category}</span>
                  <p className="font-bold text-gray-900 text-sm leading-snug mt-0.5 line-clamp-2 group-hover:text-green-700 transition-colors">
                    {post.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(post.publishedAt)}{post.readingTime ? ` · ${post.readingTime} min` : ''}</p>
                </div>
                {/* thumbnail */}
                {post.coverImage?.url && (
                  <img
                    src={post.coverImage.url}
                    alt={post.coverImage.alt}
                    className="w-20 h-16 object-cover rounded-lg shrink-0"
                  />
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── CATEGORIAS ─────────────────────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Explorar por tema</h2>
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map(cat => (
            <Link
              key={cat.href}
              href={cat.href}
              className="flex-none flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5 hover:border-green-400 hover:bg-green-50 transition-all bg-white whitespace-nowrap"
            >
              <span className="text-lg">{cat.icon}</span>
              <span className="font-semibold text-sm text-gray-800">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── ARTIGOS RECENTES ────────────────────────────────────────────── */}
      {recent.length > 0 && <section className="mb-12">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Artigos recentes</h2>
        </div>

        {recent.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {recent.map(post => (
              <Link
                key={post.slug.current}
                href={`/blog/${post.slug.current}`}
                className="flex gap-4 py-5 group hover:bg-gray-50 -mx-3 px-3 rounded-xl transition-colors"
              >
                {/* thumbnail */}
                {post.coverImage?.url ? (
                  <img
                    src={post.coverImage.url}
                    alt={post.coverImage.alt}
                    className="w-28 h-20 object-cover rounded-xl shrink-0"
                  />
                ) : (
                  <div className="w-28 h-20 bg-gradient-to-br from-green-100 to-emerald-200 rounded-xl shrink-0 flex items-center justify-center text-2xl">
                    💰
                  </div>
                )}
                {/* text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-green-700 font-semibold capitalize">{post.category}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm md:text-base leading-snug line-clamp-2 group-hover:text-green-700 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-gray-500 text-xs mt-1 line-clamp-1">{post.excerpt}</p>
                  <p className="text-xs text-gray-400 mt-1.5">{formatDate(post.publishedAt)}{post.readingTime ? ` · ${post.readingTime} min de leitura` : ''}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : null}
      </section>}

      {allPosts.length === 0 && (
        <div className="text-center py-16 text-gray-400 border border-dashed border-gray-200 rounded-xl mb-12">
          <p className="text-4xl mb-3">📝</p>
          <p className="font-medium text-gray-500">Nenhum post publicado ainda.</p>
          <p className="text-sm mt-1">Publicamos 2 artigos por dia. Volte em breve!</p>
        </div>
      )}

      <AdUnit slot="0987654321" className="mb-8" />

    </div>
  )
}
