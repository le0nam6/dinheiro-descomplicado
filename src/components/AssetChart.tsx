'use client'
import { useEffect, useState } from 'react'

const PERIODS: { key: string; label: string }[] = [
  { key: '1d', label: '1D' },
  { key: '5d', label: '5D' },
  { key: '1mo', label: '1M' },
  { key: '6mo', label: '6M' },
  { key: '1y', label: '1A' },
  { key: '5y', label: '5A' },
  { key: 'max', label: 'Máx' },
]

type Data = { price: number; changePct: number; closes: number[] }

function Chart({ data }: { data: number[] }) {
  if (data.length < 2) return <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Sem dados para o período.</div>
  const w = 700, h = 200, pad = 10
  const min = Math.min(...data), max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - 2 * pad)
    const y = h - pad - ((v - min) / range) * (h - 2 * pad)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  const up = data[data.length - 1] >= data[0]
  const color = up ? '#16a34a' : '#ef4444'
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-48" preserveAspectRatio="none">
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points={`${pad},${h - pad} ${pts.join(' ')} ${w - pad},${h - pad}`} fill={color} opacity="0.08" />
    </svg>
  )
}

export function AssetChart({ symbol, brl, initial }: { symbol: string; brl: boolean; initial: Data }) {
  const [period, setPeriod] = useState('1mo')
  const [data, setData] = useState<Data>(initial)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (period === '1mo') { setData(initial); return }
    let alive = true
    setLoading(true)
    fetch(`/api/quotes/history?symbol=${encodeURIComponent(symbol)}&range=${period}`)
      .then(r => r.json())
      .then(d => { if (alive && d.ok) setData({ price: d.price, changePct: d.changePct, closes: d.closes }) })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [period, symbol, initial])

  const up = data.changePct >= 0
  const big = data.price >= 1000
  const priceFmt = data.price.toLocaleString('pt-BR', { minimumFractionDigits: big ? 0 : 2, maximumFractionDigits: big ? 0 : (brl ? 4 : 2) })
  const periodLabel = PERIODS.find(p => p.key === period)?.label

  return (
    <div className="border border-gray-200 rounded-2xl p-6 bg-white">
      <div className="flex items-end justify-between mb-4">
        <div>
          <p className="text-4xl font-extrabold text-gray-900 tabular-nums">{brl ? 'R$ ' : ''}{priceFmt}</p>
          <p className={`text-lg font-semibold tabular-nums ${up ? 'text-green-600' : 'text-red-500'}`}>
            {up ? '▲' : '▼'} {Math.abs(data.changePct).toFixed(2)}% <span className="text-gray-400 font-normal text-sm">· {periodLabel}</span>
          </p>
        </div>
      </div>

      <div className={loading ? 'opacity-40 transition-opacity' : 'transition-opacity'}>
        <Chart data={data.closes} />
      </div>

      <div className="flex flex-wrap gap-1.5 mt-4">
        {PERIODS.map(p => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              period === p.key ? 'bg-green-600 text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}
