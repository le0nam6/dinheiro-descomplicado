import type { Metadata } from 'next'
import Link from 'next/link'
import { client } from '@/lib/sanity'
import { MarketBoard } from '@/components/MarketBoard'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Mercado ao Vivo · Cotações e Notícias · Endinheirados',
  description: 'Cotações ao vivo de dólar, euro, bitcoin, Ibovespa, S&P 500, Nasdaq e Dow Jones, além das últimas notícias do mercado financeiro.',
}

async function getLatestNews() {
  if (!client) return []
  try {
    return await client.fetch(
      `*[_type=="post" && articleType=="news"]|order(publishedAt desc)[0...8]{title,"slug":slug.current,excerpt,publishedAt,coverImage}`
    )
  } catch { return [] }
}

export default async function MercadoPage() {
  const news = await getLatestNews()
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-1">📊 Mercado ao vivo</h1>
      <p className="text-gray-500 mb-8">Cotações em tempo real e as últimas do mercado financeiro.</p>

      <MarketBoard />

      <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">Últimas notícias</h2>
      <div className="grid sm:grid-cols-2 gap-5">
        {news.map((n: { slug: string; title: string; excerpt: string; publishedAt: string; coverImage?: { url: string } }) => (
          <Link key={n.slug} href={`/blog/${n.slug}`} className="group block border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
            {n.coverImage?.url && <img src={n.coverImage.url} alt="" className="w-full h-36 object-cover" />}
            <div className="p-4">
              <p className="text-xs text-gray-400 mb-1">{new Date(n.publishedAt).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
              <h3 className="font-bold text-gray-900 leading-snug group-hover:text-green-700 line-clamp-2">{n.title}</h3>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{n.excerpt}</p>
            </div>
          </Link>
        ))}
      </div>
      {news.length === 0 && <p className="text-gray-400">Ainda sem notícias publicadas. Volte em breve.</p>}
    </div>
  )
}
