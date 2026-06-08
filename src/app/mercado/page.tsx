import type { Metadata } from 'next'
import Link from 'next/link'
import { client, getLatestEdition } from '@/lib/sanity'
import { MarketBoard } from '@/components/MarketBoard'
import { IconChartAreaLine, IconArrowRight } from '@tabler/icons-react'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Mercado ao Vivo · Cotações e Notícias · Endinheirados',
  description: 'Cotações ao vivo de dólar, euro, bitcoin, Ibovespa, S&P 500, Nasdaq e Dow Jones, além das últimas notícias do mercado financeiro.',
  alternates: { canonical: '/mercado' },
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
  const [news, edition] = await Promise.all([getLatestNews(), getLatestEdition()])
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="flex items-center gap-2.5 text-3xl font-extrabold text-gray-900 mb-2">
        <IconChartAreaLine size={30} stroke={1.75} className="text-green-600" /> Mercado ao vivo
      </h1>
      <p className="text-gray-500 mb-10">Cotações em tempo real e as últimas do mercado financeiro.</p>

      {/* A Edição — compilado diário do mercado */}
      {edition && (
        <Link href={`/edicao/${edition.slug.current}`} className="group block mb-10">
          <div className="border-2 border-green-600 rounded-2xl p-5 sm:p-6 bg-green-50/50 hover:bg-green-50 transition-colors">
            <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-1.5">🗞️ A Edição de hoje · o mercado do dia em poucos minutos</p>
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 group-hover:text-green-800 transition-colors">{edition.title}</h2>
            {edition.intro && <p className="text-gray-700 mt-2 leading-relaxed line-clamp-2">{edition.intro}</p>}
            <p className="inline-flex items-center gap-1.5 text-green-700 font-semibold text-sm mt-3">
              Ler a edição <IconArrowRight size={16} stroke={2} className="group-hover:translate-x-1 transition-transform" />
            </p>
          </div>
        </Link>
      )}

      <MarketBoard />

      <div className="flex items-end justify-between mt-16 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Últimas notícias</h2>
        {edition && <Link href="/edicao" className="text-sm font-medium text-green-700 hover:underline shrink-0">Edições anteriores →</Link>}
      </div>
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
