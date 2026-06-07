'use client'
import { useEffect, useState } from 'react'
import { IconCurrencyDollar, IconCoinBitcoin, IconChartLine, IconTrendingUp, IconTrendingDown } from '@tabler/icons-react'

type Quote = { symbol: string; label: string; price: number; changePct: number; kind: string }

function fmtPrice(q: Quote) {
  const big = q.price >= 1000
  const v = big ? q.price.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) : q.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return (q.kind === 'moeda' || q.kind === 'cripto') ? `R$ ${v}` : v
}

const SLUG: Record<string, string> = {
  USDBRL: 'dolar', EURBRL: 'euro', GBPBRL: 'libra', BTCBRL: 'bitcoin', ETHBRL: 'ethereum',
  '^BVSP': 'ibovespa', '^GSPC': 'sp500', '^IXIC': 'nasdaq', '^DJI': 'dow',
}

const GROUPS: { key: string; title: string; Icon: typeof IconChartLine }[] = [
  { key: 'moeda', title: 'Moedas', Icon: IconCurrencyDollar },
  { key: 'cripto', title: 'Criptomoedas', Icon: IconCoinBitcoin },
  { key: 'indice', title: 'Índices e Bolsas', Icon: IconChartLine },
]

export function MarketBoard() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [updated, setUpdated] = useState<string>('')

  useEffect(() => {
    let alive = true
    const load = () => fetch('/api/quotes').then(r => r.json()).then(d => {
      if (alive && d.ok) { setQuotes(d.quotes); setUpdated(new Date(d.updatedAt).toLocaleTimeString('pt-BR')) }
    }).catch(() => {})
    load()
    const t = setInterval(load, 120000)
    return () => { alive = false; clearInterval(t) }
  }, [])

  if (!quotes.length) return <div className="text-gray-400 text-sm py-6">Carregando cotações…</div>

  return (
    <div className="space-y-10">
      {GROUPS.map(g => {
        const items = quotes.filter(q => q.kind === g.key)
        if (!items.length) return null
        return (
          <div key={g.key}>
            <h3 className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
              <g.Icon size={18} stroke={1.75} className="text-green-600" /> {g.title}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {items.map(q => {
                const up = q.changePct >= 0
                const slug = SLUG[q.symbol]
                const card = (
                  <>
                    <p className="text-sm text-gray-500 mb-1">{q.label}</p>
                    <p className="text-2xl font-bold text-gray-900 tabular-nums">{fmtPrice(q)}</p>
                    <p className={`flex items-center gap-1 text-sm font-semibold mt-1 tabular-nums ${up ? 'text-green-600' : 'text-red-500'}`}>
                      {up ? <IconTrendingUp size={15} stroke={2} /> : <IconTrendingDown size={15} stroke={2} />}
                      {Math.abs(q.changePct).toFixed(2)}%
                    </p>
                  </>
                )
                return slug
                  ? <a key={q.symbol} href={`/cotacao/${slug}`} className="border border-gray-200 rounded-2xl p-5 bg-white hover:shadow-md hover:border-green-300 transition">{card}</a>
                  : <div key={q.symbol} className="border border-gray-200 rounded-2xl p-5 bg-white">{card}</div>
              })}
            </div>
          </div>
        )
      })}
      {updated && <p className="text-xs text-gray-400">Atualizado às {updated} · atualiza a cada 2 min</p>}
    </div>
  )
}
