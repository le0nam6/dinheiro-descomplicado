import Link from 'next/link'

// Calculadora relacionada por categoria
const TOOL_MAP: Record<string, { title: string; href: string; emoji: string }> = {
  'empréstimo': { title: 'Calculadora de Empréstimo Consignado', href: '/ferramentas/calculadora-consignado', emoji: '💳' },
  'cartão de crédito': { title: 'Simulador de Quitação de Dívidas', href: '/ferramentas/simulador-dividas', emoji: '🔴' },
  'investimentos': { title: 'Calculadora de Investimentos', href: '/ferramentas/calculadora-juros', emoji: '📈' },
  'educação financeira': { title: 'Simulador de Quitação de Dívidas', href: '/ferramentas/simulador-dividas', emoji: '🔴' },
  'financiamento': { title: 'Calculadora de Empréstimo Consignado', href: '/ferramentas/calculadora-consignado', emoji: '💳' },
  'previdência': { title: 'Calculadora de Investimentos', href: '/ferramentas/calculadora-juros', emoji: '📈' },
}

type RelatedPost = { title: string; slug: { current: string } }

interface Props {
  category: string
  related: RelatedPost[]
}

export function ArticleCTA({ category, related }: Props) {
  const tool = TOOL_MAP[category]

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
    </div>
  )
}
