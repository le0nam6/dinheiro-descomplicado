import { NextResponse } from 'next/server'

const INTERVAL: Record<string, string> = {
  '1d': '5m', '5d': '15m', '1mo': '1d', '3mo': '1d', '6mo': '1wk', '1y': '1wk',
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const symbol = url.searchParams.get('symbol')?.trim()
  const range = url.searchParams.get('range') || '1mo'
  if (!symbol) return NextResponse.json({ ok: false }, { status: 400 })

  const interval = INTERVAL[range] ?? '1d'

  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000) }
    )
    const d = await res.json()
    const result = d.chart.result[0]
    const m = result.meta
    const price: number = m.regularMarketPrice
    const prev: number = m.previousClose ?? m.chartPreviousClose
    const rawCloses: (number | null)[] = result.indicators?.quote?.[0]?.close ?? []
    const closes = rawCloses.filter((v): v is number => v != null)
    return NextResponse.json({
      ok: true,
      symbol,
      price,
      changePct: ((price - prev) / prev) * 100,
      currency: m.currency || 'BRL',
      closes,
    })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
