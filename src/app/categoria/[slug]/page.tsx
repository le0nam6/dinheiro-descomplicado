import { getPostsByCategory } from '@/lib/sanity'
import { AdUnit } from '@/components/AdUnit'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const revalidate = 60

const slugToCategory: Record<string, string> = {
  'ganhar-dinheiro': 'ganhar dinheiro',
  'emprestimo': 'empréstimo',
  'investimentos': 'investimentos',
  'cartao-de-credito': 'cartão de crédito',
  'financiamento': 'financiamento',
  'previdencia': 'previdência',
  'educacao-financeira': 'educação financeira',
}

interface PillarInfo {
  title: string
  h1: string
  desc: string
  icon: string
  intro: string
  tool?: { title: string; href: string; emoji: string }
  faq: { q: string; a: string }[]
}

const pillars: Record<string, PillarInfo> = {
  'ganhar dinheiro': {
    title: 'Ganhar Dinheiro',
    h1: 'Ganhar Dinheiro em 2026: Renda Extra, MMO e Liberdade Financeira',
    desc: 'Renda extra, trabalhar pela internet (MMO), sair da CLT e construir liberdade financeira com mais de uma fonte de renda.',
    icon: '🚀',
    intro: 'Guardar e investir é metade do jogo — a outra metade é fazer entrar mais dinheiro. Aqui você encontra caminhos reais para criar renda extra, ganhar pela internet, empreender e, quem sabe, sair da CLT. Sem fórmula mágica e sem promessa de ficar rico da noite pro dia: só o que de fato funciona pra aumentar sua renda e comprar sua liberdade.',
    faq: [
      { q: 'Como começar a ter uma renda extra do zero?', a: 'Comece pelo que você já sabe fazer: freelas, serviços, venda de produtos ou conteúdo. O segredo é validar pequeno, com baixo custo, antes de escalar — e reinvestir os primeiros ganhos.' },
      { q: 'Dá pra ganhar dinheiro pela internet de verdade?', a: 'Sim, mas leva tempo e consistência. Freelancing, conteúdo, afiliados, produtos digitais e e-commerce são caminhos reais — fuja de qualquer promessa de "ganho rápido e garantido".' },
      { q: 'Quando vale a pena sair da CLT?', a: 'Quando sua renda alternativa já cobre seus custos essenciais por alguns meses e você tem reserva de emergência. Sair antes disso é risco; sair depois é estratégia.' },
    ],
  },
  'empréstimo': {
    title: 'Empréstimo',
    h1: 'Empréstimo em 2026: Guia Completo de Crédito Inteligente',
    desc: 'Tudo sobre empréstimo consignado, pessoal, FGTS e as melhores taxas do mercado em 2026.',
    icon: '💳',
    intro: 'Pegar dinheiro emprestado não precisa ser uma armadilha. Reunimos tudo o que você precisa saber para escolher o crédito mais barato, comparar taxas e nunca cair em ciladas. Do consignado ao empréstimo pessoal, aqui está o seu guia definitivo.',
    tool: { title: 'Calculadora de Consignado', href: '/ferramentas/calculadora-consignado', emoji: '💳' },
    faq: [
      { q: 'Qual o empréstimo com menor taxa de juros?', a: 'O empréstimo consignado tem as menores taxas do mercado (cerca de 1,7% ao mês), seguido pelo empréstimo com garantia. Sempre compare o CET antes de contratar.' },
      { q: 'Consigo empréstimo estando negativado?', a: 'Sim. O consignado não consulta o SPC/Serasa. Algumas fintechs também aprovam empréstimo pessoal para negativados, com taxas mais altas.' },
      { q: 'Vale a pena trocar dívida do cartão por empréstimo?', a: 'Vale se o empréstimo tiver juros menores que o rotativo do cartão (que pode passar de 400% ao ano). Trocar por consignado faz total sentido.' },
    ],
  },
  'investimentos': {
    title: 'Investimentos',
    h1: 'Investimentos em 2026: Do Primeiro Passo à Liberdade Financeira',
    desc: 'Renda fixa, Tesouro Direto, CDB, LCI/LCA e renda passiva — guias completos para todo perfil de investidor.',
    icon: '📈',
    intro: 'Investir é como você garante que seu dinheiro nunca pare de crescer. Não importa se você tem R$30 ou R$30 mil — aqui você encontra o caminho completo, do Tesouro Selic à construção de renda passiva, explicado de forma que qualquer um entende.',
    tool: { title: 'Calculadora de Investimentos', href: '/ferramentas/calculadora-juros', emoji: '📈' },
    faq: [
      { q: 'Qual o melhor investimento para iniciantes?', a: 'O Tesouro Selic é o melhor ponto de partida: seguro, líquido e acessível a partir de R$30. Ideal para montar a reserva de emergência.' },
      { q: 'Quanto preciso para começar a investir?', a: 'Você pode começar com R$30 no Tesouro Direto ou menos em alguns CDBs. O importante é a constância dos aportes, não o valor inicial.' },
      { q: 'O que rende mais que a poupança?', a: 'Tesouro Selic, CDBs de bancos digitais e LCI/LCA rendem mais que a poupança com segurança parecida (FGC ou garantia do governo).' },
    ],
  },
  'cartão de crédito': {
    title: 'Cartão de Crédito',
    h1: 'Cartão de Crédito em 2026: Sem Anuidade, Cashback e Mais',
    desc: 'Os melhores cartões sem anuidade, cashback, opções para negativados e como usar o cartão a seu favor.',
    icon: '🏦',
    intro: 'Usado com inteligência, o cartão de crédito é uma ferramenta poderosa — cashback, prazo para pagar e construção de score. Usado errado, vira bola de neve. Aqui você aprende a escolher o cartão certo e a usar sem nunca pagar juros.',
    tool: { title: 'Simulador de Quitação de Dívidas', href: '/ferramentas/simulador-dividas', emoji: '🔴' },
    faq: [
      { q: 'Qual o melhor cartão sem anuidade?', a: 'Nubank e Inter são os mais fáceis de aprovar e têm apps excelentes. PicPay e Inter lideram em cashback. Todos sem anuidade.' },
      { q: 'Existe cartão para quem está negativado?', a: 'Sim. Cartões com garantia (caução) aprovam quase sempre, mesmo negativado, e ajudam a reconstruir o score.' },
      { q: 'Como não pagar juros no cartão?', a: 'Pague sempre a fatura integral até o vencimento. Nunca entre no rotativo nem pague apenas o mínimo — os juros são os mais altos do mercado.' },
    ],
  },
  'financiamento': {
    title: 'Financiamento',
    h1: 'Financiamento em 2026: Imóvel e Veículo com as Melhores Taxas',
    desc: 'Guias e simulações de financiamento imobiliário, veículo, consórcio e uso do FGTS.',
    icon: '🏠',
    intro: 'A casa própria ou o carro novo passam, quase sempre, por um financiamento. Uma boa escolha aqui economiza dezenas de milhares de reais. Reunimos os comparativos de taxas, SAC vs Price, consórcio vs financiamento e como usar o FGTS a seu favor.',
    tool: { title: 'Calculadora de Consignado', href: '/ferramentas/calculadora-consignado', emoji: '💳' },
    faq: [
      { q: 'SAC ou Price: qual paga menos juros?', a: 'O SAC paga menos juros no total, pois amortiza o principal mais rápido. As parcelas começam mais altas e diminuem com o tempo.' },
      { q: 'Posso usar o FGTS no financiamento?', a: 'Sim, com pelo menos 3 anos de trabalho sob o FGTS, imóvel residencial urbano e sem outro imóvel na mesma cidade. Serve para entrada, amortização ou abatimento.' },
      { q: 'Consórcio é melhor que financiamento?', a: 'Consórcio não tem juros (só taxa de administração) e sai mais barato, mas você espera a contemplação. Financiamento dá acesso imediato com juros.' },
    ],
  },
  'previdência': {
    title: 'Previdência',
    h1: 'Previdência Privada em 2026: PGBL, VGBL e Aposentadoria',
    desc: 'Como planejar sua aposentadoria com previdência privada, a diferença entre PGBL e VGBL e quanto investir.',
    icon: '📊',
    intro: 'O INSS dificilmente será suficiente para manter seu padrão de vida na aposentadoria. A previdência privada e os investimentos de longo prazo são como você garante tranquilidade no futuro. Entenda as opções e monte seu plano.',
    tool: { title: 'Calculadora de Investimentos', href: '/ferramentas/calculadora-juros', emoji: '📈' },
    faq: [
      { q: 'PGBL ou VGBL: qual escolher?', a: 'PGBL para quem declara IR completo (deduz até 12% da renda). VGBL para quem declara simplificado ou é isento. A diferença é tributária.' },
      { q: 'Vale a pena previdência privada?', a: 'Vale para disciplina de longo prazo e benefício fiscal (PGBL). Mas atenção às taxas de administração — fundos caros corroem o rendimento.' },
      { q: 'Quanto preciso para me aposentar?', a: 'Depende da renda mensal desejada. Para R$5.000/mês de renda passiva, é preciso acumular cerca de R$750 mil a um rendimento conservador.' },
    ],
  },
  'educação financeira': {
    title: 'Educação Financeira',
    h1: 'Educação Financeira em 2026: Organize e Multiplique seu Dinheiro',
    desc: 'Score, orçamento, reserva de emergência, como sair das dívidas e os hábitos que constroem riqueza.',
    icon: '📚',
    intro: 'Tudo começa aqui. Antes de investir ou pegar crédito, você precisa dominar o básico: orçamento, reserva de emergência, score e como sair das dívidas. Esta é a base de quem constrói patrimônio que dura para sempre.',
    tool: { title: 'Simulador de Quitação de Dívidas', href: '/ferramentas/simulador-dividas', emoji: '🔴' },
    faq: [
      { q: 'Por onde começar a organizar minhas finanças?', a: 'Comece montando uma reserva de emergência e quitando dívidas de juros altos. Depois, crie um orçamento e só então parta para investimentos.' },
      { q: 'Como aumentar meu score de crédito?', a: 'Pague contas em dia, quite dívidas antigas, ative o Cadastro Positivo e use cartão com responsabilidade. O score sobe em alguns meses.' },
      { q: 'Qual o valor ideal da reserva de emergência?', a: 'Entre 3 e 6 meses de despesas para CLT, e 6 a 12 meses para autônomos. Guarde no Tesouro Selic ou CDB com liquidez diária.' },
    ],
  },
}

type Post = {
  title: string
  slug: { current: string }
  publishedAt: string
  funnel: string
  category: string
  excerpt: string
  coverImage?: { url: string; alt: string }
  readingTime?: number
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const category = slugToCategory[slug]
  if (!category) return {}
  const p = pillars[category]
  return { title: p?.h1, description: p?.desc }
}

export default async function PillarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const category = slugToCategory[slug]
  if (!category) notFound()

  const posts: Post[] = await getPostsByCategory(category)
  const p = pillars[category]
  const featured = posts[0]
  const rest = posts.slice(1)

  return (
    <div className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-green-700">Início</Link>
        {' › '}<span className="text-gray-600">{p.title}</span>
      </nav>

      {/* Hero pillar */}
      <div className="mb-8">
        <p className="text-4xl mb-2">{p.icon}</p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3 leading-tight">{p.h1}</h1>
        <p className="text-lg text-gray-600 leading-relaxed">{p.intro}</p>
      </div>

      {/* Ferramenta relacionada */}
      {p.tool && (
        <Link href={p.tool.href} className="flex items-center justify-between gap-4 bg-gradient-to-br from-green-700 to-emerald-600 rounded-2xl p-5 mb-8 text-white hover:shadow-lg transition-shadow">
          <div>
            <p className="text-xs font-semibold text-green-200 mb-0.5">FERRAMENTA GRATUITA</p>
            <p className="font-bold">{p.tool.emoji} {p.tool.title}</p>
          </div>
          <span className="shrink-0 bg-white text-green-700 font-bold text-sm px-4 py-2 rounded-full">Usar →</span>
        </Link>
      )}

      <AdUnit slot="1234567890" format="horizontal" />

      {posts.length === 0 ? (
        <div className="text-center py-16 text-gray-400 border border-dashed border-gray-200 rounded-xl mt-6">
          <p className="text-4xl mb-3">📝</p>
          <p className="font-medium">Em breve artigos nesta editoria.</p>
        </div>
      ) : (
        <>
          {/* Destaque */}
          {featured && (
            <section className="mt-8 mb-10">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Leitura essencial</h2>
              <Link href={`/blog/${featured.slug.current}`} className="group block border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                {featured.coverImage?.url && (
                  <img src={featured.coverImage.url} alt={featured.coverImage.alt} className="w-full h-52 object-cover" />
                )}
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 text-xl mb-2 group-hover:text-green-700 transition-colors">{featured.title}</h3>
                  <p className="text-gray-500 text-sm line-clamp-2">{featured.excerpt}</p>
                </div>
              </Link>
            </section>
          )}

          {/* Todos os artigos da editoria */}
          {rest.length > 0 && (
            <section className="mb-10">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Todos os artigos de {p.title}</h2>
              <div className="divide-y divide-gray-100">
                {rest.map(post => (
                  <Link key={post.slug.current} href={`/blog/${post.slug.current}`} className="flex gap-4 py-4 group hover:bg-gray-50 -mx-3 px-3 rounded-xl transition-colors">
                    {post.coverImage?.url ? (
                      <img src={post.coverImage.url} alt={post.coverImage.alt} className="w-24 h-18 object-cover rounded-lg shrink-0" style={{ height: 72 }} />
                    ) : (
                      <div className="w-24 shrink-0 bg-gradient-to-br from-green-100 to-emerald-200 rounded-lg flex items-center justify-center text-xl" style={{ height: 72 }}>💰</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-green-700 transition-colors">{post.title}</h3>
                      <p className="text-gray-500 text-xs mt-1 line-clamp-1">{post.excerpt}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* FAQ da editoria (SEO + People Also Ask) */}
          <section className="mb-10">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Perguntas frequentes sobre {p.title}</h2>
            <div className="space-y-3">
              {p.faq.map((item, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-4">
                  <p className="font-bold text-gray-900 text-sm flex items-start gap-2">
                    <span className="text-green-600">?</span>{item.q}
                  </p>
                  <p className="text-gray-600 text-sm mt-1.5 pl-5">{item.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ Schema para o Google */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: p.faq.map(item => ({
                  '@type': 'Question',
                  name: item.q,
                  acceptedAnswer: { '@type': 'Answer', text: item.a },
                })),
              }),
            }}
          />
        </>
      )}
    </div>
  )
}
