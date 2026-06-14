'use client'
import { useEffect, useState, useRef } from 'react'
import { IconTrendingUp, IconTrendingDown, IconSearch, IconX } from '@tabler/icons-react'

type Quote = { symbol: string; label: string; price: number; changePct: number; kind: string }
type SearchResult = { symbol: string; name: string; exchange: string; type: string }
type ChartData = { price: number; changePct: number; currency: string; closes: number[] }

const RANGES = [
  { label: '1D', value: '1d' },
  { label: '5D', value: '5d' },
  { label: '1M', value: '1mo' },
  { label: '3M', value: '3mo' },
  { label: '6M', value: '6mo' },
  { label: '1A', value: '1y' },
]

function fmtPrice(price: number, brl: boolean) {
  const v = price >= 1000
    ? price.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
    : price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return brl ? `R$ ${v}` : v
}

function LineChart({ closes, up, symbol }: { closes: number[]; up: boolean; symbol: string }) {
  if (closes.length < 2) return null
  const W = 600, H = 120
  const min = Math.min(...closes)
  const max = Math.max(...closes)
  const range = max - min || 1
  const pad = 4

  const pts = closes.map((c, i) => ({
    x: (i / (closes.length - 1)) * W,
    y: pad + (H - pad * 2) - ((c - min) / range) * (H - pad * 2),
  }))

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const fillPath = `${linePath} L${W},${H} L0,${H} Z`
  const color = up ? '#16a34a' : '#ef4444'
  const gradId = `grad-${symbol.replace(/[^a-z0-9]/gi, '')}`

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="block w-full"
      style={{ height: 140 }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
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
  return href ? <a href={href}>{inner}</a> : <div>{inner}</div>
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
  const [loadingSearch, setLoadingSearch] = useState(false)

  const [ticker, setTicker] = useState<{ symbol: string; name: string } | null>(null)
  const [range, setRange] = useState('1mo')
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [loadingChart, setLoadingChart] = useState(false)

  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Autocomplete — não busca quando um ticker já foi selecionado
  useEffect(() => {
    if (ticker) { setResults([]); return }
    if (query.length < 2) { setResults([]); return }
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(async () => {
      setLoadingSearch(true)
      try {
        const d = await fetch(`/api/quotes/search?q=${encodeURIComponent(query)}`).then(r => r.json())
        setResults(d.results || [])
      } catch { setResults([]) }
      setLoadingSearch(false)
    }, 350)
    return () => { if (debounce.current) clearTimeout(debounce.current) }
  }, [query, ticker])

  // Fetch chart when ticker or range changes
  useEffect(() => {
    if (!ticker) return
    let cancelled = false
    setLoadingChart(true)
    setChartData(null)
    fetch(`/api/quotes/ticker?symbol=${encodeURIComponent(ticker.symbol)}&range=${range}`)
      .then(r => r.json())
      .then(d => { if (!cancelled && d.ok) setChartData(d) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingChart(false) })
    return () => { cancelled = true }
  }, [ticker, range])

  function pickTicker(r: SearchResult) {
    setResults([])
    setQuery(r.name)
    setTicker({ symbol: r.symbol, name: r.name })
  }

  function clear() {
    setQuery(''); setResults([]); setTicker(null); setChartData(null)
  }

  const closes = chartData?.closes ?? []
  const periodChangePct = closes.length >= 2
    ? ((closes[closes.length - 1] - closes[0]) / closes[0]) * 100
    : (chartData?.changePct ?? 0)
  const up = periodChangePct >= 0
  const isBRL = chartData?.currency === 'BRL'

  return (
    <div className="mb-10">
      <h2 className="text-base font-bold text-gray-900 mb-1">Buscar empresa, FII ou ativo</h2>
      <p className="text-sm text-gray-500 mb-3">Digite o nome ou ticker (ex: Petrobras, KNRI11, AAPL)</p>

      {/* Input com autocomplete */}
      <div className="relative max-w-lg" style={{ isolation: 'isolate' }}>
        <div className="relative">
          <IconSearch size={16} stroke={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setTicker(null); setChartData(null) }}
            placeholder="Nome ou ticker..."
            className="w-full pl-9 pr-9 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
          />
          {query && (
            <button onClick={clear} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <IconX size={16} />
            </button>
          )}
        </div>

        {(results.length > 0 || (loadingSearch && query.length >= 2)) && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
            {loadingSearch && results.length === 0 && (
              <div className="px-4 py-3 text-sm text-gray-400">Buscando...</div>
            )}
            {results.map(r => (
              <button
                key={r.symbol}
                onMouseDown={e => { e.preventDefault(); pickTicker(r) }}
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
      </div>

      {/* Card do ticker selecionado */}
      {ticker && (loadingChart || chartData) && (
        <div className="mt-4 border border-gray-200 rounded-2xl bg-white shadow-sm overflow-hidden max-w-2xl">
          {/* Header: nome + preço + variação + filtros */}
          <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs text-gray-400 font-mono mb-0.5">{ticker.symbol}</p>
              <p className="font-bold text-gray-900 text-base leading-tight">{ticker.name}</p>
              {chartData && (
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-2xl font-extrabold text-gray-900 tabular-nums">
                    {isBRL ? 'R$ ' : `${chartData.currency} `}
                    {chartData.price >= 1000
                      ? chartData.price.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
                      : chartData.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className={`flex items-center gap-0.5 text-sm font-bold tabular-nums ${up ? 'text-green-600' : 'text-red-500'}`}>
                    {up ? <IconTrendingUp size={14} stroke={2} /> : <IconTrendingDown size={14} stroke={2} />}
                    {periodChangePct >= 0 ? '+' : ''}{periodChangePct.toFixed(2)}%
                  </span>
                </div>
              )}
              {loadingChart && !chartData && (
                <div className="mt-1.5 text-sm text-gray-400">Carregando...</div>
              )}
            </div>

            {/* Filtros de período */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              {RANGES.map(r => (
                <button
                  key={r.value}
                  onClick={() => setRange(r.value)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    range === r.value
                      ? 'bg-green-600 text-white'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Área do gráfico */}
          <div className="relative" style={{ height: 140 }}>
            {loadingChart && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400 bg-white">
                Carregando gráfico...
              </div>
            )}
            {!loadingChart && closes.length >= 2 && (
              <LineChart closes={closes} up={up} symbol={ticker.symbol} />
            )}
          </div>

          <p className="text-[11px] text-gray-400 text-right px-5 pb-3 pt-1">Fonte: Yahoo Finance · valores com atraso</p>
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
      <p className="text-sm text-gray-500 mb-8">
        Atualizado em tempo real · atualiza a cada 2 min
        {updated ? ` · última atualização às ${updated}` : ''}
      </p>

      <TickerSearch />

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
    </div>
  )
}
