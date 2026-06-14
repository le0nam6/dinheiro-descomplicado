/**
 * Cotações ao vivo: moedas + cripto (AwesomeAPI) e índices/bolsas (Yahoo Finance).
 * Cache de 5 min. Tudo grátis e sem chave.
 */
import { NextResponse } from 'next/server'

export const revalidate = 300

type Quote = { symbol: string; label: string; price: number; changePct: number; kind: string }

async function yahooQuote(sym: string): Promise<{ price: number; prev: number } | null> {
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 300 },
    })
    const d = await res.json()
    const m = d.chart.result[0].meta
    return { price: m.regularMarketPrice, prev: m.previousClose ?? m.chartPreviousClose }
  } catch { return null }
}

async function getFxCrypto(): Promise<Quote[]> {
  // Moedas via Yahoo (traz variação real). Cripto via CoinGecko (em BRL + 24h%).
  const fx = [
    { sym: 'USDBRL=X', symbol: 'USDBRL', label: 'Dólar' },
    { sym: 'EURBRL=X', symbol: 'EURBRL', label: 'Euro' },
    { sym: 'GBPBRL=X', symbol: 'GBPBRL', label: 'Libra' },
  ]
  const fxOut = (await Promise.allSettled(fx.map(async f => {
    const q = await yahooQuote(f.sym)
    if (!q) return null
    return { symbol: f.symbol, label: f.label, price: q.price, changePct: ((q.price - q.prev) / q.prev) * 100, kind: 'moeda' } as Quote
  }))).flatMap(r => (r.status === 'fulfilled' && r.value ? [r.value] : []))

  const out: Quote[] = [...fxOut]
  try {
    const cg = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,binancecoin,ripple,cardano,dogecoin,litecoin&vs_currencies=brl&include_24hr_change=true', { next: { revalidate: 300 } }).then(r => r.json())
    if (cg?.bitcoin)     out.push({ symbol: 'BTCBRL',  label: 'Bitcoin',  price: cg.bitcoin.brl,     changePct: cg.bitcoin.brl_24h_change ?? 0,     kind: 'cripto' })
    if (cg?.ethereum)    out.push({ symbol: 'ETHBRL',  label: 'Ethereum', price: cg.ethereum.brl,    changePct: cg.ethereum.brl_24h_change ?? 0,    kind: 'cripto' })
    if (cg?.solana)      out.push({ symbol: 'SOLBRL',  label: 'Solana',   price: cg.solana.brl,      changePct: cg.solana.brl_24h_change ?? 0,      kind: 'cripto' })
    if (cg?.binancecoin) out.push({ symbol: 'BNBBRL',  label: 'BNB',      price: cg.binancecoin.brl, changePct: cg.binancecoin.brl_24h_change ?? 0, kind: 'cripto' })
    if (cg?.ripple)      out.push({ symbol: 'XRPBRL',  label: 'XRP',      price: cg.ripple.brl,      changePct: cg.ripple.brl_24h_change ?? 0,      kind: 'cripto' })
    if (cg?.cardano)     out.push({ symbol: 'ADABRL',  label: 'Cardano',  price: cg.cardano.brl,     changePct: cg.cardano.brl_24h_change ?? 0,     kind: 'cripto' })
    if (cg?.dogecoin)    out.push({ symbol: 'DOGEBRL', label: 'Dogecoin', price: cg.dogecoin.brl,    changePct: cg.dogecoin.brl_24h_change ?? 0,    kind: 'cripto' })
    if (cg?.litecoin)    out.push({ symbol: 'LTCBRL',  label: 'Litecoin', price: cg.litecoin.brl,    changePct: cg.litecoin.brl_24h_change ?? 0,    kind: 'cripto' })
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
