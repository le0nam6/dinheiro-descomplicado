/**
 * Verifica alertas de cotação e dispara no Telegram quando a condição é atingida.
 * Debounce de 6h por alerta. Agendado via GitHub Actions (a cada 30 min).
 */
import { NextResponse } from 'next/server'
import { sanity, tgConfigured, tgAlert } from '@/lib/publish-core'

const DEBOUNCE_MS = 6 * 60 * 60 * 1000

const LABEL: Record<string, string> = {
  USDBRL: 'Dólar', EURBRL: 'Euro', GBPBRL: 'Libra', BTCBRL: 'Bitcoin', ETHBRL: 'Ethereum',
  '^BVSP': 'Ibovespa', '^GSPC': 'S&P 500', '^IXIC': 'Nasdaq', '^DJI': 'Dow Jones',
}

type Alert = { _id: string; symbol: string; condition: 'above' | 'below'; value: number; active: boolean; lastTriggeredAt?: string }

export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const alerts: Alert[] = await sanity.fetch('*[_type=="priceAlert" && active==true]')
    if (!alerts.length) return NextResponse.json({ ok: true, message: 'Sem alertas ativos' })

    const origin = new URL(request.url).origin
    const data = await fetch(`${origin}/api/quotes`).then(r => r.json())
    const priceBy: Record<string, number> = {}
    for (const q of data.quotes ?? []) priceBy[q.symbol] = q.price

    let fired = 0
    for (const a of alerts) {
      const price = priceBy[a.symbol]
      if (price == null) continue
      const hit = a.condition === 'above' ? price >= a.value : price <= a.value
      if (!hit) continue
      const last = a.lastTriggeredAt ? new Date(a.lastTriggeredAt).getTime() : 0
      if (Date.now() - last < DEBOUNCE_MS) continue

      if (tgConfigured()) {
        const arrow = a.condition === 'above' ? '🔺 passou de' : '🔻 caiu abaixo de'
        const fmt = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: n >= 1000 ? 0 : 2 })
        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: `🔔 Alerta de cotação\n\n${LABEL[a.symbol] || a.symbol} ${arrow} ${fmt(a.value)}\nAgora: ${fmt(price)}` }),
        }).catch(() => {})
      }
      await sanity.patch(a._id).set({ lastTriggeredAt: new Date().toISOString() }).commit()
      fired++
    }
    return NextResponse.json({ ok: true, checked: alerts.length, fired })
  } catch (err) {
    await tgAlert('Cron alertas de cotação', err)
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
