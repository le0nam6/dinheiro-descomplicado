import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Como Aumentar o Score de Crédito — Guia Completo 2025',
  description: 'O que realmente mexe com o score, o que é mito e o passo a passo para subir a pontuação no Serasa e SPC. Resultados em 30 a 90 dias.',
  alternates: { canonical: 'https://endinheirados.cc/guias/score-de-credito' },
}

const faqs = [
  { q: 'Quanto tempo leva para o score subir?', a: 'Depende da ação. Pagar dívidas negativadas limpa o nome em até 5 dias úteis após o pagamento — e o score costuma subir em 30 dias. Comportamento positivo contínuo (pagar contas em dia, usar crédito com moderação) leva de 3 a 6 meses para impacto significativo.' },
  { q: 'Consultar o próprio score derruba a pontuação?', a: 'Não. Consultar o próprio CPF no Serasa ou Boa Vista é considerada "consulta soft" e não afeta o score. O que pode impactar negativamente são consultas de terceiros (bancos ou lojas pedindo análise de crédito) em excesso e em curto prazo.' },
  { q: 'Ter muitos cartões de crédito prejudica o score?', a: 'Não necessariamente. O problema não é a quantidade de cartões, mas o uso excessivo do limite disponível. Usar menos de 30% do limite total disponível é considerado positivo. Solicitar muitos cartões em pouco tempo, porém, gera múltiplas consultas que podem prejudicar temporariamente.' },
  { q: 'O Cadastro Positivo ajuda o score?', a: 'Sim, especialmente para quem tem histórico de crédito limitado. O Cadastro Positivo registra todos os pagamentos em dia — não só as dívidas. Para ativá-lo, acesse o Serasa ou Boa Vista. Ele é automático desde 2019 para quem tem CPF ativo.' },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      headline: 'Como aumentar o score de crédito — guia completo',
      description: 'O que realmente mexe com o score, o que é mito e o passo a passo para subir a pontuação.',
      url: 'https://endinheirados.cc/guias/score-de-credito',
      publisher: { '@type': 'Organization', name: 'Endinheirados', url: 'https://endinheirados.cc' },
      inLanguage: 'pt-BR',
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://endinheirados.cc' },
        { '@type': 'ListItem', position: 2, name: 'Guias', item: 'https://endinheirados.cc/guias' },
        { '@type': 'ListItem', position: 3, name: 'Score de crédito', item: 'https://endinheirados.cc/guias/score-de-credito' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Quanto tempo leva para o score subir?',
          acceptedAnswer: { '@type': 'Answer', text: 'Depende da ação. Pagar dívidas negativadas limpa o nome em até 5 dias úteis após o pagamento — e o score costuma subir em 30 dias. Comportamento positivo contínuo (pagar contas em dia, usar crédito com moderação) leva de 3 a 6 meses para impacto significativo.' },
        },
        {
          '@type': 'Question',
          name: 'Consultar o próprio score derruba a pontuação?',
          acceptedAnswer: { '@type': 'Answer', text: 'Não. Consultar o próprio CPF no Serasa ou Boa Vista é considerada "consulta soft" e não afeta o score. O que pode impactar negativamente são consultas de terceiros (bancos ou lojas pedindo análise de crédito) em excesso e em curto prazo.' },
        },
        {
          '@type': 'Question',
          name: 'Ter muitos cartões de crédito prejudica o score?',
          acceptedAnswer: { '@type': 'Answer', text: 'Não necessariamente. O problema não é a quantidade de cartões, mas o uso excessivo do limite disponível. Usar menos de 30% do limite total disponível é considerado positivo. Solicitar muitos cartões em pouco tempo, porém, gera múltiplas consultas que podem prejudicar temporariamente.' },
        },
        {
          '@type': 'Question',
          name: 'O Cadastro Positivo ajuda o score?',
          acceptedAnswer: { '@type': 'Answer', text: 'Sim, especialmente para quem tem histórico de crédito limitado. O Cadastro Positivo registra todos os pagamentos em dia — não só as dívidas. Para ativá-lo, acesse o Serasa ou Boa Vista. Ele é automático desde 2019 para quem tem CPF ativo.' },
        },
      ],
    },
  ],
}

export default function ScoreDeCreditoGuia() {
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
          <span className="text-gray-600">Score de crédito</span>
        </nav>

        {/* Cabeçalho */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">Crédito</span>
            <span className="text-xs text-gray-400">7 min de leitura</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-4 leading-tight">
            Como aumentar o score de crédito — o que funciona de verdade
          </h1>
          <p className="text-xl text-gray-500 leading-relaxed">
            O que realmente mexe com a pontuação, o que é mito e o passo a passo para subir o score — com resultados em 30 a 90 dias.
          </p>
        </div>

        {/* Índice */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-8">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Neste guia</p>
          <ol className="space-y-1 text-sm text-gray-700">
            <li><a href="#como-funciona" className="hover:text-green-700">1. Como o score é calculado</a></li>
            <li><a href="#o-que-mexe" className="hover:text-green-700">2. O que realmente mexe com a pontuação</a></li>
            <li><a href="#mitos" className="hover:text-green-700">3. Mitos sobre score</a></li>
            <li><a href="#passo-a-passo" className="hover:text-green-700">4. Passo a passo para subir o score</a></li>
            <li><a href="#faq" className="hover:text-green-700">5. Perguntas frequentes</a></li>
          </ol>
        </div>

        {/* Conteúdo */}
        <div className="space-y-8 mb-10 text-[17px] text-gray-700 leading-relaxed">

          <section id="como-funciona">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Como o score é calculado</h2>
            <p className="mb-4">
              O score (ou <Link href="/glossario/score-de-credito" className="text-green-700 hover:underline">score de crédito</Link>) é uma pontuação de 0 a 1000 que estima a probabilidade de você pagar suas dívidas em dia nos próximos 12 meses. Quanto maior, melhor — e mais fácil fica conseguir crédito com boas condições.
            </p>
            <p className="mb-4">
              O principal bureau no Brasil é o Serasa (Serasa Score). O Boa Vista (antigo SPC) tem o seu próprio. Cada banco também tem um score interno, não público. Quando você pede um empréstimo ou financiamento, a instituição consulta esses dados para decidir se aprova e a que taxa de juros.
            </p>
            <p>
              Os principais fatores considerados no cálculo, segundo o próprio Serasa, são: histórico de pagamentos (o mais importante), dívidas em aberto, tempo de relacionamento com o mercado de crédito, uso do crédito disponível e variedade de produtos de crédito usados.
            </p>
          </section>

          <section id="o-que-mexe">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">O que realmente mexe com a pontuação</h2>

            <div className="space-y-4 mb-6">
              <div className="border-l-4 border-green-500 pl-4">
                <p className="font-semibold text-gray-900 mb-1">Pagar contas no prazo</p>
                <p className="text-sm text-gray-600">É o fator de maior peso. Água, luz, telefone, cartão, aluguel — qualquer conta paga dentro do prazo contribui positivamente. A melhora não é imediata, mas é consistente.</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <p className="font-semibold text-gray-900 mb-1">Quitar dívidas negativadas</p>
                <p className="text-sm text-gray-600">Se seu nome está negativado, quitar a dívida retira a restrição em até 5 dias úteis. O impacto no score é imediato e significativo.</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <p className="font-semibold text-gray-900 mb-1">Ativar o Cadastro Positivo</p>
                <p className="text-sm text-gray-600">O Cadastro Positivo registra todos os pagamentos em dia — não só inadimplências. Para quem tem histórico curto ou limitado, ativá-lo acelera a construção do score.</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <p className="font-semibold text-gray-900 mb-1">Usar o crédito com moderação</p>
                <p className="text-sm text-gray-600">Usar menos de 30% do limite do cartão de crédito é considerado saudável. Usar 80% ou mais — mesmo pagando em dia — indica dependência de crédito e pode puxar o score para baixo.</p>
              </div>
              <div className="border-l-4 border-red-400 pl-4">
                <p className="font-semibold text-gray-900 mb-1">Pedir crédito em excesso em curto prazo</p>
                <p className="text-sm text-gray-600">Cada pedido de empréstimo ou financiamento gera uma consulta no CPF. Muitas consultas em pouco tempo sinalizam que você está precisando urgente de dinheiro — o que reduz o score temporariamente.</p>
              </div>
            </div>
          </section>

          <section id="mitos">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Mitos sobre score que você provavelmente já ouviu</h2>
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="font-semibold text-red-800 mb-1">❌ &quot;Cancelar cartão aumenta o score&quot;</p>
                <p className="text-sm text-red-700">Errado. Cancelar um cartão reduz o limite total disponível, o que pode aumentar proporcionalmente o uso do crédito — e isso pode baixar o score.</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="font-semibold text-red-800 mb-1">❌ &quot;Pagar a fatura parcelada aumenta o score&quot;</p>
                <p className="text-sm text-red-700">O que importa é pagar no prazo, não quitar antes. Pagar o mínimo do cartão em dia é melhor para o score do que atrasar o pagamento total.</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="font-semibold text-red-800 mb-1">❌ &quot;Guardar dinheiro na poupança do banco sobe o score&quot;</p>
                <p className="text-sm text-red-700">Saldo em poupança ou investimentos não é considerado no cálculo do score. O score mede comportamento de crédito, não patrimônio.</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="font-semibold text-red-800 mb-1">❌ &quot;Consultar o próprio CPF derruba o score&quot;</p>
                <p className="text-sm text-red-700">Não. Você pode consultar seu próprio CPF quantas vezes quiser sem impacto. O que pode prejudicar são consultas de terceiros (bancos, lojas) em excesso.</p>
              </div>
            </div>
          </section>

          <section id="passo-a-passo">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Passo a passo para subir o score</h2>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Consulte sua situação agora</p>
                  <p className="text-sm text-gray-600">Acesse serasa.com.br ou boavista.com.br e veja seu score atual e se há dívidas negativadas. A consulta é gratuita.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Quite ou negocie dívidas negativadas (se houver)</p>
                  <p className="text-sm text-gray-600">Use o Serasa Limpa Nome ou Acordo Certo para negociar com descontos de até 90%. Pague o que conseguir — qualquer quitação ajuda o score.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Ative o Cadastro Positivo</p>
                  <p className="text-sm text-gray-600">No app do Serasa, vá em Cadastro Positivo e confirme a ativação. Ele já deve estar ativo automaticamente, mas verifique.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Coloque contas no seu CPF</p>
                  <p className="text-sm text-gray-600">Água, luz, internet, celular — se você paga mas não está no seu nome, peça para transferir. Cada conta paga em dia registrada no seu CPF ajuda o Cadastro Positivo.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">5</div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Use o cartão de crédito com consciência</p>
                  <p className="text-sm text-gray-600">Se tiver cartão, use-o regularmente mas sem estourar o limite. Pague a fatura inteira no vencimento. Isso constrói histórico positivo de forma consistente.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">6</div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Aguarde e monitore</p>
                  <p className="text-sm text-gray-600">O score não sobe do dia para a noite. Comportamento consistente por 3 a 6 meses costuma refletir em aumento visível. Consulte mensalmente para acompanhar.</p>
                </div>
              </div>
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

        {/* Links relacionados */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Continue aprendendo</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link href="/glossario/score-de-credito" className="block border border-gray-200 rounded-xl p-4 hover:border-green-300 transition-colors group">
              <p className="text-sm font-semibold text-gray-900 group-hover:text-green-700">Glossário: Score de crédito →</p>
              <p className="text-xs text-gray-500 mt-0.5">Definição completa e como é calculado</p>
            </Link>
            <Link href="/glossario/nome-negativado" className="block border border-gray-200 rounded-xl p-4 hover:border-green-300 transition-colors group">
              <p className="text-sm font-semibold text-gray-900 group-hover:text-green-700">Glossário: Nome negativado →</p>
              <p className="text-xs text-gray-500 mt-0.5">Como limpar o nome e prazos</p>
            </Link>
            <Link href="/guias/fundo-de-emergencia" className="block border border-gray-200 rounded-xl p-4 hover:border-green-300 transition-colors group">
              <p className="text-sm font-semibold text-gray-900 group-hover:text-green-700">Guia: Fundo de emergência →</p>
              <p className="text-xs text-gray-500 mt-0.5">A base para não depender de crédito</p>
            </Link>
            <Link href="/guias/como-investir-do-zero" className="block border border-gray-200 rounded-xl p-4 hover:border-green-300 transition-colors group">
              <p className="text-sm font-semibold text-gray-900 group-hover:text-green-700">Guia: Como investir do zero →</p>
              <p className="text-xs text-gray-500 mt-0.5">Próximo passo depois de organizar o crédito</p>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
