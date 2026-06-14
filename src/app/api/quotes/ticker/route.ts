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
    const result = d.chart.result[0]
    const m = result.meta
    const price: number = m.regularMarketPrice
    const prev: number = m.previousClose ?? m.chartPreviousClose
    const rawCloses: (number | null)[] = result.indicators?.quote?.[0]?.close ?? []
    const closes = rawCloses.filter((v): v is number => v != null).slice(-30)
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
