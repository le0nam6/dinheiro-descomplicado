import Link from 'next/link'

// ─── CONFIGURE AQUI suas ofertas de afiliado ──────────────────────────────────
// Troque "href" pelo seu link de afiliado real (Rakuten, Awin, programas dos bancos).
// Deixe href vazio ('') para esconder a oferta até você ter o link.
type Offer = { nome: string; descricao: string; href: string; selo?: string }

const OFFERS: Record<string, Offer[]> = {
  'cartão de crédito': [
    { nome: 'Cartão sem anuidade', descricao: 'Cashback e aprovação rápida, 100% digital.', href: '', selo: 'Mais popular' },
    { nome: 'Cartão com cashback', descricao: 'Dinheiro de volta em todas as compras.', href: '' },
  ],
  'empréstimo': [
    { nome: 'Empréstimo consignado', descricao: 'As menores taxas do mercado, simulação grátis.', href: '', selo: 'Menor taxa' },
    { nome: 'Crédito com garantia', descricao: 'Use imóvel ou veículo e pague menos juros.', href: '' },
  ],
  'investimentos': [
    { nome: 'Abra conta em corretora', descricao: 'Tesouro, CDB e ações sem taxa de corretagem.', href: '', selo: 'Recomendado' },
    { nome: 'CDB de alta rentabilidade', descricao: 'Até 120% do CDI com garantia do FGC.', href: '' },
  ],
  'financiamento': [
    { nome: 'Simule seu financiamento', descricao: 'Compare taxas de vários bancos em 1 lugar.', href: '' },
  ],
  'previdência': [
    { nome: 'Plano de previdência', descricao: 'PGBL e VGBL com taxas baixas.', href: '' },
  ],
}

export function AffiliateBox({ category }: { category: string }) {
  const offers = (OFFERS[category] || []).filter(o => o.href) // só mostra se tiver link real

  if (offers.length === 0) return null

  return (
    <div className="my-8 border border-amber-200 bg-amber-50/50 rounded-2xl p-5">
      <p className="text-xs font-semibold text-amber-700 mb-1">OFERTAS RECOMENDADAS · PUBLICIDADE</p>
      <p className="font-bold text-gray-900 mb-4">Comece agora com nossos parceiros</p>
      <div className="space-y-3">
        {offers.map((o, i) => (
          <a
            key={i}
            href={o.href}
            target="_blank"
            rel="sponsored nofollow noopener"
            className="flex items-center justify-between gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:border-amber-400 hover:shadow-sm transition-all"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold text-gray-900 text-sm">{o.nome}</p>
                {o.selo && <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">{o.selo}</span>}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{o.descricao}</p>
            </div>
            <span className="shrink-0 bg-green-600 text-white font-bold text-xs px-4 py-2 rounded-full">Ver oferta →</span>
          </a>
        ))}
      </div>
      <p className="text-[11px] text-gray-400 mt-3">
        Podemos receber comissão por indicações, sem custo extra para você. Isso ajuda a manter o conteúdo gratuito. Veja nossa <Link href="/termos" className="underline">política</Link>.
      </p>
    </div>
  )
}
