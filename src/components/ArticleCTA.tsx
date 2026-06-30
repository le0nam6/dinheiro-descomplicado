import Link from 'next/link'

// Calculadora relacionada por categoria
const TOOL_MAP: Record<string, { title: string; href: string; emoji: string }> = {
  'empréstimo': { title: 'Calculadora de Empréstimo Consignado', href: '/ferramentas/calculadora-consignado', emoji: '💳' },
  'cartão de crédito': { title: 'Simulador de Quitação de Dívidas', href: '/ferramentas/simulador-dividas', emoji: '🔴' },
  'investimentos': { title: 'Calculadora de Investimentos', href: '/ferramentas/calculadora-juros', emoji: '📈' },
  'educação financeira': { title: 'Simulador de Quitação de Dívidas', href: '/ferramentas/simulador-dividas', emoji: '🔴' },
  'financiamento': { title: 'Calculadora de Empréstimo Consignado', href: '/ferramentas/calculadora-consignado', emoji: '💳' },
  'previdência': { title: 'Calculadora de Investimentos', href: '/ferramentas/calculadora-juros', emoji: '📈' },
  'notícias': { title: 'Calculadora de Investimentos', href: '/ferramentas/calculadora-juros', emoji: '📈' },
  'economia': { title: 'Calculadora de Investimentos', href: '/ferramentas/calculadora-juros', emoji: '📈' },
}

// Glossário relevante por categoria
const GLOSSARIO_MAP: Record<string, { name: string; slug: string }[]> = {
  'investimentos': [
    { name: 'Renda fixa', slug: 'renda-fixa' },
    { name: 'Renda variável', slug: 'renda-variavel' },
    { name: 'CDI', slug: 'cdi' },
    { name: 'Selic', slug: 'selic' },
    { name: 'Liquidez', slug: 'liquidez' },
    { name: 'Diversificação', slug: 'diversificacao' },
  ],
  'educação financeira': [
    { name: 'Fundo de emergência', slug: 'fundo-de-emergencia' },
    { name: 'Juros compostos', slug: 'juros-compostos' },
    { name: 'Rentabilidade líquida', slug: 'rentabilidade-liquida' },
    { name: 'Score de crédito', slug: 'score-de-credito' },
  ],
  'empréstimo': [
    { name: 'Score de crédito', slug: 'score-de-credito' },
    { name: 'Nome negativado', slug: 'nome-negativado' },
    { name: 'Portabilidade de crédito', slug: 'portabilidade-credito' },
    { name: 'IOF', slug: 'iof' },
  ],
  'cartão de crédito': [
    { name: 'Score de crédito', slug: 'score-de-credito' },
    { name: 'Cheque especial', slug: 'cheque-especial' },
    { name: 'IOF', slug: 'iof' },
    { name: 'Nome negativado', slug: 'nome-negativado' },
  ],
  'financiamento': [
    { name: 'Score de crédito', slug: 'score-de-credito' },
    { name: 'IPCA', slug: 'ipca' },
    { name: 'Juros compostos', slug: 'juros-compostos' },
    { name: 'IOF', slug: 'iof' },
  ],
  'previdência': [
    { name: 'PGBL e VGBL', slug: 'pgbl-vgbl' },
    { name: 'Diversificação', slug: 'diversificacao' },
    { name: 'Rentabilidade líquida', slug: 'rentabilidade-liquida' },
    { name: 'Come-cotas', slug: 'come-cotas' },
  ],
  'notícias': [
    { name: 'Selic', slug: 'selic' },
    { name: 'IPCA', slug: 'ipca' },
    { name: 'CDI', slug: 'cdi' },
  ],
  'economia': [
    { name: 'Selic', slug: 'selic' },
    { name: 'IPCA', slug: 'ipca' },
    { name: 'CDI', slug: 'cdi' },
  ],
}

// Guias relevantes por categoria
const GUIAS_MAP: Record<string, { title: string; href: string }[]> = {
  'investimentos': [
    { title: 'Como começar a investir do zero', href: '/guias/como-investir-do-zero' },
    { title: 'Como montar o fundo de emergência', href: '/guias/fundo-de-emergencia' },
  ],
  'educação financeira': [
    { title: 'Como montar o fundo de emergência', href: '/guias/fundo-de-emergencia' },
    { title: 'Como começar a investir do zero', href: '/guias/como-investir-do-zero' },
  ],
  'empréstimo': [
    { title: 'Como aumentar o score de crédito', href: '/guias/score-de-credito' },
    { title: 'Como montar o fundo de emergência', href: '/guias/fundo-de-emergencia' },
  ],
  'cartão de crédito': [
    { title: 'Como aumentar o score de crédito', href: '/guias/score-de-credito' },
  ],
  'financiamento': [
    { title: 'Como aumentar o score de crédito', href: '/guias/score-de-credito' },
    { title: 'Como começar a investir do zero', href: '/guias/como-investir-do-zero' },
  ],
  'previdência': [
    { title: 'Como começar a investir do zero', href: '/guias/como-investir-do-zero' },
  ],
  'notícias': [
    { title: 'Como começar a investir do zero', href: '/guias/como-investir-do-zero' },
    { title: 'Como montar o fundo de emergência', href: '/guias/fundo-de-emergencia' },
  ],
  'economia': [
    { title: 'Como começar a investir do zero', href: '/guias/como-investir-do-zero' },
    { title: 'Como montar o fundo de emergência', href: '/guias/fundo-de-emergencia' },
  ],
}

type RelatedPost = { title: string; slug: { current: string } }

interface Props {
  category: string
  related: RelatedPost[]
}

export function ArticleCTA({ category, related }: Props) {
  const tool = TOOL_MAP[category]
  const glossarioTerms = GLOSSARIO_MAP[category] ?? []
  const guias = GUIAS_MAP[category] ?? []

  return (
    <div className="space-y-5 mt-10 pt-8 border-t border-gray-100">
      {/* CTA Ferramenta */}
      {tool && (
        <div className="bg-gradient-to-br from-green-700 to-emerald-600 rounded-2xl p-5 text-white">
          <p className="text-xs font-semibold text-green-200 mb-1">FERRAMENTA GRATUITA</p>
          <p className="font-bold text-lg mb-1">{tool.emoji} {tool.title}</p>
          <p className="text-sm text-green-100 mb-4">Simule agora com os dados do seu bolso. Resultado imediato.</p>
          <Link href={tool.href} className="inline-block bg-white text-green-700 font-bold text-sm px-5 py-2.5 rounded-full hover:bg-green-50 transition-colors">
            Usar calculadora →
          </Link>
        </div>
      )}

      {/* Guias relacionados */}
      {guias.length > 0 && (
        <div>
          <p className="font-bold text-gray-900 text-sm mb-3">🗺️ Guias relacionados</p>
          <div className="grid gap-2">
            {guias.map(g => (
              <Link key={g.href} href={g.href} className="flex items-center justify-between text-sm border border-gray-200 rounded-xl px-4 py-3 hover:border-green-300 hover:text-green-700 transition-colors group">
                <span>{g.title}</span>
                <span className="text-gray-400 group-hover:text-green-600 shrink-0 ml-2">→</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Glossário relevante */}
      {glossarioTerms.length > 0 && (
        <div>
          <p className="font-bold text-gray-900 text-sm mb-3">📖 Termos do glossário</p>
          <div className="flex flex-wrap gap-2">
            {glossarioTerms.map(t => (
              <Link key={t.slug} href={`/glossario/${t.slug}`} className="text-xs font-medium px-3 py-1.5 border border-gray-200 rounded-full hover:border-green-400 hover:text-green-700 transition-colors">
                {t.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Links internos dinâmicos */}
      {related.length > 0 && (
        <div>
          <p className="font-bold text-gray-900 text-sm mb-3">📚 Continue lendo</p>
          <div className="grid gap-2">
            {related.map(r => (
              <Link key={r.slug.current} href={`/blog/${r.slug.current}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-green-700 p-2 rounded-lg hover:bg-green-50 transition-colors group">
                <span className="text-green-500 group-hover:translate-x-0.5 transition-transform">→</span>
                <span>{r.title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Hub de ferramentas */}
      <div className="border border-gray-200 rounded-2xl p-4 text-sm flex items-center justify-between gap-4">
        <div>
          <p className="font-bold text-gray-900">🧰 Mais ferramentas financeiras</p>
          <p className="text-gray-500 text-xs mt-0.5">Calculadoras gratuitas de investimentos, dívidas e muito mais.</p>
        </div>
        <Link href="/ferramentas" className="shrink-0 text-xs font-bold text-green-700 border border-green-300 px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors">
          Ver todas
        </Link>
      </div>
    </div>
  )
}
