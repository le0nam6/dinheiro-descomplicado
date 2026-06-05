import { getPosts } from '@/lib/sanity'
import { PostCard } from '@/components/PostCard'
import { AdUnit } from '@/components/AdUnit'

export const revalidate = 3600

const categories = [
  { label: '💳 Empréstimo', href: '/categoria/emprestimo', desc: 'Consignado, pessoal, FGTS' },
  { label: '🏦 Investimentos', href: '/categoria/investimentos', desc: 'Renda fixa, ações, fundos' },
  { label: '💳 Cartão de Crédito', href: '/categoria/cartao-de-credito', desc: 'Cashback, milhas, sem anuidade' },
  { label: '🏠 Financiamento', href: '/categoria/financiamento', desc: 'Imóvel, veículo, simulação' },
  { label: '📊 Previdência', href: '/categoria/previdencia', desc: 'PGBL, VGBL, aposentadoria' },
  { label: '📚 Educação Financeira', href: '/categoria/educacao-financeira', desc: 'Score, orçamento, hábitos' },
]

export default async function Home() {
  const posts = await getPosts(9)

  return (
    <>
      {/* Hero */}
      <section className="text-center py-12 mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
          Finanças que <span className="text-green-700">qualquer um entende</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto">
          Empréstimo, cartão, investimento e crédito explicados sem enrolação. Atualizado 2x por dia.
        </p>
      </section>

      {/* Categorias */}
      <section className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
        {categories.map(cat => (
          <a key={cat.href} href={cat.href}
            className="border border-gray-200 rounded-xl p-4 hover:border-green-400 hover:shadow-sm transition-all bg-white">
            <div className="font-semibold text-gray-900">{cat.label}</div>
            <div className="text-xs text-gray-500 mt-1">{cat.desc}</div>
          </a>
        ))}
      </section>

      {/* Ad topo */}
      <AdUnit slot="1234567890" format="horizontal" />

      {/* Posts recentes */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Artigos recentes</h2>
        {posts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post: Parameters<typeof PostCard>[0]['post']) => (
              <PostCard key={post.slug.current} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400 border border-dashed border-gray-200 rounded-xl">
            <p className="text-4xl mb-3">📝</p>
            <p className="font-medium">Nenhum post publicado ainda.</p>
            <p className="text-sm mt-1">O pipeline de automação vai preencher isso em breve!</p>
          </div>
        )}
      </section>

      {/* Ad fundo */}
      <AdUnit slot="0987654321" className="mt-12" />
    </>
  )
}
