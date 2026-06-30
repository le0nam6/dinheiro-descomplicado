import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Como Economizar Dinheiro: 20 Formas que Funcionam de Verdade',
  description: 'Guia prático para economizar dinheiro no dia a dia — sem fórmulas mágicas. Do orçamento às compras, passando por contas fixas e hábitos que fazem diferença de verdade.',
  alternates: { canonical: 'https://portalendinheirados.com.br/guias/como-economizar-dinheiro' },
}

const SITE = 'https://portalendinheirados.com.br'

const faqs = [
  { q: 'Quanto devo economizar por mês?', a: 'O mínimo recomendado é 10% da renda líquida. O ideal, especialmente no começo, é 20% (regra 50/30/20: 50% necessidades, 30% desejos, 20% poupança). Mas qualquer percentual positivo é melhor que zero — comece com o que for possível e aumente gradualmente.' },
  { q: 'É melhor cortar gastos ou aumentar renda para economizar mais?', a: 'Ambos. Cortar gastos tem retorno imediato e garantido. Aumentar renda tem potencial maior no longo prazo, mas é mais incerto. A estratégia mais eficiente combina os dois: corta o que não agrega valor e investe tempo em aumentar a renda.' },
  { q: 'Qual é o melhor método para organizar o orçamento?', a: 'Depende do perfil. A regra 50/30/20 é ótima para começar — simples e não exige controle granular. Para quem quer mais controle, o método dos envelopes (virtuais ou físicos) funciona bem. Apps como Organizze, Mobills e Guiabolso automatizam o processo. O melhor método é o que você vai usar de verdade.' },
  { q: 'Devo guardar dinheiro mesmo tendo dívidas?', a: 'Depende da taxa. Se tem cartão rotativo ou cheque especial (juros acima de 150% ao ano), quite primeiro — os juros crescem mais rápido do que qualquer investimento rende. Mas construa uma reserva mínima de R$500-1.000 para imprevistos antes de atacar qualquer dívida, para não precisar recorrer ao crédito novamente.' },
  { q: 'Como economizar no supermercado?', a: 'Faça lista antes de ir e não vá com fome. Compare por quilograma ou litro, não por embalagem. Marcas próprias de supermercado são 20-40% mais baratas com qualidade equivalente em muitos itens. Compre perecíveis no que vai usar na semana. Use aplicativos de cashback. Planeje as refeições da semana para evitar desperdício.' },
  { q: 'Como parar de gastar com impulso?', a: 'A regra mais eficaz: espere 24h antes de comprar qualquer item não planejado acima de R$100. Em muitos casos, o impulso passa. Desative as notificações de apps de e-commerce e cancele e-mails de promoção. Cancele o cartão salvo em sites de compra — a fricção extra já reduz compras impulsivas.' },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      headline: 'Como Economizar Dinheiro: 20 Formas que Funcionam de Verdade',
      description: 'Guia prático para economizar dinheiro no dia a dia — orçamento, contas fixas, supermercado, hábitos e investimento do que sobra.',
      url: `${SITE}/guias/como-economizar-dinheiro`,
      author: { '@type': 'Organization', name: 'Endinheirados', url: SITE },
      publisher: { '@type': 'Organization', name: 'Endinheirados', url: SITE },
      inLanguage: 'pt-BR',
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Início', item: SITE },
        { '@type': 'ListItem', position: 2, name: 'Guias', item: `${SITE}/guias` },
        { '@type': 'ListItem', position: 3, name: 'Como Economizar Dinheiro', item: `${SITE}/guias/como-economizar-dinheiro` },
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

export default function GuiaComoEconomizarDinheiro() {
  return (
    <div className="max-w-2xl mx-auto">
      <nav className="text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-green-700">Início</Link>
        {' › '}
        <Link href="/guias" className="hover:text-green-700">Guias</Link>
        {' › '}
        <span className="text-gray-600">Como economizar dinheiro</span>
      </nav>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Organização</span>
          <span className="text-xs text-gray-400">10 min de leitura</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-3 leading-tight">
          Como economizar dinheiro: 20 formas que funcionam de verdade
        </h1>
        <p className="text-xl text-gray-500 leading-relaxed">
          Sem cortar café ou evitar abacate. Dicas reais sobre orçamento, gastos fixos, compras e hábitos que fazem diferença acumulada.
        </p>
      </div>

      {/* Por que economizar falha */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4" id="por-que-falha">
          Por que a maioria das tentativas fracassa
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Economizar falha porque a maioria das pessoas começa pelo fim: cortam gastos pequenos (o café, a água com gás, a assinatura de R$12) sem atacar os grandes. A regra de ouro das finanças pessoais diz: <strong>os gastos grandes determinam os resultados grandes</strong>. Aluguel, carro, alimentação e educação representam 60-80% da renda da maioria das famílias brasileiras.
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          O segundo erro é tentar economizar "o que sobrar". Nunca sobra. A estratégia que funciona é o inverso: <strong>pague a si mesmo primeiro</strong> — assim que o salário cai, transfere automaticamente o valor que você decidiu economizar. Aí você vive com o restante.
        </p>
      </section>

      {/* Orçamento */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4" id="orcamento">
          1. Monte o orçamento antes de cortar qualquer coisa
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Você não pode otimizar o que não mede. Passe 15 minutos acessando o extrato do cartão e da conta dos últimos 3 meses e categorize os gastos. Use 4 categorias simples: moradia, alimentação, transporte e outros.
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          A maioria das pessoas se surpreende com o quanto vai para "outros" — que inclui delivery, assinaturas, compras online, lazer e por aí vai. Esse é o campo de batalha real da economia.
        </p>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-4">
          <p className="font-bold text-gray-900 text-sm mb-3">Regra 50/30/20 — distribuição ideal da renda líquida</p>
          <div className="space-y-2">
            {[
              { label: 'Necessidades', pct: '50%', desc: 'Aluguel, alimentação, transporte, saúde, contas fixas', color: 'bg-blue-500' },
              { label: 'Desejos', pct: '30%', desc: 'Lazer, restaurantes, streaming, roupas, viagens', color: 'bg-purple-400' },
              { label: 'Poupança', pct: '20%', desc: 'Reserva de emergência, investimentos, quitação de dívidas', color: 'bg-green-500' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${item.color} shrink-0`} />
                <span className="font-semibold text-gray-900 text-sm w-24 shrink-0">{item.label} <span className="text-gray-400 font-normal">({item.pct})</span></span>
                <span className="text-sm text-gray-600">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gastos fixos */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4" id="gastos-fixos">
          2. Ataque os gastos fixos primeiro — eles têm maior impacto
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Cortar R$50 de um gasto fixo mensal equivale a R$600/ano automaticamente, sem precisar de disciplina diária. Cortar R$50 de gastos variáveis exige força de vontade todo mês.
        </p>
        <div className="space-y-3">
          {[
            { titulo: 'Internet e telefone', dica: 'Compare planos a cada 12 meses. A concorrência entre operadoras é alta — você frequentemente consegue a mesma velocidade por 20-30% menos ao ameaçar cancelar ou ao portar o número.' },
            { titulo: 'Seguro do carro', dica: 'Cotar anualmente em pelo menos 3 seguradoras. Corretoras online (Minuto Seguros, Bidu) conseguem descontos de 15-25%. Se o carro é velho e você tem reserva, considere tirar o seguro.' },
            { titulo: 'Academia', dica: 'Se vai menos de 8 vezes por mês, cancele. Alternativas gratuitas (parques, YouTube, caminhada) cobrem grande parte dos objetivos de quem frequenta pouco.' },
            { titulo: 'Assinaturas digitais', dica: 'Levante tudo que debita na fatura: streaming, apps, armazenamento em nuvem, newsletters pagas. Cancele o que não usa e reveze os que pode — assina um por 2-3 meses, cancela, abre outro.' },
            { titulo: 'Plano de saúde', dica: 'Reavalie cobertura e coparticipação. Para jovens saudáveis, planos com coparticipação são muito mais baratos. Para famílias, pode compensar. Compare o uso real com o que o plano cobre.' },
          ].map((item, i) => (
            <div key={i} className="flex gap-3 items-start border border-gray-100 rounded-xl p-4 bg-white">
              <span className="text-green-600 font-bold text-sm mt-0.5 shrink-0">→</span>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{item.titulo}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{item.dica}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Alimentação */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4" id="alimentacao">
          3. Alimentação: o maior vazamento invisível
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Alimentação fora de casa (incluindo delivery) é o segundo maior item de gasto variável para a maioria dos brasileiros — e o que mais cresce. A diferença de custo entre cozinhar e pedir delivery pode chegar a 5-8 vezes para a mesma refeição.
        </p>
        <div className="space-y-3">
          {[
            'Planeje o cardápio semanal antes de ir ao mercado — reduz desperdício e compras por impulso',
            'Faça lista de compras e resista a desviar dela; vá ao mercado com estômago cheio',
            'Compare por kg/litro, não por embalagem. Marcas próprias de mercado são 20-40% mais baratas em commodities (arroz, feijão, óleo, massas)',
            'Leve marmita ao trabalho ao menos 3 vezes por semana — a diferença acumulada pode superar R$500/mês',
            'Use cashback de mercados (Ifood Market, Rappi, apps dos próprios mercados)',
            'Congele o que for sobrar — pão, carne, frutas maduras, sobras de jantar',
          ].map((tip, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className="text-green-600 font-bold text-sm mt-0.5 shrink-0">{i + 1}.</span>
              <p className="text-sm text-gray-700 leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Energia e água */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4" id="contas">
          4. Energia elétrica e água: pequenas mudanças, impacto real
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Com a bandeira tarifária vermelha, a conta de luz pode ser 15-25% mais cara. Mudanças de hábito reduzem o consumo sem exigir investimento:
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            'Troque lâmpadas por LED se ainda não fez — reduz 80% do gasto com iluminação',
            'Desconecte aparelhos em stand-by (TV, micro-ondas, carregadores) — representam até 12% da conta',
            'Use a máquina de lavar com carga cheia e no modo econômico',
            'Banhos de 5 minutos vs. 15 minutos fazem diferença no bolso e no planeta',
            'Regue plantas pela manhã ou à noite para evitar evaporação',
            'Verifique vazamentos — um gotejamento constante desperdiça 40 litros por dia',
          ].map((tip, i) => (
            <div key={i} className="flex gap-2 items-start bg-gray-50 rounded-lg p-3">
              <span className="text-green-500 font-bold text-xs mt-0.5 shrink-0">✓</span>
              <p className="text-sm text-gray-700">{tip}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Compras */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4" id="compras">
          5. Compras: como vencer o marketing
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          O ambiente de compras online é projetado para maximizar impulso — recomendações, urgência falsa ("só 2 unidades restantes!"), facilidade de 1 clique. Você precisa de sistemas, não de força de vontade.
        </p>
        <div className="space-y-3">
          {[
            { titulo: 'Regra das 24h', desc: 'Para qualquer compra não planejada acima de R$100, espere 24h. Em 70% dos casos, o impulso passa.' },
            { titulo: 'Remova o cartão salvo', desc: 'Apague os dados do cartão em sites de e-commerce. A fricção de redigitar os dados reduz compras impulsivas.' },
            { titulo: 'Cancele e-mails de promoção', desc: 'Você não economiza em promoções. Você gasta em promoções. O modelo de negócio de cupons é fazer você comprar o que não compraria pelo preço cheio.' },
            { titulo: 'Compare antes de comprar', desc: 'Use o Buscapé, Google Shopping e a extensão Pelando para comparar preços antes de fechar qualquer compra de valor relevante.' },
            { titulo: 'Compre usado primeiro', desc: 'OLX, Enjoei e grupos de Facebook têm itens em ótimo estado por 30-60% do preço novo. Para eletrônicos, móveis e roupas de marca, vale muito pesquisar.' },
          ].map((item, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className="bg-green-100 text-green-700 font-bold text-xs rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{item.titulo}</p>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* O que fazer com o que sobra */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4" id="investir">
          6. O que fazer com o dinheiro economizado
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Dinheiro parado na conta corrente não é economia — é dinheiro que a inflação corrói. Cada real economizado precisa de um destino imediato:
        </p>
        <div className="space-y-3">
          <div className="border-l-4 border-blue-400 pl-4">
            <p className="font-semibold text-gray-900 text-sm">1º: Quite dívidas caras</p>
            <p className="text-sm text-gray-600">Qualquer dívida acima de 1% ao mês deve ser quitada antes de investir — o retorno garantido de quitar uma dívida de 3% ao mês é de 36% ao ano.</p>
          </div>
          <div className="border-l-4 border-green-400 pl-4">
            <p className="font-semibold text-gray-900 text-sm">2º: Construa a reserva de emergência</p>
            <p className="text-sm text-gray-600">3-6 meses de gastos no Tesouro Selic ou CDB de liquidez diária. Essa reserva evita que você volte a se endividar nos imprevistos.</p>
          </div>
          <div className="border-l-4 border-purple-400 pl-4">
            <p className="font-semibold text-gray-900 text-sm">3º: Invista o excedente</p>
            <p className="text-sm text-gray-600">Com a reserva formada, o excedente mensal vai para investimentos de longo prazo: Tesouro IPCA+, LCI/LCA, ações ou FIIs conforme seu perfil.</p>
          </div>
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
        <h2 className="text-lg font-bold text-gray-900 mb-4">Continue aprendendo</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <Link href="/guias/fundo-de-emergencia" className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3 hover:border-green-300 hover:text-green-700 transition-colors group">
            <span className="text-sm font-medium">Como montar o fundo de emergência</span>
            <span className="text-gray-400 group-hover:text-green-600 shrink-0 ml-2">→</span>
          </Link>
          <Link href="/guias/como-sair-das-dividas" className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3 hover:border-green-300 hover:text-green-700 transition-colors group">
            <span className="text-sm font-medium">Como sair das dívidas</span>
            <span className="text-gray-400 group-hover:text-green-600 shrink-0 ml-2">→</span>
          </Link>
          <Link href="/glossario/regra-50-30-20" className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3 hover:border-green-300 hover:text-green-700 transition-colors group">
            <span className="text-sm font-medium">Regra 50/30/20</span>
            <span className="text-gray-400 group-hover:text-green-600 shrink-0 ml-2">→</span>
          </Link>
          <Link href="/guias/como-investir-do-zero" className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3 hover:border-green-300 hover:text-green-700 transition-colors group">
            <span className="text-sm font-medium">Como começar a investir do zero</span>
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
