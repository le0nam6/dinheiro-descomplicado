/**
 * Histórico de um ativo (proxy do Yahoo Finance) por período.
 * GET /api/quotes/history?symbol=USDBRL=X&range=1mo
 */
import { NextResponse } from 'next/server'

export const revalidate = 300

// período → range/interval do Yahoo (estilo Google Finance)
const RANGES: Record<string, { range: string; interval: string }> = {
  '1d':  { range: '1d',  interval: '5m' },
  '5d':  { range: '5d',  interval: '30m' },
  '1mo': { range: '1mo', interval: '1d' },
  '6mo': { range: '6mo', interval: '1d' },
  '1y':  { range: '1y',  interval: '1wk' },
  '5y':  { range: '5y',  interval: '1mo' },
  'max': { range: 'max', interval: '1mo' },
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')
  const period = searchParams.get('range') || '1mo'
  if (!symbol) return NextResponse.json({ error: 'symbol obrigatório' }, { status: 400 })
  const { range, interval } = RANGES[period] || RANGES['1mo']

  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 300 } }
    )
    const d = await res.json()
    const r = d.chart.result[0]
    const meta = r.meta
    const rawCloses: (number | null)[] = r.indicators.quote[0].close || []
    const rawTimes: number[] = r.timestamp || []
    const closes: number[] = []
    const times: number[] = []
    rawCloses.forEach((c, i) => { if (c != null) { closes.push(c); times.push(rawTimes[i]) } })
    const price = meta.regularMarketPrice ?? closes[closes.length - 1]
    const base = period === '1d' ? (meta.previousClose ?? meta.chartPreviousClose ?? closes[0]) : closes[0]
    return NextResponse.json({
      ok: true, price, changePct: base ? ((price - base) / base) * 100 : 0, closes, times,
    })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
