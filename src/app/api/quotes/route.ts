/**
 * Cotações ao vivo: moedas + cripto (AwesomeAPI) e índices/bolsas (Yahoo Finance).
 * Cache de 5 min. Tudo grátis e sem chave.
 */
import { NextResponse } from 'next/server'

export const revalidate = 300

type Quote = { symbol: string; label: string; price: number; changePct: number; kind: string }

async function getFxCrypto(): Promise<Quote[]> {
  // 1. AwesomeAPI (preferida — traz % de variação)
  try {
    const res = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,GBP-BRL,BTC-BRL,ETH-BRL', {
      headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 300 },
    })
    if (res.ok) {
      const data = await res.json()
      const map: Record<string, { label: string; kind: string }> = {
        USDBRL: { label: 'Dólar', kind: 'moeda' }, EURBRL: { label: 'Euro', kind: 'moeda' },
        GBPBRL: { label: 'Libra', kind: 'moeda' }, BTCBRL: { label: 'Bitcoin', kind: 'cripto' },
        ETHBRL: { label: 'Ethereum', kind: 'cripto' },
      }
      const out = Object.entries(map).map(([k, m]) => {
        const q = data[k]
        return q?.bid ? { symbol: k, label: m.label, price: Number(q.bid), changePct: Number(q.pctChange), kind: m.kind } : null
      }).filter(Boolean) as Quote[]
      if (out.length) return out
    }
  } catch { /* fallback abaixo */ }

  // 2. Fallback: câmbio (open.er-api) + cripto (CoinGecko) — globais e confiáveis
  const out: Quote[] = []
  try {
    const fx = await fetch('https://open.er-api.com/v6/latest/USD', { next: { revalidate: 300 } }).then(r => r.json())
    const brl = fx?.rates?.BRL
    if (brl) {
      out.push({ symbol: 'USDBRL', label: 'Dólar', price: brl, changePct: 0, kind: 'moeda' })
      if (fx.rates.EUR) out.push({ symbol: 'EURBRL', label: 'Euro', price: brl / fx.rates.EUR, changePct: 0, kind: 'moeda' })
      if (fx.rates.GBP) out.push({ symbol: 'GBPBRL', label: 'Libra', price: brl / fx.rates.GBP, changePct: 0, kind: 'moeda' })
    }
  } catch { /* ignore */ }
  try {
    const cg = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=brl&include_24hr_change=true', { next: { revalidate: 300 } }).then(r => r.json())
    if (cg?.bitcoin) out.push({ symbol: 'BTCBRL', label: 'Bitcoin', price: cg.bitcoin.brl, changePct: cg.bitcoin.brl_24h_change ?? 0, kind: 'cripto' })
    if (cg?.ethereum) out.push({ symbol: 'ETHBRL', label: 'Ethereum', price: cg.ethereum.brl, changePct: cg.ethereum.brl_24h_change ?? 0, kind: 'cripto' })
  } catch { /* ignore */ }
  return out
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
