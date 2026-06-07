import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { AssetChart } from '@/components/AssetChart'

export const revalidate = 900

const ASSETS: Record<string, { yahoo: string; label: string; brl: boolean; desc: string }> = {
  dolar:     { yahoo: 'USDBRL=X', label: 'Dólar (USD/BRL)', brl: true, desc: 'Cotação do dólar americano em reais.' },
  euro:      { yahoo: 'EURBRL=X', label: 'Euro (EUR/BRL)', brl: true, desc: 'Cotação do euro em reais.' },
  libra:     { yahoo: 'GBPBRL=X', label: 'Libra (GBP/BRL)', brl: true, desc: 'Cotação da libra esterlina em reais.' },
  bitcoin:   { yahoo: 'BTC-USD', label: 'Bitcoin (BTC)', brl: false, desc: 'Cotação do Bitcoin em dólar.' },
  ethereum:  { yahoo: 'ETH-USD', label: 'Ethereum (ETH)', brl: false, desc: 'Cotação do Ethereum em dólar.' },
  ibovespa:  { yahoo: '^BVSP', label: 'Ibovespa', brl: false, desc: 'Principal índice da bolsa brasileira (B3).' },
  sp500:     { yahoo: '^GSPC', label: 'S&P 500', brl: false, desc: 'Índice das 500 maiores empresas dos EUA.' },
  nasdaq:    { yahoo: '^IXIC', label: 'Nasdaq', brl: false, desc: 'Índice de tecnologia da bolsa americana.' },
  dow:       { yahoo: '^DJI', label: 'Dow Jones', brl: false, desc: 'Índice das 30 maiores indústrias dos EUA.' },
}

export function generateStaticParams() {
  return Object.keys(ASSETS).map(symbol => ({ symbol }))
}

export async function generateMetadata({ params }: { params: Promise<{ symbol: string }> }): Promise<Metadata> {
  const { symbol } = await params
  const a = ASSETS[symbol]
  if (!a) return {}
  return { title: `${a.label} hoje · Cotação ao vivo · Endinheirados`, description: a.desc, alternates: { canonical: `/cotacao/${symbol}` } }
}

async function getHistory(yahoo: string) {
  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahoo)}?range=1mo&interval=1d`,
    { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 900 } }
  )
  const d = await res.json()
  const r = d.chart.result[0]
  const meta = r.meta
  const closes: number[] = (r.indicators.quote[0].close || []).filter((x: number | null) => x != null)
  return { price: meta.regularMarketPrice, prev: meta.previousClose ?? meta.chartPreviousClose, closes }
}

export default async function CotacaoPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params
  const a = ASSETS[symbol]
  if (!a) notFound()

  let hist
  try { hist = await getHistory(a.yahoo) } catch { hist = null }
  if (!hist) notFound()

  const changePct = ((hist.price - hist.prev) / hist.prev) * 100

  return (
    <div className="max-w-2xl mx-auto">
      <nav className="text-sm text-gray-400 mb-6">
        <Link href="/mercado" className="hover:text-green-700">Mercado</Link> {' › '} <span className="text-gray-600">{a.label}</span>
      </nav>

      <h1 className="text-3xl font-extrabold text-gray-900 mb-1">{a.label}</h1>
      <p className="text-gray-500 mb-6">{a.desc}</p>

      <div className="mb-6">
        <AssetChart symbol={a.yahoo} brl={a.brl} initial={{ price: hist.price, changePct, closes: hist.closes }} />
      </div>

      <p className="text-xs text-gray-400">Dados: Yahoo Finance · valores informativos, não constituem recomendação.</p>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'FinancialProduct', name: a.label, description: a.desc,
      }) }} />
    </div>
  )
}
