'use client'
import { useEffect, useState } from 'react'

type Quote = { symbol: string; label: string; price: number; changePct: number; kind: string }

const SLUG: Record<string, string> = {
  USDBRL: 'dolar', EURBRL: 'euro', GBPBRL: 'libra', BTCBRL: 'bitcoin', ETHBRL: 'ethereum',
  '^BVSP': 'ibovespa', '^GSPC': 'sp500', '^IXIC': 'nasdaq', '^DJI': 'dow',
}

function fmt(q: Quote) {
  const isBig = q.price >= 1000
  const price = q.kind === 'indice' || isBig
    ? q.price.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
    : q.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const prefix = q.kind === 'moeda' || q.kind === 'cripto' ? 'R$ ' : ''
  return `${prefix}${price}`
}

export function QuotesTicker() {
  const [quotes, setQuotes] = useState<Quote[]>([])

  useEffect(() => {
    let alive = true
    const load = () => fetch('/api/quotes').then(r => r.json()).then(d => { if (alive && d.ok) setQuotes(d.quotes) }).catch(() => {})
    load()
    const t = setInterval(load, 300000) // 5 min
    return () => { alive = false; clearInterval(t) }
  }, [])

  if (!quotes.length) return null

  // duplica a lista p/ loop contínuo
  const items = [...quotes, ...quotes]

  return (
    <div className="bg-gray-900 text-white overflow-hidden border-b border-gray-800">
      <div className="flex whitespace-nowrap animate-[ticker_40s_linear_infinite] py-2">
        {items.map((q, i) => {
          const up = q.changePct >= 0
          const slug = SLUG[q.symbol]
          const inner = (
            <>
              <span className="text-gray-400 font-medium">{q.label}</span>
              <span className="font-semibold">{fmt(q)}</span>
              <span className={up ? 'text-green-400' : 'text-red-400'}>
                {up ? '▲' : '▼'} {Math.abs(q.changePct).toFixed(2)}%
              </span>
            </>
          )
          return slug
            ? <a key={i} href={`/cotacao/${slug}`} className="inline-flex items-center gap-1.5 px-4 text-sm shrink-0 hover:bg-gray-800 rounded">{inner}</a>
            : <span key={i} className="inline-flex items-center gap-1.5 px-4 text-sm shrink-0">{inner}</span>
        })}
      </div>
      <style>{`@keyframes ticker { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }`}</style>
    </div>
  )
}
