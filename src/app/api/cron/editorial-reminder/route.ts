import { NextResponse } from 'next/server'

const BOT = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`
const CHAT_ID = process.env.TELEGRAM_CHAT_ID

const MORNING_MSGS = [
  'Bom dia 🗞️\n\nViu alguma história boa enquanto tomava café?\n\n/noticia <url> pra transformar em post.',
  'Manhã chegou 🌅\n\nTem alguma notícia que você achou interessante hoje?\n\n/noticia <url> e o site cobre pra você.',
  'Dia novo, pauta nova 📰\n\nQual história você mandaria pro seu amigo hoje?\n\n/noticia <url>',
]

const AFTERNOON_MSGS = [
  'Hora do lanche ☕ e da pauta 📋\n\nAlguma história boa apareceu hoje à tarde?\n\n/noticia <url> pra publicar agora.',
  'Tarde rolando 🌤️\n\nTem algo que chamou atenção essa semana e você ainda não cobriu?\n\n/noticia <url>',
  'Lembrete editorial 🔔\n\nSe você viu algo interessante hoje, essa é a hora de transformar em post.\n\n/noticia <url>',
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!CHAT_ID) return NextResponse.json({ error: 'TELEGRAM_CHAT_ID not set' }, { status: 500 })

  const slot = new URL(request.url).searchParams.get('slot') ?? 'morning'
  const text = slot === 'afternoon' ? pick(AFTERNOON_MSGS) : pick(MORNING_MSGS)

  const res = await fetch(`${BOT}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, text }),
  }).then(r => r.json())

  return NextResponse.json({ ok: res.ok, slot })
}
