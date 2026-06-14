'use client'
import { useEffect, useState, useRef } from 'react'
import { IconTrendingUp, IconTrendingDown, IconSearch, IconX } from '@tabler/icons-react'

type Quote = { symbol: string; label: string; price: number; changePct: number; kind: string }
type SearchResult = { symbol: string; name: string; exchange: string; type: string }
type TickerQuote = { symbol: string; name: string; price: number; changePct: number; currency: string }

function fmtPrice(price: number, brl: boolean) {
  const big = price >= 1000
  const v = big
    ? price.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
    : price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return brl ? `R$ ${v}` : v
}

function QuoteCard({ q, href }: { q: Quote; href?: string }) {
  const up = q.changePct >= 0
  const brl = q.kind === 'moeda' || q.kind === 'cripto'
  const inner = (
    <div className="border border-gray-200 rounded-2xl p-4 bg-white hover:shadow-md hover:border-green-300 transition-all h-full">
      <p className="text-sm text-gray-500 mb-1 truncate">{q.label}</p>
      <p className="text-xl font-bold text-gray-900 tabular-nums">{fmtPrice(q.price, brl)}</p>
      <p className={`flex items-center gap-1 text-sm font-semibold mt-1 tabular-nums ${up ? 'text-green-600' : 'text-red-500'}`}>
        {up ? <IconTrendingUp size={14} stroke={2} /> : <IconTrendingDown size={14} stroke={2} />}
        {Math.abs(q.changePct).toFixed(2)}%
      </p>
    </div>
  )
  return href
    ? <a href={href}>{inner}</a>
    : <div>{inner}</div>
}

const SLUG: Record<string, string> = {
  USDBRL: 'dolar', EURBRL: 'euro', GBPBRL: 'libra',
  BTCBRL: 'bitcoin', ETHBRL: 'ethereum',
  '^BVSP': 'ibovespa', '^GSPC': 'sp500', '^IXIC': 'nasdaq', '^DJI': 'dow',
}

const GROUPS = [
  { key: 'moeda', title: 'Moedas' },
  { key: 'cripto', title: 'Criptomoedas' },
  { key: 'indice', title: 'Índices e Bolsas' },
]

function TickerSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selected, setSelected] = useState<TickerQuote | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingQuote, setLoadingQuote] = useState(false)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(async () => {
      setLoading(true)
      try {
        const d = await fetch(`/api/quotes/search?q=${encodeURIComponent(query)}`).then(r => r.json())
        setResults(d.results || [])
      } catch { setResults([]) }
      setLoading(false)
    }, 350)
    return () => { if (debounce.current) clearTimeout(debounce.current) }
  }, [query])

  async function pickTicker(r: SearchResult) {
    setResults([])
    setQuery(r.name)
    setLoadingQuote(true)
    setSelected(null)
    try {
      const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(r.symbol)}?range=1d&interval=1d`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      })
      const d = await res.json()
      const m = d.chart.result[0].meta
      const price = m.regularMarketPrice
      const prev = m.previousClose ?? m.chartPreviousClose
      setSelected({
        symbol: r.symbol,
        name: r.name,
        price,
        changePct: ((price - prev) / prev) * 100,
        currency: m.currency || 'BRL',
      })
    } catch { setSelected(null) }
    setLoadingQuote(false)
  }

  function clear() { setQuery(''); setResults([]); setSelected(null) }

  const up = selected && selected.changePct >= 0
  const isBRL = selected?.currency === 'BRL'

  return (
    <div className="mt-12">
      <h2 className="text-base font-bold text-gray-900 mb-3">Buscar empresa ou FII</h2>
      <p className="text-sm text-gray-500 mb-4">Digite o nome ou ticker (ex: Petrobras, KNRI11, AAPL)</p>
      <div className="relative max-w-lg">
        <IconSearch size={16} stroke={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setSelected(null) }}
          placeholder="Nome ou ticker..."
          className="w-full pl-9 pr-9 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
        />
        {query && (
          <button onClick={clear} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <IconX size={16} />
          </button>
        )}

        {/* Dropdown de sugestões */}
        {results.length > 0 && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            {results.map(r => (
              <button
                key={r.symbol}
                onClick={() => pickTicker(r)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-green-50 transition-colors border-b border-gray-100 last:border-0"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{r.name}</p>
                  <p className="text-xs text-gray-400">{r.symbol} · {r.exchange}</p>
                </div>
                <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full ml-3 shrink-0">{r.type}</span>
              </button>
            ))}
          </div>
        )}
        {loading && query.length >= 2 && results.length === 0 && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm text-gray-400">
            Buscando...
          </div>
        )}
      </div>

      {/* Resultado do ticker selecionado */}
      {loadingQuote && (
        <div className="mt-4 text-sm text-gray-400">Carregando cotação...</div>
      )}
      {selected && (
        <div className="mt-4 inline-flex items-center gap-6 border border-gray-200 rounded-2xl p-5 bg-white shadow-sm">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">{selected.symbol}</p>
            <p className="font-bold text-gray-900 text-base leading-tight max-w-xs truncate">{selected.name}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-gray-900 tabular-nums">
              {isBRL ? 'R$ ' : `${selected.currency} `}
              {selected.price >= 1000
                ? selected.price.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
                : selected.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className={`flex items-center justify-end gap-1 text-sm font-semibold tabular-nums ${up ? 'text-green-600' : 'text-red-500'}`}>
              {up ? <IconTrendingUp size={14} stroke={2} /> : <IconTrendingDown size={14} stroke={2} />}
              {Math.abs(selected.changePct).toFixed(2)}%
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CotacoesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [updated, setUpdated] = useState('')

  useEffect(() => {
    let alive = true
    const load = () =>
      fetch('/api/quotes').then(r => r.json()).then(d => {
        if (alive && d.ok) { setQuotes(d.quotes); setUpdated(new Date(d.updatedAt).toLocaleTimeString('pt-BR')) }
      }).catch(() => {})
    load()
    const t = setInterval(load, 120000)
    return () => { alive = false; clearInterval(t) }
  }, [])

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Cotações</h1>
      <p className="text-sm text-gray-500 mb-8">Atualizado em tempo real · atualiza a cada 2 min{updated ? ` · última atualização às ${updated}` : ''}</p>

      {!quotes.length && (
        <div className="text-gray-400 text-sm py-10">Carregando cotações…</div>
      )}

      {GROUPS.map(g => {
        const items = quotes.filter(q => q.kind === g.key)
        if (!items.length) return null
        return (
          <div key={g.key} className="mb-10">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">{g.title}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {items.map(q => (
                <QuoteCard key={q.symbol} q={q} href={SLUG[q.symbol] ? `/cotacao/${SLUG[q.symbol]}` : undefined} />
              ))}
            </div>
          </div>
        )
      })}

      <TickerSearch />
    </div>
  )
}
