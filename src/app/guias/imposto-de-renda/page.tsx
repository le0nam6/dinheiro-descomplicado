import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Como Declarar o Imposto de Renda 2025 — Guia Completo Passo a Passo',
  description: 'Guia completo para declarar o imposto de renda: quem deve declarar, documentos necessários, como lançar investimentos e como evitar cair na malha fina.',
  alternates: { canonical: 'https://endinheirados.cc/guias/imposto-de-renda' },
}

const SITE = 'https://endinheirados.cc'

const faqs = [
  { q: 'Quem é obrigado a declarar o IR em 2025?', a: 'Deve declarar em 2025 (ano-base 2024) quem: recebeu rendimentos tributáveis acima de R$33.888; recebeu rendimentos isentos acima de R$200.000; obteve ganho de capital na venda de bens; realizou operações em bolsa; tinha bens e direitos acima de R$800.000 em 31/12/2024; ou teve receita de atividade rural acima de R$169.440. Os limites são atualizados anualmente — confirme no site da Receita Federal.' },
  { q: 'Qual a diferença entre declaração simplificada e completa?', a: 'Na simplificada, você usa uma dedução padrão de 20% dos rendimentos tributáveis (com teto de R$16.754 em 2024) sem precisar comprovar gastos. Na completa, você lança todas as deduções reais: dependentes, saúde, educação, previdência, pensão alimentícia. Use a que der menor imposto — o programa da Receita calcula automaticamente e indica a mais vantajosa.' },
  { q: 'O que fazer se perder o prazo de entrega?', a: 'Enviar a declaração mesmo atrasada. A multa é de 1% ao mês sobre o imposto devido, com mínimo de R$165,74 e máximo de 20% do imposto. Quanto mais demorar, maior a multa. Se você não tem imposto a pagar (direito a restituição), ainda assim há multa mínima de R$165,74. Entregue o quanto antes.' },
  { q: 'Como declarar ações e FIIs no IR?', a: 'Na aba "Renda Variável", declare as operações mês a mês: ganhos de capital em ações comuns (15%) e day trade (20%), e rendimentos de FIIs (isentos para PF). O DARF de IR de renda variável é pago mensalmente pelo contribuinte — não retido na fonte. A corretora fornece o informe de rendimentos com os dados consolidados.' },
  { q: 'Como declarar o Tesouro Direto e CDBs?', a: 'Os rendimentos de renda fixa (CDB, LCA, LCI, Tesouro Direto) têm IR retido na fonte — constam no informe de rendimentos da corretora ou banco. Lançue os valores na ficha "Rendimentos sujeitos à tributação exclusiva/definitiva" ou "Rendimentos isentos" (para LCI/LCA isentos). O saldo em 31/12 vai em "Bens e Direitos".' },
  { q: 'O que é malha fina e como evitar?', a: 'Malha fina ocorre quando a Receita Federal detecta inconsistências na declaração — informações que não batem com o que os pagadores (empregadores, bancos, corretoras) declararam. Para evitar: confira todos os informes de rendimentos antes de preencher, declare todos os rendimentos (inclusive os isentos), e não omita bens. O CPF em nota fiscal também ajuda na malha fina de saúde.' },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      headline: 'Como Declarar o Imposto de Renda 2025 — Guia Completo Passo a Passo',
      description: 'Quem deve declarar, documentos, como lançar investimentos, deduções e como evitar a malha fina.',
      url: `${SITE}/guias/imposto-de-renda`,
      author: { '@type': 'Organization', name: 'Endinheirados', url: SITE },
      publisher: { '@type': 'Organization', name: 'Endinheirados', url: SITE },
      inLanguage: 'pt-BR',
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Início', item: SITE },
        { '@type': 'ListItem', position: 2, name: 'Guias', item: `${SITE}/guias` },
        { '@type': 'ListItem', position: 3, name: 'Imposto de Renda', item: `${SITE}/guias/imposto-de-renda` },
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

export default function GuiaImpostoDeRenda() {
  return (
    <div className="max-w-2xl mx-auto">
      <nav className="text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-green-700">Início</Link>
        {' › '}
        <Link href="/guias" className="hover:text-green-700">Guias</Link>
        {' › '}
        <span className="text-gray-600">Imposto de renda</span>
      </nav>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">Impostos</span>
          <span className="text-xs text-gray-400">13 min de leitura</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-3 leading-tight">
          Como declarar o Imposto de Renda 2025 — passo a passo completo
        </h1>
        <p className="text-xl text-gray-500 leading-relaxed">
          Do "preciso declarar?" até o envio: documentos necessários, como lançar cada tipo de rendimento, deduções e como ficar longe da malha fina.
        </p>
      </div>

      {/* Quem deve declarar */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4" id="quem-deve-declarar">
          Passo 1: verifique se você é obrigado a declarar
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Você deve declarar o IR de 2025 (ano-base 2024) se se encaixar em ao menos uma das condições abaixo. Confira o site da Receita Federal para os valores atualizados, pois os limites mudam anualmente.
        </p>
        <div className="space-y-2 mb-4">
          {[
            'Recebeu rendimentos tributáveis acima de R$33.888 em 2024',
            'Recebeu rendimentos isentos, não tributáveis ou tributados exclusivamente na fonte acima de R$200.000',
            'Obteve ganho de capital na alienação de bens (venda de imóvel, carro, etc.)',
            'Realizou operações em bolsa de qualquer valor (ações, ETFs, FIIs, opções)',
            'Tinha bens e direitos acima de R$800.000 em 31/12/2024',
            'Recebeu receita de atividade rural acima de R$169.440',
            'Passou a ser residente no Brasil em 2024',
          ].map((item, i) => (
            <div key={i} className="flex gap-3 items-start bg-gray-50 rounded-lg px-4 py-2.5">
              <span className="text-yellow-500 font-bold text-sm shrink-0 mt-0.5">•</span>
              <p className="text-sm text-gray-700">{item}</p>
            </div>
          ))}
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-900">
            Mesmo que não seja obrigado, pode valer a pena declarar se tiver imposto a restituir (IR retido na fonte superior ao devido) ou se quiser comprovar renda para financiamentos.
          </p>
        </div>
      </section>

      {/* Documentos */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4" id="documentos">
          Passo 2: reúna todos os documentos
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          A declaração é um reflexo do que aconteceu na sua vida financeira em 2024. Antes de abrir o programa, reúna tudo para não precisar parar no meio.
        </p>
        <div className="space-y-4">
          {[
            {
              categoria: 'Rendimentos do trabalho',
              docs: ['Informe de rendimentos do empregador (disponível no eSocial ou fornecido pela empresa até fevereiro)', 'Recibos de pro-labore se for sócio de empresa', 'Comprovantes de autônomo / carnê-leão pago durante o ano'],
            },
            {
              categoria: 'Rendimentos de investimentos',
              docs: ['Informe de rendimentos do banco e corretoras (disponível no app/site até o fim de fevereiro)', 'Notas de corretagem (para calcular ganho de capital em ações)', 'Extrato do Tesouro Direto', 'Informe de rendimentos de FIIs'],
            },
            {
              categoria: 'Bens e direitos',
              docs: ['IPTU do imóvel (com valor venal ou declarado)', 'Documentos de veículos (RENAVAM, valor pago)', 'Extratos de conta corrente e investimentos em 31/12'],
            },
            {
              categoria: 'Deduções',
              docs: ['Recibos de plano de saúde e médicos', 'Comprovantes de escola e faculdade (até o teto)', 'Comprovante de dependentes (certidão de nascimento, CPF)', 'Comprovante de contribuição à previdência privada (PGBL)'],
            },
          ].map((grupo, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4 bg-white">
              <p className="font-bold text-gray-900 text-sm mb-2">{grupo.categoria}</p>
              <ul className="space-y-1">
                {grupo.docs.map((doc, j) => (
                  <li key={j} className="flex gap-2 items-start text-sm text-gray-600">
                    <span className="text-green-500 shrink-0 mt-0.5">✓</span>
                    {doc}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Preenchimento */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4" id="preenchimento">
          Passo 3: preencha ficha por ficha
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          O programa gerador da DIRPF (disponível no site da Receita Federal) ou o aplicativo Meu Imposto de Renda organiza a declaração em fichas. Siga esta ordem:
        </p>
        <div className="space-y-4">
          {[
            { ficha: 'Identificação do contribuinte', o_que: 'Nome, CPF, endereço, tipo de declaração. Marque "conjunta" se for declarar junto com o cônjuge (pode ser vantajoso).' },
            { ficha: 'Dependentes', o_que: 'Informe filhos, cônjuge (se não declarar em separado) e outros dependentes com CPF. Cada dependente gera dedução de R$2.275,08 e você poderá deduzir gastos de saúde e educação deles.' },
            { ficha: 'Rendimentos tributáveis recebidos de pessoa jurídica', o_que: 'Salários, pró-labore. Copie exatamente do informe de rendimentos do empregador — os valores precisam bater com o que a empresa declarou.' },
            { ficha: 'Rendimentos isentos e não tributáveis', o_que: 'Dividendos de ações, rendimentos de LCI/LCA, FGTS recebido, indenizações. Declara mesmo sendo isento — a omissão pode gerar malha fina.' },
            { ficha: 'Rendimentos sujeitos à tributação exclusiva', o_que: 'Rendimentos de CDB, Tesouro Direto, fundos, 13º salário. Estão no informe de rendimentos da corretora/banco.' },
            { ficha: 'Deduções', o_que: 'Saúde (sem teto para pessoa física), educação (teto de R$3.561,50 por pessoa), previdência privada (PGBL até 12% da renda bruta), pensão alimentícia judicial.' },
            { ficha: 'Bens e direitos', o_que: 'Liste todos os bens: imóveis (pelo custo de aquisição, não pelo valor de mercado), veículos (FIPE na compra), investimentos (saldo em 31/12), conta bancária.' },
            { ficha: 'Dívidas e ônus reais', o_que: 'Financiamento imobiliário, empréstimos em andamento com saldo acima de R$5.000.' },
          ].map((item, i) => (
            <div key={i} className="flex gap-4 items-start">
              <span className="bg-yellow-100 text-yellow-700 font-bold text-xs rounded-full w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{item.ficha}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{item.o_que}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Investimentos */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4" id="investimentos">
          Como declarar cada tipo de investimento
        </h2>
        <div className="space-y-3">
          {[
            {
              tipo: 'Ações',
              onde: 'Renda variável + Bens e Direitos',
              como: 'Na ficha de Renda Variável, declare os ganhos e prejuízos mês a mês. O saldo de ações em carteira em 31/12 vai em Bens e Direitos pelo custo de aquisição (não pelo valor de mercado). DARFs de renda variável pagos ao longo do ano também são informados.',
            },
            {
              tipo: 'FIIs',
              onde: 'Renda variável + Bens e Direitos + Rendimentos isentos',
              como: 'Rendimentos distribuídos pelos FIIs são isentos para PF — declare em "Rendimentos isentos". Ganho de capital na venda de cotas de FIIs é tributável (20%). As cotas em carteira em 31/12 vão em Bens e Direitos.',
            },
            {
              tipo: 'Tesouro Direto e CDB',
              onde: 'Rendimentos sujeitos à tributação exclusiva + Bens e Direitos',
              como: 'Os rendimentos já vêm com IR retido na fonte. Use os dados do informe de rendimentos da corretora. O saldo em 31/12 (pelo valor de aplicação original) vai em Bens e Direitos.',
            },
            {
              tipo: 'LCI e LCA',
              onde: 'Rendimentos isentos + Bens e Direitos',
              como: 'Os rendimentos são isentos para PF — declare em "Rendimentos isentos e não tributáveis". O saldo em 31/12 vai em Bens e Direitos. Mesmo isento, precisa ser declarado.',
            },
            {
              tipo: 'Fundos de investimento',
              onde: 'Rendimentos sujeitos à tributação exclusiva + Bens e Direitos',
              como: 'O come-cotas retém IR ao longo do ano. Os rendimentos constam no informe da corretora. O saldo em 31/12 (número de cotas × valor da cota) vai em Bens e Direitos.',
            },
            {
              tipo: 'Criptomoedas',
              onde: 'Bens e Direitos + Renda variável',
              como: 'Criptomoedas com saldo acima de R$5.000 devem ser declaradas em Bens e Direitos pelo custo de aquisição. Ganhos de capital na venda acima de R$35.000/mês são tributáveis (15% a 22,5%). Exchanges estrangeiras são declaradas como bem no exterior.',
            },
          ].map((inv, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <p className="font-bold text-gray-900 text-sm">{inv.tipo}</p>
                <span className="text-xs text-gray-400 font-medium">{inv.onde}</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{inv.como}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Malha fina */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4" id="malha-fina">
          Como evitar a malha fina
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          A malha fina ocorre quando os dados que você declarou não batem com os que terceiros (empregadores, bancos, corretoras, planos de saúde) declararam sobre você. É automaticamente detectada pelo sistema da Receita.
        </p>
        <div className="space-y-3">
          {[
            'Declare todos os rendimentos — inclusive os isentos. Omissão de rendimentos isentos é causa frequente de malha fina',
            'Confira os valores do informe de rendimentos antes de lançar — copie exatamente, sem arredondar',
            'Inclua CPF de todos os dependentes e do médico/dentista nas deduções de saúde',
            'Não deduza despesas de saúde sem comprovante — a Receita cruza com as informações das operadoras',
            'Declare bens mesmo que não gerem renda (carro, conta bancária)',
            'Se recebeu aluguel, declare o valor total recebido — os locatários também declaram esse pagamento',
          ].map((tip, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className="text-red-400 font-bold text-sm mt-0.5 shrink-0">!</span>
              <p className="text-sm text-gray-700 leading-relaxed">{tip}</p>
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
          <Link href="/glossario/ganho-de-capital" className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3 hover:border-green-300 hover:text-green-700 transition-colors group">
            <span className="text-sm font-medium">Ganho de capital — como calcular</span>
            <span className="text-gray-400 group-hover:text-green-600 shrink-0 ml-2">→</span>
          </Link>
          <Link href="/glossario/declaracao-ir" className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3 hover:border-green-300 hover:text-green-700 transition-colors group">
            <span className="text-sm font-medium">Declaração de IR — glossário</span>
            <span className="text-gray-400 group-hover:text-green-600 shrink-0 ml-2">→</span>
          </Link>
          <Link href="/guias/como-investir-do-zero" className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3 hover:border-green-300 hover:text-green-700 transition-colors group">
            <span className="text-sm font-medium">Como começar a investir</span>
            <span className="text-gray-400 group-hover:text-green-600 shrink-0 ml-2">→</span>
          </Link>
          <Link href="/guias/previdencia-privada" className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3 hover:border-green-300 hover:text-green-700 transition-colors group">
            <span className="text-sm font-medium">Previdência privada — vale a pena?</span>
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
