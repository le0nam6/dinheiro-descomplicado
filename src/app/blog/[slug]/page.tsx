import { getPostBySlug, getPosts, getRelatedPosts } from '@/lib/sanity'
import { PortableText } from '@portabletext/react'
import { AdUnit } from '@/components/AdUnit'
import { ArticleCTA } from '@/components/ArticleCTA'
import { AffiliateBox } from '@/components/AffiliateBox'
import { TableOfContents } from '@/components/TableOfContents'
import { ImpartialityMeter } from '@/components/ImpartialityMeter'
import { NewsTrustBar } from '@/components/NewsTrustBar'
import { Comments } from '@/components/Comments'
import { extractHeadings, extractFaqs, slugifyHeading } from '@/lib/postStructure'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

function headingText(value: { children?: { text?: string }[] }) {
  return (value?.children || []).map(c => c.text || '').join('')
}

export const revalidate = 3600

export async function generateStaticParams() {
  const posts = await getPosts(100)
  return posts.map((p: { slug: { current: string } }) => ({ slug: p.slug.current }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return {}
  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.seoKeywords?.join(', '),
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      type: 'article',
      url: `/blog/${slug}`,
      title: post.title,
      description: post.excerpt,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt || post.publishedAt,
      images: post.coverImage?.url ? [{ url: post.coverImage.url }] : [],
    },
  }
}


export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const related = await getRelatedPosts(slug, post.category ?? '', 4)
  const headings = extractHeadings(post.body || [])
  const faqs = extractFaqs(post.body || [])
  const date = new Date(post.publishedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div className="max-w-5xl mx-auto lg:grid lg:grid-cols-[1fr_240px] lg:gap-10">
    <article className="max-w-2xl w-full mx-auto min-w-0">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-6">
        <a href="/" className="hover:text-green-700">Início</a>
        {' › '}
        <a href="/blog" className="hover:text-green-700">Blog</a>
        {' › '}
        <span className="text-gray-600">{post.title}</span>
      </nav>

      {/* Meta */}
      <div className="flex items-center gap-3 mb-4 text-sm text-gray-500 flex-wrap">
        <span className="capitalize text-green-700 font-semibold">{post.category}</span>
        <span>·</span>
        <Link href="/autor" className="hover:text-green-700">por Equipe Endinheirados</Link>
        <span>·</span>
        <span>{date}</span>
        {post.readingTime && <><span>·</span><span>{post.readingTime} min</span></>}
      </div>

      {/* Badge de conteúdo patrocinado */}
      {post.sponsored && (
        <div className="mb-4 inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold px-3 py-1.5 rounded-full">
          📣 Conteúdo patrocinado{post.sponsorName ? ` · ${post.sponsorName}` : ''}
        </div>
      )}

      {/* Título */}
      <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">{post.title}</h1>
      <p className="text-xl text-gray-500 mb-6 leading-relaxed">{post.excerpt}</p>

      {/* Barra de confiança (notícias) */}
      {post.articleType === 'news' && <NewsTrustBar publishedAt={post.publishedAt} updatedAt={post.updatedAt} />}

      {/* Imagem */}
      {post.coverImage?.url && (
        <figure className="mb-8">
          <img src={post.coverImage.url} alt={post.coverImage.alt} className="w-full h-64 object-cover rounded-xl" />
          {post.coverImage.credit && (
            <figcaption className="text-xs text-gray-400 mt-2 text-right">Foto: {post.coverImage.credit} · Unsplash</figcaption>
          )}
        </figure>
      )}

      {/* Ad antes do conteúdo */}
      <AdUnit slot="1111111111" format="horizontal" />

      {/* Conteúdo */}
      <div className="prose mt-8">
        {post.body && <PortableText value={post.body} components={{
          types: {
            table: ({value}: {value: {rows?: {cells: string[]}[]}}) => {
              const rows = value?.rows ?? []
              if (!rows.length) return null
              const [header, ...body] = rows
              return (
                <div className="my-6 overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr>
                        {header.cells.map((cell, i) => (
                          <th key={i} className="bg-green-50 text-green-900 font-bold text-left px-3 py-2 border border-gray-200">{cell}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {body.map((row, ri) => (
                        <tr key={ri} className={ri % 2 ? 'bg-gray-50' : ''}>
                          {row.cells.map((cell, ci) => (
                            <td key={ci} className="px-3 py-2 border border-gray-200 text-gray-700">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            },
          },
          block: {
            h2: ({children, value}) => {
              const id = slugifyHeading(headingText(value as { children?: { text?: string }[] }))
              return <h2 id={id} className="text-2xl font-bold mt-10 mb-4 text-gray-900 border-b border-gray-100 pb-2 scroll-mt-24">{children}</h2>
            },
            h3: ({children}) => <h3 className="text-xl font-bold mt-8 mb-3 text-gray-800">{children}</h3>,
            h4: ({children}) => (
              <div className="flex items-start gap-2 mt-8 mb-2">
                <span className="text-green-600 font-black text-lg leading-tight mt-0.5">?</span>
                <h4 className="text-base font-bold text-gray-900 leading-snug">{children}</h4>
              </div>
            ),
            normal: ({children}) => <p className="text-gray-700 leading-relaxed mb-4 text-[17px]">{children}</p>,
            blockquote: ({children}) => (
              <blockquote className="border-l-4 border-green-500 bg-green-50 pl-4 pr-4 py-3 my-6 rounded-r-xl italic text-gray-700 text-base">
                {children}
              </blockquote>
            ),
          },
          list: {
            bullet: ({children}) => <ul className="list-none space-y-2 my-4">{children}</ul>,
            number: ({children}) => <ol className="list-decimal list-inside space-y-2 my-4 text-gray-700">{children}</ol>,
          },
          listItem: {
            bullet: ({children}) => (
              <li className="flex items-start gap-2 text-gray-700 text-[17px]">
                <span className="text-green-500 font-bold mt-1 shrink-0">✓</span>
                <span>{children}</span>
              </li>
            ),
            number: ({children}) => <li className="text-gray-700 text-[17px] leading-relaxed">{children}</li>,
          },
          marks: {
            strong: ({children}) => <strong className="font-bold text-gray-900">{children}</strong>,
            em: ({children}) => <em className="italic text-gray-600">{children}</em>,
            link: ({children, value}: {children: React.ReactNode; value?: {href?: string}}) => {
              const href = value?.href || '#'
              const internal = href.startsWith('/')
              return (
                <a
                  href={href}
                  className="text-green-700 font-semibold underline decoration-green-300 underline-offset-2 hover:decoration-green-600"
                  {...(internal ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
                >
                  {children}
                </a>
              )
            },
          },
        }} />}
      </div>

      {/* Fontes (apenas notícias) */}
      {post.articleType === 'news' && post.sources?.length > 0 && (
        <section className="mt-10 border-t border-gray-200 pt-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Fontes</h2>
          <ul className="space-y-2">
            {post.sources.map((s: { name: string; url: string }, i: number) => (
              <li key={i} className="text-sm">
                <a href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="text-green-700 hover:underline break-all">
                  {s.name || s.url}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Termômetro de imparcialidade (apenas notícias) */}
      {post.articleType === 'news' && <ImpartialityMeter slug={post.slug.current} />}

      {/* Ofertas de afiliado (MoFu/BoFu) */}
      {(post.funnel === 'bofu' || post.funnel === 'mofu') && <AffiliateBox category={post.category ?? ''} />}

      {/* CTA: Ferramentas + Links internos */}
      <ArticleCTA category={post.category ?? ''} related={related} />

      {/* Comentários (Giscus) */}
      <Comments />

      {/* JSON-LD: Article + Author */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': post.articleType === 'news' ? 'NewsArticle' : 'Article',
            headline: post.title,
            description: post.excerpt,
            image: post.coverImage?.url ? [post.coverImage.url] : undefined,
            datePublished: post.publishedAt,
            dateModified: post.updatedAt || post.publishedAt,
            author: { '@type': 'Organization', name: 'Equipe Editorial Endinheirados', url: 'https://endinheirados.cc/autor' },
            publisher: { '@type': 'Organization', name: 'Endinheirados', logo: { '@type': 'ImageObject', url: 'https://endinheirados.cc/icon.png' } },
          }),
        }}
      />

      {/* JSON-LD: FAQ (rich snippets) */}
      {faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: faqs.map(f => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: { '@type': 'Answer', text: f.a },
              })),
            }),
          }}
        />
      )}
    </article>

    {/* Índice navegável (sticky centralizado, só em telas grandes e guias longos) */}
    <aside className="hidden lg:block">
      <div className="sticky top-0 h-screen flex items-center">
        <div className="max-h-[70vh] overflow-y-auto w-full pr-1">
          <TableOfContents headings={headings} />
        </div>
      </div>
    </aside>
    </div>
  )
}
