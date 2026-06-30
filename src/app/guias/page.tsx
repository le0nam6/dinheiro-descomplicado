import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Guias Financeiros Completos — Passo a Passo',
  description: 'Guias práticos e completos de finanças pessoais: fundo de emergência, score de crédito, como investir do zero e mais. Linguagem simples, resultado real.',
  alternates: { canonical: 'https://portalendinheirados.com.br/guias' },
}

const guias = [
  {
    href: '/guias/como-sair-das-dividas',
    title: 'Como sair das dívidas: guia passo a passo',
    desc: 'Da lista de dívidas ao plano de ataque — métodos bola de neve e avalanche, negociação com bancos e como não voltar a se endividar.',
    tag: 'Dívidas',
    tagColor: 'bg-red-100 text-red-700',
    readingTime: '12 min',
  },
  {
    href: '/guias/como-economizar-dinheiro',
    title: '20 formas de economizar dinheiro que funcionam',
    desc: 'Sem cortar café. Gastos fixos, alimentação, compras e o que fazer com o dinheiro que sobra.',
    tag: 'Organização',
    tagColor: 'bg-blue-100 text-blue-700',
    readingTime: '10 min',
  },
  {
    href: '/guias/fundo-de-emergencia',
    title: 'Como montar seu fundo de emergência',
    desc: 'Quanto guardar, onde deixar e como chegar lá sem precisar de um salário alto.',
    tag: 'Organização',
    tagColor: 'bg-blue-100 text-blue-700',
    readingTime: '8 min',
  },
  {
    href: '/guias/score-de-credito',
    title: 'Como aumentar o score de crédito',
    desc: 'O que realmente mexe com o seu Score, o que é mito e o passo a passo para subir a pontuação.',
    tag: 'Crédito',
    tagColor: 'bg-purple-100 text-purple-700',
    readingTime: '7 min',
  },
  {
    href: '/guias/como-investir-do-zero',
    title: 'Como começar a investir do zero',
    desc: 'Do primeiro real investido ao portfólio diversificado — sem precisar entender de tudo antes de começar.',
    tag: 'Investimentos',
    tagColor: 'bg-green-100 text-green-700',
    readingTime: '10 min',
  },
  {
    href: '/guias/previdencia-privada',
    title: 'Previdência privada vale a pena? PGBL ou VGBL',
    desc: 'Quando a previdência privada é boa, quando é cilada, quais taxas evitar e as alternativas que o banco não te conta.',
    tag: 'Previdência',
    tagColor: 'bg-orange-100 text-orange-700',
    readingTime: '11 min',
  },
  {
    href: '/guias/imposto-de-renda',
    title: 'Como declarar o Imposto de Renda 2025',
    desc: 'Documentos, como lançar cada investimento, deduções que você pode usar e como evitar a malha fina.',
    tag: 'Impostos',
    tagColor: 'bg-yellow-100 text-yellow-700',
    readingTime: '13 min',
  },
]

export default function GuiasPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <nav className="text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-green-700">Início</Link>
        {' › '}
        <span className="text-gray-600">Guias</span>
      </nav>

      <div className="mb-10">
        <p className="text-xs font-bold text-green-700 uppercase tracking-widest mb-2">Educação Financeira</p>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Guias Financeiros Completos</h1>
        <p className="text-gray-500 text-lg leading-relaxed max-w-xl">
          Sem enrolação. Cada guia responde uma pergunta que as pessoas têm de verdade — e vai até o fim.
        </p>
      </div>

      <div className="space-y-5 mb-12">
        {guias.map(guia => (
          <Link key={guia.href} href={guia.href} className="block group">
            <div className="border border-gray-200 rounded-2xl p-6 bg-white hover:shadow-md hover:border-green-300 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${guia.tagColor}`}>{guia.tag}</span>
                <span className="text-xs text-gray-400">{guia.readingTime} de leitura</span>
              </div>
              <h2 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-green-700 transition-colors">{guia.title}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{guia.desc}</p>
              <p className="text-sm font-semibold text-green-700 mt-3">Ler guia completo →</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center">
        <p className="font-bold text-gray-900 mb-1">Precisa de uma ferramenta?</p>
        <p className="text-sm text-gray-500 mb-3">Calculadoras gratuitas para colocar os guias em prática.</p>
        <Link href="/ferramentas" className="text-sm text-green-700 font-semibold hover:underline">Ver calculadoras →</Link>
      </div>
    </div>
  )
}
