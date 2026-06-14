import { getEditions } from '@/lib/sanity'
import { IconClock, IconArrowRight } from '@tabler/icons-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const revalidate = 1800

export const metadata: Metadata = {
  title: 'A Edição — o mercado do dia em poucos minutos',
  description: 'Toda manhã, o compilado curado das notícias de Brasil e Mundo que mexem com o seu dinheiro. Leitura rápida, sem viés, para você sair mais inteligente.',
  alternates: { canonical: '/edicao' },
}

type EditionCard = { date: string; slug: { current: string }; number?: number; title: string; intro?: string; readingTime?: number; storyCount?: number }

function formatDate(date: string) {
  return new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
}

export default async function EditionsPage() {
  const editions: EditionCard[] = await getEditions(40)
  const [latest, ...rest] = editions

  return (
    <div className="max-w-2xl mx-auto">
      <header className="mb-10 text-center">
        <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">🗞️ A Edição</p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-2">O mercado do dia, sem enrolação</h1>
        <p className="text-gray-600 mt-3 leading-relaxed">
          Todo dia às 6h, o compilado curado das notícias de Brasil e Mundo que mexem com o seu dinheiro — inclusive política, quando afeta o mercado. Leitura rápida para você começar o dia mais inteligente.
        </p>
      </header>

      {!latest && (
        <p className="text-center text-gray-400 py-16">A primeira edição sai em breve. Volte amanhã às 6h. ☕</p>
      )}

      {latest && (
        <Link href={`/edicao/${latest.slug.current}`} className="block group mb-10">
          <div className="border-2 border-green-600 rounded-2xl p-6 bg-green-50/50 hover:bg-green-50 transition-colors">
            <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-2">Edição mais recente</p>
            <div className="flex items-baseline gap-3">
              {latest.number && <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full shrink-0">#{latest.number}</span>}
              <h2 className="text-2xl font-extrabold text-gray-900 group-hover:text-green-800 transition-colors">{latest.title}</h2>
            </div>
            <p className="text-sm text-gray-400 mt-1 capitalize">{formatDate(latest.date)}</p>
            {latest.intro && <p className="text-gray-700 mt-3 leading-relaxed">{latest.intro}</p>}
            <p className="inline-flex items-center gap-1.5 text-green-700 font-semibold text-sm mt-4">
              Ler a edição <IconArrowRight size={16} stroke={2} className="group-hover:translate-x-1 transition-transform" />
            </p>
          </div>
        </Link>
      )}

      {rest.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Edições anteriores</p>
          {rest.map(e => (
            <Link key={e.slug.current} href={`/edicao/${e.slug.current}`} className="block group">
              <div className="border border-gray-200 rounded-xl p-4 hover:border-green-300 hover:bg-green-50/30 transition-colors flex items-center justify-between gap-4">
                <div className="min-w-0 flex items-start gap-2">
                  {e.number && <span className="text-[11px] font-bold text-gray-400 shrink-0 mt-0.5">#{e.number}</span>}
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 group-hover:text-green-700 transition-colors truncate">{e.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5 capitalize">{formatDate(e.date)}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-xs text-gray-400 shrink-0">
                  <IconClock size={13} stroke={1.75} /> {e.readingTime || 4} min
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
