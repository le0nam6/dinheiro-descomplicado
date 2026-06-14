import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const symbol = new URL(req.url).searchParams.get('symbol')?.trim()
  if (!symbol) return NextResponse.json({ ok: false }, { status: 400 })

  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(6000) }
    )
    const d = await res.json()
    const m = d.chart.result[0].meta
    const price: number = m.regularMarketPrice
    const prev: number = m.previousClose ?? m.chartPreviousClose
    return NextResponse.json({
      ok: true,
      symbol,
      price,
      changePct: ((price - prev) / prev) * 100,
      currency: m.currency || 'BRL',
    })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
