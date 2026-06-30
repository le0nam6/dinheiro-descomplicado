import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Previdência Privada Vale a Pena? PGBL ou VGBL — Guia Completo',
  description: 'Guia completo de previdência privada: diferença entre PGBL e VGBL, quando compensa, taxas que destroem rentabilidade e alternativas que o banco não te conta.',
  alternates: { canonical: 'https://portalendinheirados.com.br/guias/previdencia-privada' },
}

const SITE = 'https://portalendinheirados.com.br'

const faqs = [
  { q: 'PGBL ou VGBL — qual é melhor?', a: 'PGBL é indicado para quem faz declaração completa do IR e pode deduzir até 12% da renda bruta anual. O imposto é cobrado sobre o total resgatado (principal + rendimentos) no futuro. VGBL é melhor para quem declara no simplificado ou já atingiu o limite de dedução — o IR incide apenas sobre os rendimentos. Para a maioria das pessoas na classe média, o VGBL costuma ser mais adequado.' },
  { q: 'Previdência privada é melhor que o Tesouro Direto?', a: 'Geralmente não, especialmente para quem já maximiza o benefício fiscal do PGBL. O Tesouro IPCA+ tem taxa de administração de 0,1% ao ano versus 1,5-3% em muitos planos de previdência. Ao longo de 30 anos, essa diferença de custo pode representar 30-40% a menos de patrimônio acumulado.' },
  { q: 'Posso resgatar a previdência privada a qualquer momento?', a: 'Sim, mas com carência. A maioria dos planos tem carência de 60 dias para cada contribuição. Além disso, o regime tributário escolhido impacta o IR: na tabela regressiva, resgates antes de 2 anos pagam 35% de IR; acima de 10 anos, apenas 10%. Resgates prematuros têm custo alto.' },
  { q: 'Qual a diferença entre tabela progressiva e regressiva na previdência?', a: 'Tabela progressiva: IR é cobrado como na renda normal (0% a 27,5%) no resgate — bom para quem vai ter renda baixa na aposentadoria. Tabela regressiva: alíquota cai de 35% (até 2 anos) para 10% (acima de 10 anos) — melhor para quem vai manter o dinheiro investido por 10+ anos. Para planejamento de longo prazo, a tabela regressiva costuma ser mais vantajosa.' },
  { q: 'O que é taxa de carregamento e por que é um problema?', a: 'Taxa de carregamento é cobrada sobre cada contribuição antes de o dinheiro ser investido — varia de 0% a 5%. Um plano com 3% de carregamento significa que de cada R$100 que você contribui, só R$97 são investidos. Bancos grandes costumam cobrar carregamento; seguradoras independentes e plataformas de investimento geralmente oferecem 0%. Sempre exija 0% de carregamento.' },
  { q: 'Previdência privada tem proteção em caso de morte?', a: 'Sim. O saldo da previdência privada é transferido diretamente aos beneficiários indicados sem passar pelo inventário — sem custos de cartório ou ITCMD. Isso torna a previdência privada um instrumento de planejamento sucessório eficiente, especialmente para quem tem família.' },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      headline: 'Previdência Privada Vale a Pena? PGBL ou VGBL — Guia Completo',
      description: 'Diferença entre PGBL e VGBL, quando a previdência privada compensa, taxas que destroem rentabilidade e as melhores alternativas.',
      url: `${SITE}/guias/previdencia-privada`,
      author: { '@type': 'Organization', name: 'Endinheirados', url: SITE },
      publisher: { '@type': 'Organization', name: 'Endinheirados', url: SITE },
      inLanguage: 'pt-BR',
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Início', item: SITE },
        { '@type': 'ListItem', position: 2, name: 'Guias', item: `${SITE}/guias` },
        { '@type': 'ListItem', position: 3, name: 'Previdência Privada', item: `${SITE}/guias/previdencia-privada` },
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

export default function GuiaPrevidenciaPrivada() {
  return (
    <div className="max-w-2xl mx-auto">
      <nav className="text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-green-700">Início</Link>
        {' › '}
        <Link href="/guias" className="hover:text-green-700">Guias</Link>
        {' › '}
        <span className="text-gray-600">Previdência privada</span>
      </nav>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">Previdência</span>
          <span className="text-xs text-gray-400">11 min de leitura</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-3 leading-tight">
          Previdência privada vale a pena? PGBL, VGBL e o que o banco não te conta
        </h1>
        <p className="text-xl text-gray-500 leading-relaxed">
          Quando a previdência privada faz sentido, quando ela é uma cilada cara e quais alternativas existem para planejar a aposentadoria.
        </p>
      </div>

      {/* O que é */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4" id="o-que-e">
          O que é previdência privada (e o que não é)
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Previdência privada é um investimento de longo prazo com benefícios tributários específicos — não é um seguro de vida, não é uma poupança e não é complemento obrigatório do INSS. É um veículo para acumular patrimônio para a aposentadoria com vantagens e desvantagens bem definidas.
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          Existem dois tipos: <strong>PGBL</strong> (Plano Gerador de Benefício Livre) e <strong>VGBL</strong> (Vida Gerador de Benefício Livre). A diferença principal é a forma de tributação — e essa escolha pode significar dezenas de milhares de reais de diferença no longo prazo.
        </p>
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div className="border border-blue-200 bg-blue-50 rounded-2xl p-5">
            <p className="font-bold text-blue-800 mb-2">PGBL</p>
            <ul className="space-y-1.5 text-sm text-blue-900">
              <li>✓ Deduz até 12% da renda bruta no IR</li>
              <li>✓ IR sobre o total no resgate (principal + rendimentos)</li>
              <li>✓ Indicado para declaração completa</li>
              <li className="text-blue-600">→ Bom se você tem IR a pagar todo ano</li>
            </ul>
          </div>
          <div className="border border-green-200 bg-green-50 rounded-2xl p-5">
            <p className="font-bold text-green-800 mb-2">VGBL</p>
            <ul className="space-y-1.5 text-sm text-green-900">
              <li>✓ Não deduz do IR</li>
              <li>✓ IR apenas sobre os rendimentos no resgate</li>
              <li>✓ Indicado para declaração simplificada</li>
              <li className="text-green-600">→ Bom para a maioria dos casos</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Quando faz sentido */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4" id="quando-faz-sentido">
          Quando a previdência privada realmente faz sentido
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          A previdência privada tem valor real em situações específicas. Fora delas, outras alternativas geralmente são superiores.
        </p>
        <div className="space-y-4">
          <div className="flex gap-3 items-start">
            <span className="bg-green-100 text-green-700 font-bold text-xs rounded-full px-2 py-0.5 shrink-0 mt-0.5">SIM</span>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Você faz declaração completa e tem IR a restituir</p>
              <p className="text-sm text-gray-600">O benefício do PGBL (deduzir 12% da renda bruta) pode gerar retorno imediato de 7,5% a 27,5% sobre o valor contribuído — dependendo da alíquota marginal de IR. Esse benefício antecipado é difícil de bater.</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="bg-green-100 text-green-700 font-bold text-xs rounded-full px-2 py-0.5 shrink-0 mt-0.5">SIM</span>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Você tem empresa e benefício de match</p>
              <p className="text-sm text-gray-600">Se seu empregador oferece contribuição equivalente (matching) ao que você coloca no plano corporativo, sempre vale aderir até o limite do matching — é dinheiro extra imediato.</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="bg-green-100 text-green-700 font-bold text-xs rounded-full px-2 py-0.5 shrink-0 mt-0.5">SIM</span>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Planejamento sucessório</p>
              <p className="text-sm text-gray-600">Previdência privada não entra em inventário — vai direto para os beneficiários. Sem ITCMD (imposto sobre herança, que pode chegar a 8% no estado). Para patrimônios maiores, isso é relevante.</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="bg-red-100 text-red-700 font-bold text-xs rounded-full px-2 py-0.5 shrink-0 mt-0.5">NÃO</span>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Taxa de administração acima de 1% ao ano</p>
              <p className="text-sm text-gray-600">A maioria dos planos de banco grande cobra 1,5% a 3% ao ano de taxa de administração. Ao longo de 30 anos, esse custo consome 30-50% do patrimônio. Compare sempre com o Tesouro IPCA+ (0,1% ao ano) antes de decidir.</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="bg-red-100 text-red-700 font-bold text-xs rounded-full px-2 py-0.5 shrink-0 mt-0.5">NÃO</span>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Você vai precisar do dinheiro em menos de 10 anos</p>
              <p className="text-sm text-gray-600">Na tabela regressiva, resgates antes de 2 anos pagam 35% de IR. O benefício tributário da previdência só se manifesta no longo prazo. Para menos de 10 anos, CDB, LCA e Tesouro são mais eficientes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* As taxas que matam */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4" id="taxas">
          As taxas que destroem a rentabilidade
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          O principal problema da maioria dos planos de previdência vendidos em bancos não é o produto em si — são as taxas cobradas. Existem três:
        </p>
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold text-gray-900 text-sm">Taxa de carregamento</p>
              <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Evite acima de 0%</span>
            </div>
            <p className="text-sm text-gray-600">Cobrada sobre cada aporte — de 0% a 5%. Um plano com 3% de carregamento investe apenas R$97 de cada R$100 que você coloca. Plataformas independentes (XP, BTG, Icatu) oferecem 0% de carregamento. Exija isso.</p>
          </div>
          <div className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold text-gray-900 text-sm">Taxa de administração</p>
              <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">Máximo 1% ao ano</span>
            </div>
            <p className="text-sm text-gray-600">Cobrada anualmente sobre o patrimônio total. Bancos cobram de 1,5% a 3%. Planos de seguradoras independentes têm opções abaixo de 0,5%. A diferença de 1% ao ano por 30 anos é gigantesca — em R$500.000, representa mais de R$150.000 a menos.</p>
          </div>
          <div className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold text-gray-900 text-sm">Taxa de saída</p>
              <span className="text-xs font-semibold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">Atenção ao prazo</span>
            </div>
            <p className="text-sm text-gray-600">Cobrada na portabilidade ou resgate antecipado. Alguns planos isentam após 24-60 meses. Verifique no regulamento antes de contratar — e negocie a isenção.</p>
          </div>
        </div>
      </section>

      {/* Portabilidade */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4" id="portabilidade">
          Portabilidade: como migrar para um plano melhor
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Se você tem um plano ruim (taxa alta, carregamento, fundo péssimo), não precisa resgatar e pagar IR. Você pode fazer <strong>portabilidade</strong> — transferir o saldo para um plano melhor sem tributação, mantendo o tempo de acúmulo para a tabela regressiva.
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          A portabilidade pode ser feita dentro do mesmo tipo de plano (PGBL para PGBL, VGBL para VGBL) entre seguradoras. O processo é simples: você contrata o plano destino e solicita a portabilidade pela nova seguradora. Prazo médio: 5 dias úteis.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-green-900 font-medium">Se você tem previdência privada em banco grande com taxa de administração acima de 1,5%, vale a pena pesquisar planos na Icatu, Zurich, Brasilprev via XP ou BTG, ou diretamente em plataformas como a Previtec.</p>
        </div>
      </section>

      {/* Alternativas */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4" id="alternativas">
          Alternativas que o banco não menciona
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Previdência privada não é o único caminho para a aposentadoria. Para quem não tem o benefício fiscal do PGBL, outras alternativas costumam ter melhor custo-benefício:
        </p>
        <div className="space-y-3">
          {[
            { nome: 'Tesouro IPCA+', desc: 'Taxa de administração de 0,1% ao ano, rentabilidade real garantida, vencimentos de 5 a 35 anos. Para aposentadoria de longo prazo, difícil de bater no custo.' },
            { nome: 'ETFs de ações (BOVA11, IVVB11)', desc: 'Exposição a centenas de empresas com taxa de administração de 0,1% a 0,5% ao ano. Para investidores de longo prazo que aceitam volatilidade, o retorno histórico no período de 20-30 anos supera a maioria dos planos ativos.' },
            { nome: 'FIIs para renda mensal', desc: 'Distribuem rendimentos mensais isentos de IR. Uma carteira de FIIs diversificada com yield de 8-10% ao ano pode ser uma fonte de renda passiva na aposentadoria com liquidez diária.' },
            { nome: 'LCI/LCA de longo prazo', desc: 'Isentas de IR, cobertura do FGC, disponíveis em prazos de 1 a 5 anos. Para a parcela conservadora da carteira, com custo zero de administração.' },
          ].map((alt, i) => (
            <div key={i} className="flex gap-3 items-start border border-gray-100 rounded-xl p-4 bg-white">
              <span className="text-green-600 font-bold text-sm mt-0.5 shrink-0">→</span>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{alt.nome}</p>
                <p className="text-sm text-gray-600">{alt.desc}</p>
              </div>
            </div>
          ))}
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
          <Link href="/glossario/pgbl-vgbl" className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3 hover:border-green-300 hover:text-green-700 transition-colors group">
            <span className="text-sm font-medium">PGBL e VGBL — glossário</span>
            <span className="text-gray-400 group-hover:text-green-600 shrink-0 ml-2">→</span>
          </Link>
          <Link href="/glossario/come-cotas" className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3 hover:border-green-300 hover:text-green-700 transition-colors group">
            <span className="text-sm font-medium">O que é come-cotas</span>
            <span className="text-gray-400 group-hover:text-green-600 shrink-0 ml-2">→</span>
          </Link>
          <Link href="/guias/como-investir-do-zero" className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3 hover:border-green-300 hover:text-green-700 transition-colors group">
            <span className="text-sm font-medium">Como começar a investir do zero</span>
            <span className="text-gray-400 group-hover:text-green-600 shrink-0 ml-2">→</span>
          </Link>
          <Link href="/glossario/inss" className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3 hover:border-green-300 hover:text-green-700 transition-colors group">
            <span className="text-sm font-medium">Como funciona o INSS</span>
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
