import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Como Sair das Dívidas em 2025 — Guia Passo a Passo',
  description: 'Guia completo para sair das dívidas: como fazer um diagnóstico, qual método usar (bola de neve ou avalanche), como negociar com bancos e como não voltar a se endividar.',
  alternates: { canonical: 'https://portalendinheirados.com.br/guias/como-sair-das-dividas' },
}

const SITE = 'https://portalendinheirados.com.br'

const faqs = [
  { q: 'Por onde começar para sair das dívidas?', a: 'Comece com um diagnóstico completo: liste todas as dívidas com saldo, taxa de juros e parcela mínima. Depois some a renda e os gastos essenciais. O que sobra é sua margem de ataque às dívidas. Sem esse mapa, qualquer estratégia fica no chuto.' },
  { q: 'Vale a pena pegar empréstimo para pagar dívidas?', a: 'Só se a taxa do novo empréstimo for significativamente menor. Substituir cartão rotativo (300% ao ano) por crédito consignado (20-25% ao ano) ou home equity faz sentido. Mas pegar empréstimo pessoal a 50% ao ano para pagar uma dívida de 40% ao ano não tem lógica.' },
  { q: 'Qual a diferença entre bola de neve e avalanche?', a: 'Bola de neve: pague primeiro a menor dívida, independente da taxa. Gera motivação com vitórias rápidas. Avalanche: pague primeiro a dívida com a maior taxa de juros. Matematicamente mais eficiente — você paga menos juros no total. Pesquisas mostram que a bola de neve funciona melhor na prática porque a motivação importa.' },
  { q: 'O que fazer se não tenho dinheiro para pagar nem o mínimo?', a: 'Ligue para os credores antes de atrasar. Bancos e operadoras preferem negociar do que ter inadimplência. Explique sua situação e peça pausas temporárias, redução de parcela ou prazo maior. Muitos oferecem isso sem divulgar abertamente. O Serasa Limpa Nome e Acordo Certo também têm ofertas de desconto em dívidas já atrasadas.' },
  { q: 'Dívida antiga prescrita ainda existe?', a: 'Juridicamente, dívidas prescrevem em 5 anos do vencimento — após isso, o credor não pode mais negativar seu nome ou cobrar judicialmente. Mas a dívida ainda existe: o credor pode tentar cobrar, e você pode pagar se quiser. Muitas plataformas de negociação oferecem descontos enormes em dívidas prescritas.' },
  { q: 'Como evitar voltar a se endividar depois de quitar tudo?', a: 'A raiz do endividamento é quase sempre o fundo de emergência ausente e o cartão usado como extensão da renda. Imediatamente após quitar as dívidas, construa reserva de 3-6 meses de gastos e estabeleça um limite para o cartão baseado no que você paga, não no que o banco oferece.' },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      headline: 'Como Sair das Dívidas em 2025 — Guia Passo a Passo',
      description: 'Guia completo para sair das dívidas: diagnóstico, métodos bola de neve e avalanche, negociação com bancos e como não voltar a se endividar.',
      url: `${SITE}/guias/como-sair-das-dividas`,
      author: { '@type': 'Organization', name: 'Endinheirados', url: SITE },
      publisher: { '@type': 'Organization', name: 'Endinheirados', url: SITE },
      inLanguage: 'pt-BR',
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Início', item: SITE },
        { '@type': 'ListItem', position: 2, name: 'Guias', item: `${SITE}/guias` },
        { '@type': 'ListItem', position: 3, name: 'Como Sair das Dívidas', item: `${SITE}/guias/como-sair-das-dividas` },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: faqs.map(f => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ],
}

export default function GuiaComoSairDasDividas() {
  return (
    <div className="max-w-2xl mx-auto">
      <nav className="text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-green-700">Início</Link>
        {' › '}
        <Link href="/guias" className="hover:text-green-700">Guias</Link>
        {' › '}
        <span className="text-gray-600">Como sair das dívidas</span>
      </nav>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Dívidas</span>
          <span className="text-xs text-gray-400">12 min de leitura</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-3 leading-tight">
          Como sair das dívidas: o guia completo para 2025
        </h1>
        <p className="text-xl text-gray-500 leading-relaxed">
          Da lista de dívidas ao plano de ataque — passo a passo para quitar tudo e não voltar a se endividar.
        </p>
      </div>

      {/* Diagnóstico */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4" id="diagnostico">
          Passo 1: faça o diagnóstico completo
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Antes de qualquer estratégia, você precisa saber exatamente com o que está lidando. Pegue papel e caneta (ou uma planilha) e liste todas as dívidas com quatro colunas: credor, saldo devedor total, taxa de juros mensal e valor da parcela mínima.
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          Muita gente sabe que tem dívidas mas não sabe o tamanho exato — e isso paralisa. O diagnóstico quebra o ciclo de evitar o problema. Frequentemente, ao ver o total, as pessoas percebem que a situação é mais gerenciável do que imaginavam.
        </p>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-4">
          <p className="font-bold text-gray-900 text-sm mb-3">Tabela de diagnóstico</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="pb-2 font-semibold">Credor</th>
                  <th className="pb-2 font-semibold">Saldo</th>
                  <th className="pb-2 font-semibold">Taxa/mês</th>
                  <th className="pb-2 font-semibold">Mínimo</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                <tr className="border-b border-gray-100">
                  <td className="py-2">Cartão Nubank</td>
                  <td>R$ 4.200</td>
                  <td className="text-red-600 font-semibold">18%</td>
                  <td>R$ 210</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2">Financiamento moto</td>
                  <td>R$ 9.500</td>
                  <td>2,1%</td>
                  <td>R$ 380</td>
                </tr>
                <tr>
                  <td className="py-2">Empréstimo pessoal</td>
                  <td>R$ 2.800</td>
                  <td className="text-orange-600 font-semibold">4,5%</td>
                  <td>R$ 180</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed">
          Depois do diagnóstico, calcule sua renda líquida e desconte os gastos essenciais (aluguel, alimentação, transporte, contas de consumo). O valor restante é sua <strong>margem de ataque</strong> — quanto você pode destinar às dívidas por mês além dos mínimos.
        </p>
      </section>

      {/* Métodos */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4" id="metodos">
          Passo 2: escolha seu método de quitação
        </h2>
        <p className="text-gray-700 leading-relaxed mb-6">
          Existem dois métodos amplamente validados. Você paga todos os mínimos todo mês e concentra a margem de ataque em uma dívida específica por vez. A diferença está em qual dívida atacar primeiro.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="border border-blue-200 bg-blue-50 rounded-2xl p-5">
            <p className="font-bold text-blue-800 mb-1">Método Bola de Neve</p>
            <p className="text-xs text-blue-600 mb-3">Dave Ramsey</p>
            <p className="text-sm text-blue-900 leading-relaxed">
              Ataque a <strong>menor dívida em saldo</strong> primeiro. Quando ela zera, redireciona tudo para a próxima menor, e assim por diante. As vitórias rápidas mantêm a motivação.
            </p>
            <p className="text-xs text-blue-700 mt-3 font-medium">Melhor para: quem precisa de motivação e vitórias rápidas para manter o ritmo.</p>
          </div>
          <div className="border border-orange-200 bg-orange-50 rounded-2xl p-5">
            <p className="font-bold text-orange-800 mb-1">Método Avalanche</p>
            <p className="text-xs text-orange-600 mb-3">Matematicamente ótimo</p>
            <p className="text-sm text-orange-900 leading-relaxed">
              Ataque a <strong>maior taxa de juros</strong> primeiro. Você paga menos juros no total e quita as dívidas em menos tempo. Mais eficiente, mas pode demorar para ver a primeira vitória.
            </p>
            <p className="text-xs text-orange-700 mt-3 font-medium">Melhor para: quem tem disciplina e quer minimizar o custo total.</p>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-green-800 leading-relaxed">
            <strong>Qual escolher?</strong> Pesquisas comportamentais (Kellogg School of Management, 2012) mostram que a bola de neve gera mais adesão ao plano no longo prazo porque a motivação é combustível essencial. Se a diferença de custo entre os métodos for pequena, priorize o que você vai conseguir manter.
          </p>
        </div>
      </section>

      {/* Cortando gastos */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4" id="cortar-gastos">
          Passo 3: aumente a margem de ataque
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Quanto maior a margem de ataque, mais rápido você sai das dívidas. Ela pode crescer de dois lados: cortando gastos e aumentando renda. Em uma situação de endividamento, ambos são necessários.
        </p>

        <div className="space-y-3 mb-5">
          <div className="flex gap-3 items-start">
            <span className="text-green-600 font-bold text-sm mt-0.5 shrink-0">→</span>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Revise assinaturas e recorrências</p>
              <p className="text-sm text-gray-600">Streaming, academia, apps premium, seguro que não usa. Cancele tudo que não é essencial durante o período de quitação. Economias de R$200-500/mês são comuns.</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="text-green-600 font-bold text-sm mt-0.5 shrink-0">→</span>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Reduza o supérfluo temporariamente</p>
              <p className="text-sm text-gray-600">Delivery, restaurantes, lazer. O corte não precisa ser permanente — só durante o período de quitação. Define um prazo e cumpre.</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="text-green-600 font-bold text-sm mt-0.5 shrink-0">→</span>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Venda o que não usa</p>
              <p className="text-sm text-gray-600">OLX, Enjoei, grupos de Facebook. Eletrônicos, roupas, móveis, bicicleta. Uma limpeza no apartamento pode gerar R$500-2.000 para dar um golpe certeiro em uma dívida.</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="text-green-600 font-bold text-sm mt-0.5 shrink-0">→</span>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Busque renda extra</p>
              <p className="text-sm text-gray-600">Freelances na área de expertise, apps de delivery, trabalho nos fins de semana, aluguel de vaga. Cada real extra vai direto para o método escolhido.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Negociação */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4" id="negociacao">
          Passo 4: negocie — especialmente no cartão
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          O cartão rotativo cobra de 200% a 400% ao ano. Nenhum método de quitação é eficiente com essa taxa — cada mês que passa aumenta o buraco. A negociação é obrigatória para o cartão.
        </p>

        <div className="space-y-4 mb-5">
          <div className="border border-gray-200 rounded-xl p-4">
            <p className="font-bold text-gray-900 text-sm mb-2">Negociação direta com o banco</p>
            <p className="text-sm text-gray-600 leading-relaxed">
              Ligue, vá ao app ou à agência e diga: "Tenho saldo no rotativo e quero quitar, mas preciso de uma condição melhor". Peça para converter em parcelamento com taxa menor. Muitos bancos oferecem de 3% a 6% ao mês versus 18-25% do rotativo.
            </p>
          </div>
          <div className="border border-gray-200 rounded-xl p-4">
            <p className="font-bold text-gray-900 text-sm mb-2">Serasa Limpa Nome e Acordo Certo</p>
            <p className="text-sm text-gray-600 leading-relaxed">
              Para dívidas já negativadas, essas plataformas intermediam a negociação com descontos que chegam a 90% do saldo original. Dívidas antigas têm os maiores descontos. O pagamento pode ser feito por PIX à vista ou parcelado.
            </p>
          </div>
          <div className="border border-gray-200 rounded-xl p-4">
            <p className="font-bold text-gray-900 text-sm mb-2">Portabilidade de crédito</p>
            <p className="text-sm text-gray-600 leading-relaxed">
              Se você tem dívida em banco que cobra juros altos, pode transferi-la para outro banco que aceite cobrar menos. O banco de destino quita a dívida original e você passa a dever para ele com a taxa menor. Vale pesquisar, especialmente para dívidas acima de R$5.000.
            </p>
          </div>
        </div>
      </section>

      {/* FGTS */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4" id="fgts">
          Passo 5: use o FGTS e o 13º estrategicamente
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          O FGTS rende apenas TR + 3% ao ano — muito menos que os juros de qualquer dívida. Usar o saldo do FGTS para quitar dívidas (quando permitido pela lei) é matematicamente óbvio: você troca um ativo rendendo 3% ao ano por uma dívida custando 20-300% ao ano.
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          O 13º salário e a restituição de IR são munições poderosas. Planeje com antecedência: ao invés de usar para consumo, destine esses recursos extra para golpear a dívida de maior taxa. Um 13º de um salário pode eliminar uma dívida inteira e cortar meses do plano.
        </p>
        <p className="text-gray-700 leading-relaxed">
          O saque-aniversário do FGTS (modalidade em que você recebe parte do saldo todo ano) pode ser outra fonte de capital para quitar dívidas — mas avalie com cuidado: essa modalidade restringe o saque integral em caso de demissão sem justa causa.
        </p>
      </section>

      {/* Depois das dívidas */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4" id="depois">
          Passo 6: blindagem para não voltar à estaca zero
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Quitar as dívidas é uma conquista enorme — mas muitas pessoas se endividam novamente em 12-24 meses. O padrão se repete porque a causa raiz não foi resolvida: ausência de reserva de emergência.
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          Imediatamente após quitar a última dívida, redirecione a margem de ataque para construir o fundo de emergência. Comece com R$1.000 (para imprevistos pequenos) e evolua para 3-6 meses de gastos. Com reserva, você não precisa do cartão quando a geladeira quebra ou o carro precisa de manutenção.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-900 font-medium">
            A regra de ouro pós-dívidas: use o cartão de crédito apenas para o que você já tem dinheiro guardado. Se não tem o dinheiro hoje, não compra no cartão.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Perguntas frequentes</h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-5 bg-white">
              <div className="flex items-start gap-2 mb-2">
                <span className="text-green-600 font-black text-base leading-tight mt-0.5 shrink-0">?</span>
                <h3 className="font-bold text-gray-900 text-base leading-snug">{faq.q}</h3>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed pl-5">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Links relacionados */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Aprofunde o conhecimento</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <Link href="/guias/score-de-credito" className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3 hover:border-green-300 hover:text-green-700 transition-colors group">
            <span className="text-sm font-medium">Como aumentar o score de crédito</span>
            <span className="text-gray-400 group-hover:text-green-600 shrink-0 ml-2">→</span>
          </Link>
          <Link href="/guias/fundo-de-emergencia" className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3 hover:border-green-300 hover:text-green-700 transition-colors group">
            <span className="text-sm font-medium">Como montar o fundo de emergência</span>
            <span className="text-gray-400 group-hover:text-green-600 shrink-0 ml-2">→</span>
          </Link>
          <Link href="/glossario/rotativo-do-cartao" className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3 hover:border-green-300 hover:text-green-700 transition-colors group">
            <span className="text-sm font-medium">O que é o rotativo do cartão</span>
            <span className="text-gray-400 group-hover:text-green-600 shrink-0 ml-2">→</span>
          </Link>
          <Link href="/glossario/renegociacao-de-dividas" className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3 hover:border-green-300 hover:text-green-700 transition-colors group">
            <span className="text-sm font-medium">Renegociação de dívidas</span>
            <span className="text-gray-400 group-hover:text-green-600 shrink-0 ml-2">→</span>
          </Link>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  )
}
