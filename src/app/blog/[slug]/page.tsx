import { getPostBySlug, getPosts } from '@/lib/sanity'
import { PortableText } from '@portabletext/react'
import { AdUnit } from '@/components/AdUnit'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

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
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.coverImage?.url ? [{ url: post.coverImage.url }] : [],
    },
  }
}


export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const date = new Date(post.publishedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <article className="max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-6">
        <a href="/" className="hover:text-green-700">Início</a>
        {' › '}
        <a href="/blog" className="hover:text-green-700">Blog</a>
        {' › '}
        <span className="text-gray-600">{post.title}</span>
      </nav>

      {/* Meta */}
      <div className="flex items-center gap-3 mb-4 text-sm text-gray-500">
        <span className="capitalize text-green-700 font-semibold">{post.category}</span>
        <span>·</span>
        <span>{date}</span>
        {post.readingTime && <><span>·</span><span>{post.readingTime} min</span></>}
      </div>

      {/* Título */}
      <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">{post.title}</h1>
      <p className="text-xl text-gray-500 mb-6 leading-relaxed">{post.excerpt}</p>

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
            h2: ({children}) => <h2 className="text-2xl font-bold mt-10 mb-4 text-gray-900 border-b border-gray-100 pb-2">{children}</h2>,
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
          },
        }} />}
      </div>

      {/* Ad meio do artigo */}
      <AdUnit slot="2222222222" className="my-8" />

      {/* FAQ Schema */}
      {post.seoKeywords && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Article',
              headline: post.title,
              description: post.excerpt,
              datePublished: post.publishedAt,
              publisher: { '@type': 'Organization', name: 'Dinheiro Descomplicado' },
            }),
          }}
        />
      )}
    </article>
  )
}
