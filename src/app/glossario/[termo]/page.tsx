import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { terms, getTermBySlug } from '@/lib/glossario'

export async function generateStaticParams() {
  return terms.map(t => ({ termo: t.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ termo: string }> }): Promise<Metadata> {
  const { termo } = await params
  const term = getTermBySlug(termo)
  if (!term) return {}
  return {
    title: `O que é ${term.name}? — Glossário Financeiro`,
    description: term.shortDef,
    alternates: { canonical: `https://endinheirados.cc/glossario/${termo}` },
  }
}

const SITE = 'https://endinheirados.cc'

export default async function TermPage({ params }: { params: Promise<{ termo: string }> }) {
  const { termo } = await params
  const term = getTermBySlug(termo)
  if (!term) notFound()

  const related = terms.filter(t => term.related.includes(t.slug))

  return (
    <div className="max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-green-700">Início</Link>
        {' › '}
        <Link href="/glossario" className="hover:text-green-700">Glossário</Link>
        {' › '}
        <span className="text-gray-600">{term.name}</span>
      </nav>

      {/* Cabeçalho */}
      <div className="mb-6">
        <p className="text-xs font-bold text-green-700 uppercase tracking-widest mb-2">Glossário Financeiro</p>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-3">O que é {term.name}?</h1>
        <p className="text-xl text-gray-500 leading-relaxed">{term.shortDef}</p>
      </div>

      {/* Corpo */}
      <div className="prose mb-10 space-y-4">
        {term.body.map((paragraph, i) => (
          <p key={i} className="text-gray-700 leading-relaxed text-[17px]">{paragraph}</p>
        ))}
      </div>

      {/* FAQ */}
      <div className="space-y-4 mb-10">
        <h2 className="text-xl font-bold text-gray-900">Perguntas frequentes</h2>
        {term.faqs.map((faq, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-5 bg-white">
            <div className="flex items-start gap-2 mb-2">
              <span className="text-green-600 font-black text-base leading-tight mt-0.5 shrink-0">?</span>
              <h3 className="font-bold text-gray-900 text-base leading-snug">{faq.q}</h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed pl-5">{faq.a}</p>
          </div>
        ))}
      </div>

      {/* Termos relacionados */}
      {related.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Termos relacionados</h2>
          <div className="flex flex-wrap gap-2">
            {related.map(r => (
              <Link
                key={r.slug}
                href={`/glossario/${r.slug}`}
                className="text-sm font-semibold text-green-700 border border-green-200 bg-green-50 px-3 py-1.5 rounded-full hover:bg-green-100 transition-colors"
              >
                {r.name} →
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Ferramentas */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center mb-6">
        <p className="font-bold text-gray-900 mb-1">Coloque em prática</p>
        <p className="text-sm text-gray-500 mb-3">Use nossas calculadoras para simular com seus próprios números.</p>
        <div className="flex flex-wrap gap-2 justify-center">
          <Link href="/ferramentas/calculadora-juros" className="text-sm font-semibold text-green-700 hover:underline">Calculadora de Investimentos →</Link>
          <Link href="/ferramentas/simulador-dividas" className="text-sm font-semibold text-green-700 hover:underline">Simulador de Dívidas →</Link>
        </div>
      </div>

      {/* JSON-LD: DefinedTerm */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'DefinedTerm',
            name: term.name,
            description: term.shortDef,
            url: `${SITE}/glossario/${term.slug}`,
            inDefinedTermSet: {
              '@type': 'DefinedTermSet',
              name: 'Glossário Financeiro Endinheirados',
              url: `${SITE}/glossario`,
            },
          }),
        }}
      />
      {/* JSON-LD: FAQPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: term.faqs.map(f => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          }),
        }}
      />
      {/* JSON-LD: BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Início', item: SITE },
              { '@type': 'ListItem', position: 2, name: 'Glossário', item: `${SITE}/glossario` },
              { '@type': 'ListItem', position: 3, name: term.name, item: `${SITE}/glossario/${term.slug}` },
            ],
          }),
        }}
      />
    </div>
  )
}
