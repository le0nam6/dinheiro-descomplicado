import { NextResponse } from 'next/server'

export const runtime = 'edge'

type Result = { symbol: string; name: string; exchange: string; type: string }

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json({ results: [] })

  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&lang=pt-BR&region=BR&quotesCount=8&newsCount=0`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(5000) }
    )
    const d = await res.json()
    const items: Result[] = (d.quotes ?? [])
      .filter((x: { quoteType: string }) => ['EQUITY', 'ETF', 'MUTUALFUND', 'CRYPTOCURRENCY'].includes(x.quoteType))
      .slice(0, 6)
      .map((x: { symbol: string; longname?: string; shortname?: string; exchDisp?: string; quoteType: string }) => ({
        symbol: x.symbol,
        name: x.longname || x.shortname || x.symbol,
        exchange: x.exchDisp || '',
        type: x.quoteType,
      }))
    return NextResponse.json({ results: items })
  } catch {
    return NextResponse.json({ results: [] })
  }
}
