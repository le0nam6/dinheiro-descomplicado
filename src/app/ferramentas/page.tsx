import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Ferramentas Financeiras Gratuitas — Calculadoras e Simuladores',
  description: 'Calculadoras e simuladores financeiros gratuitos: investimentos com juros compostos, empréstimo consignado, quitar dívidas e mais. Sem cadastro, sem custo.',
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Quanto rende R$1.000 investido por mês durante 10 anos?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Investindo R$1.000 por mês com rentabilidade de 1% ao mês (equivalente a cerca de 12,7% ao ano), em 10 anos você acumula aproximadamente R$230.000. Use a calculadora de investimentos para simular com a sua taxa e prazo exatos.',
      },
    },
    {
      '@type': 'Question',
      name: 'Qual a parcela de um empréstimo consignado de R$10.000?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Depende da taxa de juros e do prazo. Um consignado de R$10.000 em 48 meses com taxa de 1,6% ao mês resulta em parcelas de aproximadamente R$295. Use a calculadora de consignado para simular com os valores exatos do seu contrato.',
      },
    },
    {
      '@type': 'Question',
      name: 'Qual a melhor estratégia para quitar dívidas — avalanche ou bola de neve?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A estratégia avalanche (pagar a dívida com maior juros primeiro) economiza mais dinheiro no total. A bola de neve (pagar a menor dívida primeiro) dá mais sensação de progresso e pode ajudar quem precisa de motivação. Use o simulador de dívidas para comparar as duas no seu caso.',
      },
    },
  ],
}

const tools = [
  {
    href: '/ferramentas/calculadora-consignado',
    emoji: '💳',
    title: 'Calculadora de Consignado',
    desc: 'Simule o valor da parcela, o total pago e os juros do empréstimo consignado.',
    tags: ['Empréstimo', 'Popular'],
    color: 'bg-blue-50 border-blue-200',
    tagColor: 'bg-blue-100 text-blue-700',
  },
  {
    href: '/ferramentas/calculadora-juros',
    emoji: '📈',
    title: 'Calculadora de Investimentos',
    desc: 'Veja quanto rende qualquer investimento com aportes mensais e compare produtos financeiros.',
    tags: ['Investimentos', 'Popular'],
    color: 'bg-green-50 border-green-200',
    tagColor: 'bg-green-100 text-green-700',
  },
  {
    href: '/ferramentas/simulador-dividas',
    emoji: '🔴',
    title: 'Simulador de Quitar Dívidas',
    desc: 'Compare estratégias (avalanche vs bola de neve) e veja qual elimina suas dívidas mais rápido.',
    tags: ['Dívidas'],
    color: 'bg-red-50 border-red-200',
    tagColor: 'bg-red-100 text-red-700',
  },
  {
    href: '/ferramentas/simulador-ir',
    emoji: '📋',
    title: 'Simulador de IR em Investimentos',
    desc: 'Calcule o imposto de renda sobre seus rendimentos de renda fixa e descubra o líquido real.',
    tags: ['Impostos'],
    color: 'bg-amber-50 border-amber-200',
    tagColor: 'bg-amber-100 text-amber-700',
    comingSoon: true,
  },
]

const glossarioLinks = [
  { slug: 'juros-compostos', name: 'Juros compostos' },
  { slug: 'renda-fixa', name: 'Renda fixa' },
  { slug: 'tesouro-direto', name: 'Tesouro Direto' },
  { slug: 'cdi', name: 'CDI' },
  { slug: 'rentabilidade-liquida', name: 'Rentabilidade líquida' },
  { slug: 'liquidez', name: 'Liquidez' },
  { slug: 'iof', name: 'IOF' },
  { slug: 'score-de-credito', name: 'Score de crédito' },
]

const guiasLinks = [
  { href: '/guias/fundo-de-emergencia', name: 'Como montar seu fundo de emergência' },
  { href: '/guias/score-de-credito', name: 'Como aumentar o score de crédito' },
  { href: '/guias/como-investir-do-zero', name: 'Como começar a investir do zero' },
]

export default function FerramentasPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-4xl mb-3">🧰</p>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Ferramentas Financeiras Gratuitas</h1>
          <p className="text-gray-500 max-w-xl mx-auto">
            Simule, calcule e tome decisões financeiras com dados reais. Sem cadastro, sem custo.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5 mb-12">
          {tools.map(tool => {
            const cs = (tool as { comingSoon?: boolean }).comingSoon
            const card = (
              <div className={`group border rounded-2xl p-6 transition-all ${tool.color} ${cs ? 'opacity-60' : 'hover:shadow-md'}`}>
                <div className="text-3xl mb-3">{tool.emoji}</div>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {tool.tags.map(tag => (
                    <span key={tag} className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tool.tagColor}`}>{tag}</span>
                  ))}
                  {cs && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Em breve</span>}
                </div>
                <h2 className={`font-bold text-gray-900 text-base mb-1 transition-colors ${!cs && 'group-hover:text-green-700'}`}>{tool.title}</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{tool.desc}</p>
                {!cs && <p className="text-sm font-semibold text-green-700 mt-3">Acessar grátis →</p>}
              </div>
            )
            return cs ? <div key={tool.href}>{card}</div> : <Link key={tool.href} href={tool.href}>{card}</Link>
          })}
        </div>

        {/* Editorial: como usar as ferramentas */}
        <div className="mb-10 prose prose-sm prose-gray max-w-none">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Como usar as calculadoras financeiras</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            As ferramentas do Endinheirados foram criadas para responder perguntas práticas: quanto vou pagar no consignado? Em quanto tempo quito minhas dívidas? Quanto rende minha reserva de emergência? Cada calculadora usa as fórmulas corretas de{' '}
            <Link href="/glossario/juros-compostos" className="text-green-700 hover:underline">juros compostos</Link> e aplica as alíquotas reais de{' '}
            <Link href="/glossario/iof" className="text-green-700 hover:underline">IOF</Link> e Imposto de Renda onde cabem.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            Para investimentos, sempre compare a rentabilidade bruta com a{' '}
            <Link href="/glossario/rentabilidade-liquida" className="text-green-700 hover:underline">rentabilidade líquida</Link> — que já desconta impostos e taxas. Um CDB que paga 14% ao ano pode render menos do que um LCI de 11%, dependendo do prazo e da alíquota de IR.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Para dívidas, entender a diferença entre as estratégias avalanche e bola de neve pode significar meses a menos de parcelas. Use o simulador e veja a diferença no seu caso específico.
          </p>
        </div>

        {/* Perguntas frequentes */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Perguntas frequentes</h2>
          <div className="space-y-5">
            {jsonLd.mainEntity.map((faq, i) => (
              <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                <p className="font-semibold text-gray-900 mb-2 text-sm">{faq.name}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{faq.acceptedAnswer.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Links para o glossário */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Entenda os termos antes de simular</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {glossarioLinks.map(item => (
              <Link
                key={item.slug}
                href={`/glossario/${item.slug}`}
                className="text-sm text-center bg-white border border-gray-200 rounded-xl px-3 py-3 hover:border-green-400 hover:text-green-700 transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Links para guias */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Guias passo a passo</h2>
          <div className="space-y-3">
            {guiasLinks.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-5 py-4 hover:border-green-400 hover:text-green-700 transition-colors group"
              >
                <span className="text-sm font-medium">{item.name}</span>
                <span className="text-gray-400 group-hover:text-green-600 text-sm">→</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center">
          <p className="font-bold text-gray-900 mb-1">Quer sugerir uma ferramenta?</p>
          <p className="text-sm text-gray-500 mb-3">Nos conte qual calculadora faria diferença pra você.</p>
          <Link href="/contato" className="text-sm text-green-700 font-semibold hover:underline">Enviar sugestão →</Link>
        </div>
      </div>
    </>
  )
}
