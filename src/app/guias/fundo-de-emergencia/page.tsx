import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Como Montar o Fundo de Emergência — Guia Completo 2025',
  description: 'Quanto guardar no fundo de emergência, onde deixar e como chegar lá. Guia prático com exemplos reais para CLT, autônomo e empreendedor.',
  alternates: { canonical: 'https://endinheirados.cc/guias/fundo-de-emergencia' },
}

const faqs = [
  { q: 'Quanto devo ter no fundo de emergência?', a: 'Para CLT com emprego estável: de 3 a 6 meses de gastos fixos. Para autônomo ou empreendedor: de 6 a 12 meses. Calcule com base nos seus gastos essenciais mensais, não no salário.' },
  { q: 'Onde guardar o fundo de emergência?', a: 'Tesouro Selic (mais seguro, rendimento diário), CDB de banco grande com liquidez diária, ou conta remunerada de corretora. O critério é liquidez imediata + segurança, não rentabilidade máxima.' },
  { q: 'Posso usar a poupança para o fundo de emergência?', a: 'A poupança funciona, mas tem desvantagem: o rendimento só é creditado na data de aniversário mensal. Se você resgatar antes dessa data, perde o rendimento do mês. Tesouro Selic e CDB com liquidez diária são melhores opções.' },
  { q: 'Quanto tempo leva para montar o fundo de emergência?', a: 'Depende do quanto você consegue guardar por mês. Guardando 10% do salário com gasto mensal de R$3.000 (meta de R$18.000 para 6 meses), levaria cerca de 5 anos. Aumentando para 20%, cai para 2,5 anos. Comece com o que puder e aumente progressivamente.' },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      headline: 'Como montar seu fundo de emergência — guia completo',
      description: 'Quanto guardar no fundo de emergência, onde deixar e como chegar lá. Guia prático com exemplos reais.',
      url: 'https://endinheirados.cc/guias/fundo-de-emergencia',
      publisher: { '@type': 'Organization', name: 'Endinheirados', url: 'https://endinheirados.cc' },
      inLanguage: 'pt-BR',
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://endinheirados.cc' },
        { '@type': 'ListItem', position: 2, name: 'Guias', item: 'https://endinheirados.cc/guias' },
        { '@type': 'ListItem', position: 3, name: 'Fundo de emergência', item: 'https://endinheirados.cc/guias/fundo-de-emergencia' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Quanto devo ter no fundo de emergência?',
          acceptedAnswer: { '@type': 'Answer', text: 'Para CLT com emprego estável: de 3 a 6 meses de gastos fixos. Para autônomo ou empreendedor: de 6 a 12 meses. Calcule com base nos seus gastos essenciais mensais, não no salário.' },
        },
        {
          '@type': 'Question',
          name: 'Onde guardar o fundo de emergência?',
          acceptedAnswer: { '@type': 'Answer', text: 'Tesouro Selic (mais seguro, rendimento diário), CDB de banco grande com liquidez diária, ou conta remunerada de corretora. O critério é liquidez imediata + segurança, não rentabilidade máxima.' },
        },
        {
          '@type': 'Question',
          name: 'Posso usar a poupança para o fundo de emergência?',
          acceptedAnswer: { '@type': 'Answer', text: 'A poupança funciona, mas tem desvantagem: o rendimento só é creditado na data de aniversário mensal. Se você resgatar antes dessa data, perde o rendimento do mês. Tesouro Selic e CDB com liquidez diária são melhores opções.' },
        },
        {
          '@type': 'Question',
          name: 'Quanto tempo leva para montar o fundo de emergência?',
          acceptedAnswer: { '@type': 'Answer', text: 'Depende do quanto você consegue guardar por mês. Guardando 10% do salário com gasto mensal de R$3.000 (meta de R$18.000 para 6 meses), levaria cerca de 5 anos. Aumentando para 20%, cai para 2,5 anos. Comece com o que puder e aumente progressivamente.' },
        },
      ],
    },
  ],
}

export default function FundoDeEmergenciaGuia() {
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
          <span className="text-gray-600">Fundo de emergência</span>
        </nav>

        {/* Cabeçalho */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Organização</span>
            <span className="text-xs text-gray-400">8 min de leitura</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-4 leading-tight">
            Como montar o fundo de emergência — do zero ao valor ideal
          </h1>
          <p className="text-xl text-gray-500 leading-relaxed">
            Quanto guardar, onde deixar, como chegar lá sem ter que ser rico primeiro. Um guia que funciona com qualquer salário.
          </p>
        </div>

        {/* Índice */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-8">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Neste guia</p>
          <ol className="space-y-1 text-sm text-gray-700">
            <li><a href="#o-que-e" className="hover:text-green-700">1. O que é fundo de emergência (e o que não é)</a></li>
            <li><a href="#quanto" className="hover:text-green-700">2. Quanto você precisa ter</a></li>
            <li><a href="#onde" className="hover:text-green-700">3. Onde guardar o dinheiro</a></li>
            <li><a href="#como-montar" className="hover:text-green-700">4. Como montar na prática</a></li>
            <li><a href="#faq" className="hover:text-green-700">5. Perguntas frequentes</a></li>
          </ol>
        </div>

        {/* Conteúdo */}
        <div className="space-y-8 mb-10 text-[17px] text-gray-700 leading-relaxed">

          <section id="o-que-e">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">O que é fundo de emergência (e o que não é)</h2>
            <p className="mb-4">
              Fundo de emergência é dinheiro guardado especificamente para imprevistos: demissão, problema de saúde, carro quebrado, conserto urgente de encanamento. O objetivo é ter acesso imediato ao dinheiro sem precisar vender investimentos no momento errado ou contrair dívidas caras.
            </p>
            <p className="mb-4">
              O que <strong>não</strong> é fundo de emergência: a reserva para a viagem de férias, o dinheiro separado para trocar o carro, os investimentos de longo prazo para aposentadoria. Cada objetivo financeiro merece seu próprio "envelope". Misturar tudo em um lugar só dificulta a gestão e aumenta a chance de usar para a coisa errada.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-amber-800 mb-1">Por que isso importa de verdade</p>
              <p className="text-sm text-amber-700">
                Sem fundo de emergência, qualquer imprevisto vira dívida. Uma demissão sem reserva leva ao cheque especial. Uma conta médica inesperada vai para o cartão de crédito. Com reserva, os mesmos eventos são apenas inconvenientes — não catástrofes financeiras.
              </p>
            </div>
          </section>

          <section id="quanto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Quanto você precisa ter</h2>
            <p className="mb-4">
              A regra é simples: de 3 a 12 meses de <strong>gastos fixos mensais</strong>. O intervalo depende da estabilidade da sua renda:
            </p>

            <div className="space-y-3 mb-6">
              <div className="border border-gray-200 rounded-xl p-4 bg-white">
                <p className="font-semibold text-gray-900 mb-1">CLT com emprego estável</p>
                <p className="text-sm text-gray-600">3 a 6 meses de gastos. O seguro-desemprego e o aviso prévio reduzem o risco de ficar sem renda de uma hora para outra.</p>
              </div>
              <div className="border border-gray-200 rounded-xl p-4 bg-white">
                <p className="font-semibold text-gray-900 mb-1">Autônomo ou freelancer</p>
                <p className="text-sm text-gray-600">6 a 9 meses. A renda é mais irregular e pode cair rápido se um cliente importante sumir.</p>
              </div>
              <div className="border border-gray-200 rounded-xl p-4 bg-white">
                <p className="font-semibold text-gray-900 mb-1">Empreendedor ou dono de empresa</p>
                <p className="text-sm text-gray-600">9 a 12 meses. O negócio pode ter meses ruins, e o empreendedor frequentemente garante o salário dos funcionários antes do próprio.</p>
              </div>
            </div>

            <p className="mb-4">
              O cálculo parte dos <strong>gastos fixos essenciais</strong> — aluguel ou financiamento, alimentação, contas de luz/água/internet, plano de saúde, transporte. <em>Não</em> é baseado no salário bruto nem no total de gastos (que inclui lazer, vestuário, eletronices etc.).
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-gray-800 mb-2">Exemplo prático</p>
              <p className="text-sm text-gray-600 mb-1">Gastos fixos mensais: R$3.200 (aluguel R$1.500 + alimentação R$800 + contas R$500 + plano de saúde R$400)</p>
              <p className="text-sm text-gray-600 mb-1">CLT → meta: R$9.600 a R$19.200 (3 a 6 meses)</p>
              <p className="text-sm text-gray-600">Autônomo → meta: R$19.200 a R$28.800 (6 a 9 meses)</p>
            </div>
          </section>

          <section id="onde">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Onde guardar o dinheiro</h2>
            <p className="mb-4">
              O fundo de emergência tem dois requisitos inegociáveis: <strong>liquidez imediata</strong> (você consegue o dinheiro hoje, se precisar) e <strong>segurança</strong> (o valor não pode cair). Rentabilidade máxima fica em segundo plano.
            </p>
            <p className="mb-4">As melhores opções, em ordem de preferência:</p>

            <div className="space-y-3 mb-6">
              <div className="border border-green-200 bg-green-50 rounded-xl p-4">
                <div className="flex justify-between items-center mb-1">
                  <p className="font-semibold text-gray-900">Tesouro Selic</p>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Melhor opção</span>
                </div>
                <p className="text-sm text-gray-600">Garantia do governo federal. Resgate em D+1 (cai no dia seguinte). Rende 100% da Selic. Acessível a partir de R$30 em qualquer corretora.</p>
              </div>
              <div className="border border-gray-200 bg-white rounded-xl p-4">
                <p className="font-semibold text-gray-900 mb-1">CDB de banco grande com liquidez diária</p>
                <p className="text-sm text-gray-600">Bancos como Itaú, Bradesco, BB e Caixa oferecem CDBs com resgate no mesmo dia. Coberto pelo FGC até R$250.000. Rentabilidade geralmente entre 90% e 100% do CDI.</p>
              </div>
              <div className="border border-gray-200 bg-white rounded-xl p-4">
                <p className="font-semibold text-gray-900 mb-1">Conta remunerada de corretora</p>
                <p className="text-sm text-gray-600">XP, Rico, Nu Invest e outras pagam 100% do CDI sobre o saldo parado. Liquidez imediata, sem burocracia. Verifique se tem cobertura do FGC.</p>
              </div>
              <div className="border border-gray-200 bg-white rounded-xl p-4 opacity-70">
                <div className="flex justify-between items-center mb-1">
                  <p className="font-semibold text-gray-900">Poupança</p>
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">Evitar</span>
                </div>
                <p className="text-sm text-gray-600">Funciona, mas tem desvantagem: o rendimento só é creditado na data de aniversário mensal. Se você resgatar antes, perde o rendimento do mês inteiro.</p>
              </div>
            </div>

            <p>
              Quer entender melhor como esses investimentos funcionam? Veja:{' '}
              <Link href="/glossario/liquidez" className="text-green-700 hover:underline">o que é liquidez</Link>,{' '}
              <Link href="/glossario/tesouro-direto" className="text-green-700 hover:underline">como funciona o Tesouro Direto</Link> e{' '}
              <Link href="/glossario/renda-fixa" className="text-green-700 hover:underline">o que é renda fixa</Link>.
            </p>
          </section>

          <section id="como-montar">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Como montar na prática</h2>
            <p className="mb-4">
              A maioria das pessoas erra por querer chegar no valor ideal de uma vez. Não funciona assim. O fundo de emergência se constrói com constância, não com grandes aportes únicos.
            </p>

            <div className="space-y-4 mb-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Calcule seus gastos fixos essenciais</p>
                  <p className="text-sm text-gray-600">Some aluguel, alimentação, contas obrigatórias e plano de saúde. Esse é seu custo de sobrevivência mensal.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Defina a meta (multiplicado por 3, 6 ou 12)</p>
                  <p className="text-sm text-gray-600">Use o multiplicador adequado ao seu perfil de renda. Se errar para cima, não tem problema — é dinheiro seu.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Abra uma conta no Tesouro Direto ou corretora</p>
                  <p className="text-sm text-gray-600">Leva 10 minutos. Separe o fundo de emergência da conta corrente — misturar é a principal causa de usar o dinheiro para outros fins.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Automatize o aporte mensal</p>
                  <p className="text-sm text-gray-600">Defina um valor fixo por mês — pode ser R$100, R$500 ou R$1.000, dependendo da sua renda. Agende a transferência para o dia do pagamento do salário.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">5</div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Só use em emergências reais</p>
                  <p className="text-sm text-gray-600">Demissão, saúde, carro ou casa em emergência: sim. Promoção imperdível, viagem de última hora, presente caro: não. Se usar, reconstrua o fundo antes de fazer outros investimentos.</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-green-800 mb-1">Regra prática</p>
              <p className="text-sm text-green-700">
                Enquanto o fundo de emergência não estiver completo, priorize ele antes de qualquer outro investimento. Não faz sentido investir em renda variável e não ter reserva — um imprevisto vai obrigar você a vender na hora errada.
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

        {/* Links relacionados */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Continue aprendendo</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link href="/glossario/fundo-de-emergencia" className="block border border-gray-200 rounded-xl p-4 hover:border-green-300 transition-colors group">
              <p className="text-sm font-semibold text-gray-900 group-hover:text-green-700">Glossário: Fundo de emergência →</p>
              <p className="text-xs text-gray-500 mt-0.5">Definição rápida e FAQs</p>
            </Link>
            <Link href="/glossario/tesouro-direto" className="block border border-gray-200 rounded-xl p-4 hover:border-green-300 transition-colors group">
              <p className="text-sm font-semibold text-gray-900 group-hover:text-green-700">Glossário: Tesouro Direto →</p>
              <p className="text-xs text-gray-500 mt-0.5">Como funciona o Tesouro Selic</p>
            </Link>
            <Link href="/ferramentas/calculadora-juros" className="block border border-gray-200 rounded-xl p-4 hover:border-green-300 transition-colors group">
              <p className="text-sm font-semibold text-gray-900 group-hover:text-green-700">Calculadora de investimentos →</p>
              <p className="text-xs text-gray-500 mt-0.5">Simule quanto rende sua reserva</p>
            </Link>
            <Link href="/guias/como-investir-do-zero" className="block border border-gray-200 rounded-xl p-4 hover:border-green-300 transition-colors group">
              <p className="text-sm font-semibold text-gray-900 group-hover:text-green-700">Guia: Como investir do zero →</p>
              <p className="text-xs text-gray-500 mt-0.5">Próximo passo após o fundo</p>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
