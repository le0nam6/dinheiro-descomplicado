/**
 * Cotações ao vivo: moedas + cripto (AwesomeAPI) e índices/bolsas (Yahoo Finance).
 * Cache de 5 min. Tudo grátis e sem chave.
 */
import { NextResponse } from 'next/server'

export const revalidate = 300

type Quote = { symbol: string; label: string; price: number; changePct: number; kind: string }

async function getFxCrypto(): Promise<Quote[]> {
  const pairs = 'USD-BRL,EUR-BRL,GBP-BRL,BTC-BRL,ETH-BRL'
  const res = await fetch(`https://economia.awesomeapi.com.br/json/last/${pairs}`, { next: { revalidate: 300 } })
  const data = await res.json()
  const map: Record<string, { label: string; kind: string }> = {
    USDBRL: { label: 'Dólar', kind: 'moeda' },
    EURBRL: { label: 'Euro', kind: 'moeda' },
    GBPBRL: { label: 'Libra', kind: 'moeda' },
    BTCBRL: { label: 'Bitcoin', kind: 'cripto' },
    ETHBRL: { label: 'Ethereum', kind: 'cripto' },
  }
  return Object.entries(map).map(([k, m]) => {
    const q = data[k]
    return q ? { symbol: k, label: m.label, price: Number(q.bid), changePct: Number(q.pctChange), kind: m.kind } : null
  }).filter(Boolean) as Quote[]
}

async function getIndices(): Promise<Quote[]> {
  const idx = [
    { sym: '^BVSP', label: 'Ibovespa' },
    { sym: '^GSPC', label: 'S&P 500' },
    { sym: '^IXIC', label: 'Nasdaq' },
    { sym: '^DJI', label: 'Dow Jones' },
  ]
  const out = await Promise.allSettled(idx.map(async ({ sym, label }) => {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 300 },
    })
    const d = await res.json()
    const m = d.chart.result[0].meta
    const price = m.regularMarketPrice
    const prev = m.previousClose ?? m.chartPreviousClose
    return { symbol: sym, label, price, changePct: ((price - prev) / prev) * 100, kind: 'indice' } as Quote
  }))
  return out.filter(r => r.status === 'fulfilled').map(r => (r as PromiseFulfilledResult<Quote>).value)
}

export async function GET() {
  try {
    const [fx, idx] = await Promise.all([getFxCrypto(), getIndices()])
    return NextResponse.json({ ok: true, updatedAt: new Date().toISOString(), quotes: [...fx, ...idx] })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
