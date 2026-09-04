import { getPosts, getLatestEdition } from '@/lib/sanity'
import { AdUnit } from '@/components/AdUnit'
import { ReferralBanner } from '@/components/ReferralBanner'
import { ButtonLink } from '@/components/Button'
import Link from 'next/link'
import { IconArrowRight, IconBook2, IconChartLine, IconCoins, IconNews, IconPencil, IconTool } from '@tabler/icons-react'

export const revalidate = 60


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
    <span className="self-start text-[11px] font-bold uppercase tracking-wide text-white bg-green-600 px-2 py-0.5 rounded-md mb-1">
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

const websiteSchema = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Endinheirados',
  url: 'https://portalendinheirados.com.br',
  description: 'Aprenda a ganhar dinheiro e garantir que ele nunca acabe. Investimentos, renda extra, independência financeira.',
  inLanguage: 'pt-BR',
  publisher: {
    '@type': 'Organization',
    name: 'Endinheirados',
    url: 'https://portalendinheirados.com.br',
    logo: { '@type': 'ImageObject', url: 'https://portalendinheirados.com.br/logo-endinheirados.png' },
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: 'https://portalendinheirados.com.br/blog?q={search_term_string}' },
    'query-input': 'required name=search_term_string',
  },
})

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
          {/* No celular o botão vai para baixo: ao lado do texto ele espremia a
                 coluna e o título era cortado no meio da primeira linha. */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-700 to-green-900 text-white px-5 py-4 sm:px-6 sm:py-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
            <IconNews size={46} stroke={1.4} className="hidden sm:block shrink-0 opacity-90" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider bg-white/15 px-2.5 py-1 rounded-full mb-2">
                A Edição · {editionLabel(edition.date)}
              </p>
              <h2 className="text-lg sm:text-xl font-extrabold leading-tight line-clamp-3 sm:line-clamp-1">{edition.title}</h2>
              {edition.intro && (
                <p className="text-green-100/80 text-sm mt-1 line-clamp-2 sm:line-clamp-1">{edition.intro}</p>
              )}
            </div>
            <span className="shrink-0 inline-flex items-center justify-center gap-1.5 w-full sm:w-auto min-h-11 bg-white text-green-800 dark:bg-green-100 dark:text-green-900 font-bold text-sm px-4 py-2 rounded-full group-hover:bg-green-50 transition-colors whitespace-nowrap">
              Ler <IconArrowRight size={15} stroke={2} className="shrink-0" aria-hidden />
            </span>
          </div>
        </Link>
      )}

      {/* ── CORPO EM DUAS COLUNAS ─────────────────────────────────────
           Notícia corre na coluna larga; o que é permanente (guias,
           glossário, newsletter) fica na lateral fixa. A faixa de
           categorias saiu daqui: os seis itens dela repetiam o menu do
           topo, e é a lateral que agora faz o papel de índice. */}
      <div className="lg:grid lg:grid-cols-[minmax(0,2.1fr)_300px] lg:gap-10 lg:items-start space-y-10 lg:space-y-0">

        {/* Coluna principal */}
        <div className="min-w-0 space-y-10">
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

        <AdUnit placeholderId={101} />

        {/* ── GRID DE ARTIGOS ───────────────────────────────────────────── */}
        {grid.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Últimas publicações</h2>
              <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-green-700 font-medium hover:underline">Ver todos <IconArrowRight size={15} stroke={2} className="shrink-0" aria-hidden /></Link>
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

          {rest.length > 0 && (
            <section>
              {/* Mais artigos */}
              <div>
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
              </div>
            </section>
          )}
        </div>

        {/* Lateral fixa */}
        <aside className="space-y-4 lg:sticky lg:top-[148px] lg:max-h-[calc(100vh-165px)] lg:overflow-y-auto lg:[scrollbar-width:none] lg:[-ms-overflow-style:none] lg:[&::-webkit-scrollbar]:hidden">
            {/* ── Trilha de guias ────────────────────────────────────────
                 Era uma lista de seis linhas de peso igual, cada uma com uma
                 cor de tag diferente — seis cores para seis itens, o que é
                 variação sem significado. E cada linha tinha uma seta que
                 repetia o que a linha inteira já diz, já que ela toda é o link.

                 Os guias têm ordem real: não dá para investir antes de sair do
                 vermelho, nem montar reserva sem sobrar dinheiro no mês. O
                 número passa a carregar essa sequência, que é informação
                 verdadeira, e substitui as cores como elemento de estrutura. */}
            <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-[10px] font-bold uppercase tracking-widest text-green-700 mb-0.5">Educação financeira</p>
                <h2 className="font-extrabold text-sm leading-snug text-gray-900">Por onde começar</h2>
                <p className="text-xs text-gray-500 leading-relaxed mt-1">Seis guias na ordem em que fazem sentido.</p>
              </div>
              <ol className="divide-y divide-gray-100">
                {[
                  { href: '/guias/como-sair-das-dividas',    label: 'Sair das dívidas' },
                  { href: '/guias/como-economizar-dinheiro', label: 'Economizar todo mês' },
                  { href: '/guias/fundo-de-emergencia',      label: 'Montar a reserva' },
                  { href: '/guias/como-investir-do-zero',    label: 'Começar a investir' },
                  { href: '/guias/previdencia-privada',      label: 'Planejar a aposentadoria' },
                  { href: '/guias/imposto-de-renda',         label: 'Declarar o Imposto de Renda' },
                ].map((g, i) => (
                  <li key={g.href}>
                    <Link href={g.href} className="flex items-center gap-3 px-4 py-2.5 group hover:bg-green-50 transition-colors">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-green-50 text-green-700 text-[11px] font-bold flex items-center justify-center tabular-nums group-hover:bg-green-600 group-hover:text-white transition-colors">
                        {i + 1}
                      </span>
                      <span className="text-sm font-semibold text-gray-800 group-hover:text-green-700 transition-colors leading-snug min-w-0">
                        {g.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
              {/* O glossário deixa de ser um cartão próprio com cabeçalho escuro
                  e passa a fechar este: os termos são justamente os que aparecem
                  nos guias acima, então pertencem ao mesmo bloco. */}
              <div className="px-4 pt-3 pb-3 border-t border-gray-100 bg-gray-50">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Termos que aparecem neles</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { slug: 'selic', label: 'Selic' },
                    { slug: 'cdi', label: 'CDI' },
                    { slug: 'juros-compostos', label: 'Juros compostos' },
                    { slug: 'tesouro-direto', label: 'Tesouro Direto' },
                    { slug: 'renda-fixa', label: 'Renda fixa' },
                    { slug: 'score-de-credito', label: 'Score' },
                  ].map(t => (
                    <Link
                      key={t.slug}
                      href={`/glossario/${t.slug}`}
                      className="text-xs font-medium px-2 py-0.5 border border-gray-200 bg-white rounded-full text-gray-600 hover:border-green-600 hover:text-green-700 transition-colors"
                    >
                      {t.label}
                    </Link>
                  ))}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                  <Link href="/guias" className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 hover:underline">
                    Todos os guias <IconArrowRight size={13} stroke={2} aria-hidden />
                  </Link>
                  <Link href="/glossario" className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 hover:underline">
                    Glossário completo <IconArrowRight size={13} stroke={2} aria-hidden />
                  </Link>
                </div>
              </div>
            </div>
              {/* Newsletter */}
              <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-green-700 mb-0.5">A edição diária</p>
                  <h2 className="font-extrabold text-sm leading-snug text-gray-900">Receba às 5h</h2>
                </div>
                <div className="px-4 py-3">
                  <p className="text-xs text-gray-600 leading-relaxed mb-3">O que move o mercado, sem enrolação, direto no seu e-mail.</p>
                  <ButtonLink href="/#newsletter" size="sm" full>Quero receber</ButtonLink>
                </div>
              </div>
        </aside>
      </div>

      {/* ── SORTEIO / INDICAÇÃO ───────────────────────────────────────── */}
      <ReferralBanner />


      {allPosts.length === 0 && (
        <div className="text-center py-16 text-gray-400 border border-dashed border-gray-200 rounded-xl">
          <p className="text-4xl mb-3">📝</p>
          <p className="font-medium text-gray-500">Nenhum post publicado ainda.</p>
          <p className="text-sm mt-1">Publicamos artigos diariamente. Volte em breve!</p>
        </div>
      )}

      <AdUnit placeholderId={105} className="mb-8" />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: websiteSchema }} />
    </div>
  )
}
