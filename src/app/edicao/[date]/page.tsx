import { getEditionByDate, getEditions } from '@/lib/sanity'
import { ShareStory } from '@/components/ShareStory'
import { IconClock, IconExternalLink, IconArrowRight } from '@tabler/icons-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const revalidate = 1800

type Source = { name: string; url: string }
type Story = { _key: string; emoji?: string; tag?: string; headline: string; what?: string; why?: string; sources?: Source[] }
type Quote = { _key: string; label: string; value: string; changePct: number }

function slugifyHeadline(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
}

function formatDate(date: string) {
  const d = new Date(date + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
}

export async function generateStaticParams() {
  const editions = await getEditions(60)
  return editions.map((e: { slug: { current: string } }) => ({ date: e.slug.current }))
}

export async function generateMetadata({ params }: { params: Promise<{ date: string }> }): Promise<Metadata> {
  const { date } = await params
  const ed = await getEditionByDate(date)
  if (!ed) return {}
  return {
    title: ed.title,
    description: ed.intro || `O compilado do mercado financeiro de ${formatDate(date)} em poucos minutos.`,
    alternates: { canonical: `/edicao/${date}` },
    openGraph: { type: 'article', url: `/edicao/${date}`, title: ed.title, description: ed.intro },
  }
}

export default async function EditionPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params
  const ed = await getEditionByDate(date)
  if (!ed) notFound()

  const stories: Story[] = ed.stories || []
  const snapshot: Quote[] = ed.marketSnapshot || []
  const pageUrl = `https://endinheirados.cc/edicao/${date}`

  return (
    <article className="max-w-2xl mx-auto">
      {/* Cabeçalho */}
      <header className="mb-8">
        <Link href="/edicao" className="text-sm text-green-700 font-medium hover:underline">← Todas as edições</Link>
        <p className="mt-4 text-sm font-semibold text-green-700 uppercase tracking-wide">🗞️ A Edição · {formatDate(date)}</p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-2 leading-tight">{ed.title}</h1>
        {ed.intro && <p className="text-lg text-gray-600 mt-4 leading-relaxed">{ed.intro}</p>}
        <div className="flex items-center gap-2 mt-4 text-sm text-gray-400">
          <IconClock size={16} stroke={1.75} />
          <span>Leitura de {ed.readingTime || 4} min · {stories.length} assuntos</span>
        </div>
      </header>

      {/* Termômetro do mercado */}
      {snapshot.length > 0 && (
        <div className="mb-10 bg-gray-900 rounded-2xl p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Termômetro do mercado</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {snapshot.map(q => {
              const up = q.changePct >= 0
              return (
                <div key={q._key} className="min-w-0">
                  <p className="text-[11px] text-gray-400 truncate">{q.label}</p>
                  <p className="text-white font-bold tabular-nums truncate">{q.value}</p>
                  <p className={`text-xs font-semibold tabular-nums ${up ? 'text-green-400' : 'text-red-400'}`}>
                    {up ? '▲' : '▼'} {Math.abs(q.changePct).toFixed(2)}%
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Índice rápido */}
      <nav className="mb-10 border border-gray-200 rounded-2xl p-5 bg-gray-50">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Nesta edição</p>
        <ul className="space-y-1.5">
          {stories.map(s => (
            <li key={s._key}>
              <a href={`#${slugifyHeadline(s.headline)}`} className="text-sm text-gray-700 hover:text-green-700 flex items-start gap-2">
                <span>{s.emoji || '•'}</span>
                <span className="hover:underline">{s.headline}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Matérias */}
      <div className="space-y-12">
        {stories.map(s => {
          const id = slugifyHeadline(s.headline)
          return (
            <section key={s._key} id={id} className="scroll-mt-24">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{s.emoji || '•'}</span>
                {s.tag && <span className="text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full uppercase tracking-wide">{s.tag}</span>}
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 leading-snug mb-4">{s.headline}</h2>

              {s.what && (
                <div className="mb-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">O que aconteceu</p>
                  <p className="text-gray-700 text-[17px] leading-relaxed">{s.what}</p>
                </div>
              )}

              {s.why && (
                <div className="mb-4 border-l-4 border-green-500 bg-green-50 rounded-r-xl px-4 py-3">
                  <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-1">Por que importa</p>
                  <p className="text-gray-800 text-[16px] leading-relaxed">{s.why}</p>
                </div>
              )}

              {/* Fontes + compartilhar */}
              <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                {s.sources && s.sources.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
                    <span className="font-semibold">Fontes:</span>
                    {s.sources.map((src, i) => (
                      <a key={i} href={src.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-green-700 hover:underline">
                        {src.name} <IconExternalLink size={12} stroke={2} />
                      </a>
                    ))}
                  </div>
                ) : <span />}
                <ShareStory headline={s.headline} summary={s.what || s.why || ''} url={`${pageUrl}#${id}`} />
              </div>

              <hr className="mt-10 border-gray-100" />
            </section>
          )
        })}
      </div>

      {/* CTA newsletter */}
      <div className="mt-12 bg-gradient-to-br from-green-700 to-green-900 text-white rounded-2xl p-6 text-center">
        <p className="font-bold text-lg mb-1">Gostou da Edição?</p>
        <p className="text-green-100 text-sm mb-4">Em breve ela chega no seu e-mail toda manhã. Cadastre-se e seja avisado.</p>
        <Link href="/#newsletter" className="inline-flex items-center gap-1.5 bg-white text-green-800 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-green-50 transition-colors">
          Quero receber <IconArrowRight size={16} stroke={2} />
        </Link>
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'NewsArticle',
            headline: ed.title,
            description: ed.intro,
            datePublished: ed.publishedAt,
            dateModified: ed.publishedAt,
            author: { '@type': 'Organization', name: 'Equipe Editorial Endinheirados', url: 'https://endinheirados.cc/autor' },
            publisher: { '@type': 'Organization', name: 'Endinheirados', logo: { '@type': 'ImageObject', url: 'https://endinheirados.cc/icon.png' } },
          }),
        }}
      />
    </article>
  )
}
