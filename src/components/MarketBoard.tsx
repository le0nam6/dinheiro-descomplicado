'use client'
import { useEffect, useState } from 'react'

type Quote = { symbol: string; label: string; price: number; changePct: number; kind: string }

function fmtPrice(q: Quote) {
  const big = q.price >= 1000
  const v = big ? q.price.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) : q.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return (q.kind === 'moeda' || q.kind === 'cripto') ? `R$ ${v}` : v
}

const GROUPS: { key: string; title: string }[] = [
  { key: 'moeda', title: '💱 Moedas' },
  { key: 'cripto', title: '🪙 Criptomoedas' },
  { key: 'indice', title: '📈 Índices e Bolsas' },
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
    <div className="space-y-6">
      {GROUPS.map(g => {
        const items = quotes.filter(q => q.kind === g.key)
        if (!items.length) return null
        return (
          <div key={g.key}>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">{g.title}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {items.map(q => {
                const up = q.changePct >= 0
                return (
                  <div key={q.symbol} className="border border-gray-200 rounded-xl p-4 bg-white">
                    <p className="text-sm text-gray-500">{q.label}</p>
                    <p className="text-xl font-bold text-gray-900">{fmtPrice(q)}</p>
                    <p className={`text-sm font-semibold ${up ? 'text-green-600' : 'text-red-500'}`}>
                      {up ? '▲' : '▼'} {Math.abs(q.changePct).toFixed(2)}%
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
      {updated && <p className="text-xs text-gray-400">Atualizado às {updated} · atualiza a cada 2 min</p>}
    </div>
  )
}
