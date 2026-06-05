import Link from 'next/link'

// Mapa de calculadoras por categoria e keyword
const TOOL_MAP: Record<string, { title: string; href: string; emoji: string }> = {
  'empréstimo': { title: 'Calculadora de Empréstimo Consignado', href: '/ferramentas/calculadora-consignado', emoji: '💳' },
  'cartão de crédito': { title: 'Calculadora de Investimentos', href: '/ferramentas/calculadora-juros', emoji: '📈' },
  'investimentos': { title: 'Calculadora de Juros Compostos', href: '/ferramentas/calculadora-juros', emoji: '📈' },
  'educação financeira': { title: 'Simulador de Quitação de Dívidas', href: '/ferramentas/simulador-dividas', emoji: '🔴' },
  'financiamento': { title: 'Calculadora de Empréstimo Consignado', href: '/ferramentas/calculadora-consignado', emoji: '💳' },
  'previdência': { title: 'Calculadora de Juros Compostos', href: '/ferramentas/calculadora-juros', emoji: '📈' },
}

// Posts relacionados por slug — links internos curados
const RELATED_MAP: Record<string, { title: string; href: string }[]> = {
  'emprestimo-consignado-2025': [
    { title: 'Empréstimo pessoal: conheça as taxas de 2026', href: '/blog/emprestimo-pessoal-2026' },
    { title: 'Como sair das dívidas em 7 passos', href: '/blog/como-sair-das-dividas' },
    { title: 'Como aumentar seu score de crédito', href: '/blog/score-credito-como-aumentar' },
  ],
  'emprestimo-pessoal-2026': [
    { title: 'Consignado: taxas muito menores', href: '/blog/emprestimo-consignado-2025' },
    { title: 'Como sair das dívidas em 7 passos', href: '/blog/como-sair-das-dividas' },
    { title: 'FGTS: use para quitar dívidas', href: '/blog/fgts-o-que-e-como-consultar-sacar' },
  ],
  'score-credito-como-aumentar': [
    { title: 'Cartões de crédito sem anuidade em 2026', href: '/blog/melhores-cartoes-sem-anuidade-2025' },
    { title: 'Cartão para negativado: opções reais', href: '/blog/cartao-de-credito-para-negativado' },
    { title: 'Como sair das dívidas em 7 passos', href: '/blog/como-sair-das-dividas' },
  ],
  'melhores-cartoes-sem-anuidade-2025': [
    { title: 'Score de crédito: como aumentar', href: '/blog/score-credito-como-aumentar' },
    { title: 'Cartão para negativado: opções reais', href: '/blog/cartao-de-credito-para-negativado' },
    { title: 'Como sair das dívidas', href: '/blog/como-sair-das-dividas' },
  ],
  'tesouro-direto-como-investir': [
    { title: 'Melhores CDBs de 2026', href: '/blog/melhores-cdbs-2026' },
    { title: 'LCI e LCA: investimento isento de IR', href: '/blog/lci-lca-o-que-e' },
    { title: 'Como investir com pouco dinheiro', href: '/blog/como-investir-com-pouco-dinheiro' },
  ],
  'melhores-cdbs-2026': [
    { title: 'Tesouro Direto: guia completo', href: '/blog/tesouro-direto-como-investir' },
    { title: 'LCI e LCA: sem pagar IR', href: '/blog/lci-lca-o-que-e' },
    { title: 'Selic alta: o que fazer', href: '/blog/selic-alta-2026-o-que-fazer-investimentos' },
  ],
  'lci-lca-o-que-e': [
    { title: 'Melhores CDBs de 2026', href: '/blog/melhores-cdbs-2026' },
    { title: 'Tesouro Direto: guia completo', href: '/blog/tesouro-direto-como-investir' },
    { title: 'Renda passiva: como construir', href: '/blog/renda-passiva-como-construir' },
  ],
  'reserva-de-emergencia-como-montar': [
    { title: 'Tesouro Selic: onde guardar a reserva', href: '/blog/tesouro-direto-como-investir' },
    { title: 'Juros compostos: o efeito bola de neve', href: '/blog/juros-compostos-como-funcionam' },
    { title: 'Como investir com pouco dinheiro', href: '/blog/como-investir-com-pouco-dinheiro' },
  ],
  'juros-compostos-como-funcionam': [
    { title: 'Reserva de emergência: o primeiro passo', href: '/blog/reserva-de-emergencia-como-montar' },
    { title: 'Tesouro Direto: guia completo', href: '/blog/tesouro-direto-como-investir' },
    { title: 'Como investir com pouco dinheiro', href: '/blog/como-investir-com-pouco-dinheiro' },
  ],
  'como-sair-das-dividas': [
    { title: 'Score de crédito: recupere sua pontuação', href: '/blog/score-credito-como-aumentar' },
    { title: 'Empréstimo consignado: troque dívida cara', href: '/blog/emprestimo-consignado-2025' },
    { title: 'Reserva de emergência: nunca volte à dívida', href: '/blog/reserva-de-emergencia-como-montar' },
  ],
  'renda-passiva-como-construir': [
    { title: 'Juros compostos: a matemática da riqueza', href: '/blog/juros-compostos-como-funcionam' },
    { title: 'Tesouro Direto: comece aqui', href: '/blog/tesouro-direto-como-investir' },
    { title: 'PGBL ou VGBL: previdência privada', href: '/blog/pgbl-ou-vgbl-qual-escolher' },
  ],
  'fgts-o-que-e-como-consultar-sacar': [
    { title: 'Financiamento imobiliário: use o FGTS', href: '/blog/financiamento-imobiliario-2026' },
    { title: 'Empréstimo consignado: alternativa barata', href: '/blog/emprestimo-consignado-2025' },
    { title: 'Reserva de emergência: onde guardar', href: '/blog/reserva-de-emergencia-como-montar' },
  ],
  'financiamento-imobiliario-2026': [
    { title: 'Consórcio ou financiamento: compare', href: '/blog/consorcio-ou-financiamento' },
    { title: 'FGTS: use na entrada do imóvel', href: '/blog/fgts-o-que-e-como-consultar-sacar' },
    { title: 'Empréstimo consignado: taxas baixas', href: '/blog/emprestimo-consignado-2025' },
  ],
}

interface Props {
  slug: string
  category: string
}

export function ArticleCTA({ slug, category }: Props) {
  const tool = TOOL_MAP[category]
  const related = RELATED_MAP[slug] ?? []

  return (
    <div className="space-y-5 mt-10 pt-8 border-t border-gray-100">

      {/* CTA Ferramenta */}
      {tool && (
        <div className="bg-gradient-to-br from-green-700 to-emerald-600 rounded-2xl p-5 text-white">
          <p className="text-xs font-semibold text-green-200 mb-1">FERRAMENTA GRATUITA</p>
          <p className="font-bold text-lg mb-1">{tool.emoji} {tool.title}</p>
          <p className="text-sm text-green-100 mb-4">Simule agora com os dados do seu bolso. Resultado imediato, sem cadastro prévio.</p>
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

      {/* Links internos */}
      {related.length > 0 && (
        <div>
          <p className="font-bold text-gray-900 text-sm mb-3">📚 Continue lendo</p>
          <div className="grid gap-2">
            {related.map(r => (
              <Link key={r.href} href={r.href} className="flex items-center gap-2 text-sm text-gray-700 hover:text-green-700 p-2 rounded-lg hover:bg-green-50 transition-colors group">
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
