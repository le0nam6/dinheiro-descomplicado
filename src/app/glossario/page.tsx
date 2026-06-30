import type { Metadata } from 'next'
import Link from 'next/link'
import { terms } from '@/lib/glossario'

export const metadata: Metadata = {
  title: 'Glossário Financeiro — Termos Essenciais Explicados',
  description: 'Dicionário de finanças pessoais: significado de Selic, CDI, FGTS, LCI, LCA, juros compostos e mais. Explicações diretas e sem enrolação.',
  alternates: { canonical: 'https://portalendinheirados.com.br/glossario' },
}

const SITE = 'https://portalendinheirados.com.br'

export default function GlossarioPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <p className="text-4xl mb-3">📚</p>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Glossário Financeiro</h1>
        <p className="text-gray-500 max-w-xl mx-auto">
          Os termos do mundo das finanças explicados de forma simples. Sem jargão desnecessário.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-12">
        {terms.map(term => (
          <Link key={term.slug} href={`/glossario/${term.slug}`}>
            <div className="group border border-gray-200 rounded-2xl p-5 hover:shadow-md hover:border-green-300 transition-all bg-white">
              <h2 className="font-bold text-gray-900 text-base mb-1 group-hover:text-green-700 transition-colors">
                {term.name}
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">{term.shortDef}</p>
              <p className="text-sm font-semibold text-green-700 mt-3">Ver definição completa →</p>
            </div>
          </Link>
        ))}
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'DefinedTermSet',
            name: 'Glossário Financeiro Endinheirados',
            url: `${SITE}/glossario`,
            description: 'Dicionário de termos de finanças pessoais e investimentos em português.',
            publisher: { '@type': 'Organization', name: 'Endinheirados', url: SITE },
            hasDefinedTerm: terms.map(t => ({
              '@type': 'DefinedTerm',
              name: t.name,
              description: t.shortDef,
              url: `${SITE}/glossario/${t.slug}`,
            })),
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: 'Glossário Financeiro',
            url: `${SITE}/glossario`,
            numberOfItems: terms.length,
            itemListElement: terms.map((t, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: t.name,
              url: `${SITE}/glossario/${t.slug}`,
            })),
          }),
        }}
      />
    </div>
  )
}
