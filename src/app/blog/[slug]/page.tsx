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

const funnelLabel = { tofu: '📗 Educação', mofu: '📙 Comparativo', bofu: '📕 Guia de Compra' }

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
        <span>{funnelLabel[post.funnel as keyof typeof funnelLabel]}</span>
        <span>·</span>
        <span className="capitalize">{post.category}</span>
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
        {post.body && <PortableText value={post.body} />}
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
