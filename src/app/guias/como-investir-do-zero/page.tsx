import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Como Começar a Investir do Zero — Guia Completo 2025',
  description: 'Do primeiro real investido ao portfólio diversificado. Aprenda a investir sem precisar entender tudo antes de começar, com ordem de prioridades e exemplos práticos.',
  alternates: { canonical: 'https://endinheirados.cc/guias/como-investir-do-zero' },
}

const faqs = [
  { q: 'Com quanto dinheiro posso começar a investir?', a: 'Com R$30 já é possível comprar Tesouro Selic. ETFs na bolsa custam em torno de R$50 a R$200 por cota. O valor mínimo não é a barreira — o hábito de investir regularmente é mais importante do que o valor inicial.' },
  { q: 'Qual o melhor investimento para iniciantes?', a: 'Para a reserva de emergência: Tesouro Selic ou CDB com liquidez diária. Para começar a investir além da reserva: ETFs de índice (BOVA11, IVVB11) são a opção mais simples — diversificação automática com custo baixo, sem precisar escolher ações.' },
  { q: 'Devo quitar dívidas antes de investir?', a: 'Depende da taxa de juros. Dívidas acima de 1% ao mês (cartão rotativo, cheque especial) devem ser quitadas antes. Financiamento imobiliário com taxa de 8% ao ano pode conviver com investimentos, pois a renda fixa rende mais que isso atualmente.' },
  { q: 'Precisa de muito conhecimento para investir?', a: 'Não. Para começar, você precisa entender: o que é renda fixa vs. renda variável, o conceito de diversificação e o prazo do seu objetivo. ETFs e Tesouro Direto permitem começar sem selecionar ações ou entender análise fundamentalista.' },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      headline: 'Como começar a investir do zero — guia completo',
      description: 'Do primeiro real investido ao portfólio diversificado. Aprenda a investir com ordem de prioridades e exemplos práticos.',
      url: 'https://endinheirados.cc/guias/como-investir-do-zero',
      publisher: { '@type': 'Organization', name: 'Endinheirados', url: 'https://endinheirados.cc' },
      inLanguage: 'pt-BR',
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://endinheirados.cc' },
        { '@type': 'ListItem', position: 2, name: 'Guias', item: 'https://endinheirados.cc/guias' },
        { '@type': 'ListItem', position: 3, name: 'Como investir do zero', item: 'https://endinheirados.cc/guias/como-investir-do-zero' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Com quanto dinheiro posso começar a investir?',
          acceptedAnswer: { '@type': 'Answer', text: 'Com R$30 já é possível comprar Tesouro Selic. ETFs na bolsa custam em torno de R$50 a R$200 por cota. O valor mínimo não é a barreira — o hábito de investir regularmente é mais importante do que o valor inicial.' },
        },
        {
          '@type': 'Question',
          name: 'Qual o melhor investimento para iniciantes?',
          acceptedAnswer: { '@type': 'Answer', text: 'Para a reserva de emergência: Tesouro Selic ou CDB com liquidez diária. Para começar a investir além da reserva: ETFs de índice (BOVA11, IVVB11) são a opção mais simples — diversificação automática com custo baixo, sem precisar escolher ações.' },
        },
        {
          '@type': 'Question',
          name: 'Devo quitar dívidas antes de investir?',
          acceptedAnswer: { '@type': 'Answer', text: 'Depende da taxa de juros. Dívidas acima de 1% ao mês (cartão rotativo, cheque especial) devem ser quitadas antes. Financiamento imobiliário com taxa de 8% ao ano pode conviver com investimentos, pois a renda fixa rende mais que isso atualmente.' },
        },
        {
          '@type': 'Question',
          name: 'Precisa de muito conhecimento para investir?',
          acceptedAnswer: { '@type': 'Answer', text: 'Não. Para começar, você precisa entender: o que é renda fixa vs. renda variável, o conceito de diversificação e o prazo do seu objetivo. ETFs e Tesouro Direto permitem começar sem selecionar ações ou entender análise fundamentalista.' },
        },
      ],
    },
  ],
}

export default function ComoInvestirDoZeroGuia() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-2xl mx-auto">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-green-700">Início</Link>
          {' › '}
          <Link href="/guias" className="hover:text-green-700">Guias</Link>
          {' › '}
          <span className="text-gray-600">Como investir do zero</span>
        </nav>

        {/* Cabeçalho */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Investimentos</span>
            <span className="text-xs text-gray-400">10 min de leitura</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-4 leading-tight">
            Como começar a investir do zero — sem precisar entender tudo primeiro
          </h1>
          <p className="text-xl text-gray-500 leading-relaxed">
            Do primeiro real à carteira diversificada — com ordem de prioridades clara e sem jargão desnecessário.
          </p>
        </div>

        {/* Índice */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-8">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Neste guia</p>
          <ol className="space-y-1 text-sm text-gray-700">
            <li><a href="#antes" className="hover:text-green-700">1. O que fazer antes de investir</a></li>
            <li><a href="#primeiros-passos" className="hover:text-green-700">2. Os primeiros investimentos</a></li>
            <li><a href="#alem-da-reserva" className="hover:text-green-700">3. Além da reserva de emergência</a></li>
            <li><a href="#carteira" className="hover:text-green-700">4. Como montar uma carteira simples</a></li>
            <li><a href="#faq" className="hover:text-green-700">5. Perguntas frequentes</a></li>
          </ol>
        </div>

        {/* Conteúdo */}
        <div className="space-y-8 mb-10 text-[17px] text-gray-700 leading-relaxed">

          <section id="antes">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">O que fazer antes de investir</h2>
            <p className="mb-4">
              Existe uma ordem certa para organizar as finanças. Pular etapas não acelera o processo — costuma criar problemas maiores depois.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex gap-3 items-start">
                <span className="text-green-600 font-bold mt-0.5">1.</span>
                <div>
                  <p className="font-semibold text-gray-900">Quite dívidas caras</p>
                  <p className="text-sm text-gray-600">Cartão de crédito rotativo (até 400% ao ano), cheque especial (até 150% ao ano) e outras dívidas acima de 12% ao ano. Não existe investimento que supere consistentemente esses juros.</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <span className="text-green-600 font-bold mt-0.5">2.</span>
                <div>
                  <p className="font-semibold text-gray-900">Monte o fundo de emergência</p>
                  <p className="text-sm text-gray-600">Sem reserva, qualquer imprevisto desfaz o que você construiu. Veja o <Link href="/guias/fundo-de-emergencia" className="text-green-700 hover:underline">guia completo de fundo de emergência</Link>.</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <span className="text-green-600 font-bold mt-0.5">3.</span>
                <div>
                  <p className="font-semibold text-gray-900">Agora sim: comece a investir</p>
                  <p className="text-sm text-gray-600">Com dívidas caras quitadas e reserva montada, o dinheiro investido pode trabalhar sem ser interrompido por imprevistos ou juros altos.</p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-amber-800 mb-1">E as dívidas baratas?</p>
              <p className="text-sm text-amber-700">
                Financiamento imobiliário com taxa de IPCA + 6% ao ano (em torno de 12% ao ano total) pode conviver com investimentos que rendam mais. Crédito consignado a 1,5% ao mês (cerca de 20% ao ano) já deve ser quitado primeiro — a renda fixa não paga mais que isso hoje.
              </p>
            </div>
          </section>

          <section id="primeiros-passos">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Os primeiros investimentos</h2>
            <p className="mb-4">
              A reserva de emergência é, tecnicamente, seu primeiro investimento. Ela já deve estar em um produto financeiro — não na conta corrente parada.
            </p>

            <div className="space-y-4 mb-6">
              <div className="border border-green-200 bg-green-50 rounded-xl p-4">
                <p className="font-semibold text-gray-900 mb-1">Tesouro Selic</p>
                <p className="text-sm text-gray-600 mb-2">O investimento mais seguro do Brasil (garantia do governo federal). Rende 100% da Selic. Mínimo de ~R$30. Disponível no Tesouro Direto via qualquer corretora.</p>
                <p className="text-xs text-green-700 font-semibold">Ideal para: reserva de emergência, objetivos de curto prazo</p>
              </div>
              <div className="border border-gray-200 bg-white rounded-xl p-4">
                <p className="font-semibold text-gray-900 mb-1">CDB de banco grande com liquidez diária</p>
                <p className="text-sm text-gray-600 mb-2">Cobertura do FGC até R$250k. Rende entre 90% e 100% do CDI. Resgate no mesmo dia. Opção prática para quem já tem conta no banco.</p>
                <p className="text-xs text-gray-500 font-semibold">Ideal para: reserva de emergência</p>
              </div>
              <div className="border border-gray-200 bg-white rounded-xl p-4">
                <p className="font-semibold text-gray-900 mb-1">LCI e LCA</p>
                <p className="text-sm text-gray-600 mb-2">Isentos de IR para pessoa física — o rendimento nominal pode parecer menor, mas o líquido costuma superar o CDB. Geralmente têm carência mínima de 90 dias.</p>
                <p className="text-xs text-gray-500 font-semibold">Ideal para: objetivos de médio prazo (6 meses a 2 anos)</p>
              </div>
            </div>

            <p>
              Quer entender melhor essas opções? Veja os termos do glossário:{' '}
              <Link href="/glossario/renda-fixa" className="text-green-700 hover:underline">renda fixa</Link>,{' '}
              <Link href="/glossario/tesouro-direto" className="text-green-700 hover:underline">Tesouro Direto</Link>,{' '}
              <Link href="/glossario/lci-lca" className="text-green-700 hover:underline">LCI e LCA</Link> e{' '}
              <Link href="/glossario/cdi" className="text-green-700 hover:underline">CDI</Link>.
            </p>
          </section>

          <section id="alem-da-reserva">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Além da reserva de emergência</h2>
            <p className="mb-4">
              Com a reserva completa, o próximo passo depende do prazo do seu objetivo e da sua tolerância a oscilações. A regra geral: quanto mais longo o objetivo e maior a tolerância ao risco, mais{' '}
              <Link href="/glossario/renda-variavel" className="text-green-700 hover:underline">renda variável</Link> faz sentido.
            </p>

            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 pr-4 text-gray-500 font-semibold">Prazo</th>
                    <th className="text-left py-2 pr-4 text-gray-500 font-semibold">Objetivo</th>
                    <th className="text-left py-2 text-gray-500 font-semibold">Onde investir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-3 pr-4 text-gray-700">Até 1 ano</td>
                    <td className="py-3 pr-4 text-gray-700">Viagem, eletrônico, reforma</td>
                    <td className="py-3 text-gray-700">Tesouro Selic, CDB com liquidez</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 text-gray-700">1 a 3 anos</td>
                    <td className="py-3 pr-4 text-gray-700">Carro, entrada do imóvel</td>
                    <td className="py-3 text-gray-700">CDB, LCI, LCA, Tesouro Prefixado</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 text-gray-700">Acima de 5 anos</td>
                    <td className="py-3 pr-4 text-gray-700">Aposentadoria, imóvel, riqueza</td>
                    <td className="py-3 text-gray-700">ETFs, ações, FIIs, Tesouro IPCA+</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p>
              Para objetivos de longo prazo, a <Link href="/glossario/diversificacao" className="text-green-700 hover:underline">diversificação</Link> é a principal ferramenta de controle de risco. Não coloque todo o dinheiro em uma única ação ou setor.
            </p>
          </section>

          <section id="carteira">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Como montar uma carteira simples</h2>
            <p className="mb-4">
              Para um iniciante, uma carteira simples e eficiente pode ter apenas 3 produtos. O importante é começar — a carteira pode ser ajustada com o tempo.
            </p>

            <div className="space-y-3 mb-6">
              <div className="border border-gray-200 rounded-xl p-4 bg-white">
                <div className="flex justify-between items-center mb-1">
                  <p className="font-semibold text-gray-900">Tesouro Selic</p>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">20-30%</span>
                </div>
                <p className="text-sm text-gray-600">A reserva de emergência. Sempre disponível, sempre rendendo.</p>
              </div>
              <div className="border border-gray-200 rounded-xl p-4 bg-white">
                <div className="flex justify-between items-center mb-1">
                  <p className="font-semibold text-gray-900">Tesouro IPCA+ ou LCI/LCA longo</p>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">30-40%</span>
                </div>
                <p className="text-sm text-gray-600">Proteção da inflação e rentabilidade real garantida para objetivos de médio e longo prazo.</p>
              </div>
              <div className="border border-gray-200 rounded-xl p-4 bg-white">
                <div className="flex justify-between items-center mb-1">
                  <p className="font-semibold text-gray-900"><Link href="/glossario/etf" className="text-green-700 hover:underline">ETF</Link> de índice (BOVA11 ou IVVB11)</p>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">20-40%</span>
                </div>
                <p className="text-sm text-gray-600">Exposição à renda variável com diversificação automática. BOVA11 replica o Ibovespa; IVVB11 replica o S&P 500 em reais.</p>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-green-800 mb-1">O erro mais comum</p>
              <p className="text-sm text-green-700">
                Esperar o "momento certo" para começar. O melhor momento para investir era há 10 anos. O segundo melhor é agora. O impacto dos <Link href="/glossario/juros-compostos" className="text-green-700 hover:underline font-semibold">juros compostos</Link> ao longo do tempo é muito maior do que a diferença de rentabilidade entre produtos.
              </p>
            </div>
          </section>
        </div>

        {/* FAQ */}
        <section id="faq" className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-5">Perguntas frequentes</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-5 bg-white">
                <p className="font-semibold text-gray-900 mb-2">{faq.q}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Ferramentas */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Simule antes de investir</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link href="/ferramentas/calculadora-juros" className="block border border-gray-200 rounded-xl p-4 hover:border-green-300 transition-colors group">
              <p className="text-sm font-semibold text-gray-900 group-hover:text-green-700">Calculadora de investimentos →</p>
              <p className="text-xs text-gray-500 mt-0.5">Veja quanto cresce seu dinheiro com aportes mensais</p>
            </Link>
            <Link href="/guias/fundo-de-emergencia" className="block border border-gray-200 rounded-xl p-4 hover:border-green-300 transition-colors group">
              <p className="text-sm font-semibold text-gray-900 group-hover:text-green-700">Guia: Fundo de emergência →</p>
              <p className="text-xs text-gray-500 mt-0.5">O primeiro passo antes de investir</p>
            </Link>
            <Link href="/glossario/diversificacao" className="block border border-gray-200 rounded-xl p-4 hover:border-green-300 transition-colors group">
              <p className="text-sm font-semibold text-gray-900 group-hover:text-green-700">Glossário: Diversificação →</p>
              <p className="text-xs text-gray-500 mt-0.5">Por que não concentrar em um só ativo</p>
            </Link>
            <Link href="/glossario/rentabilidade-liquida" className="block border border-gray-200 rounded-xl p-4 hover:border-green-300 transition-colors group">
              <p className="text-sm font-semibold text-gray-900 group-hover:text-green-700">Glossário: Rentabilidade líquida →</p>
              <p className="text-xs text-gray-500 mt-0.5">Como calcular o que você realmente recebe</p>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
