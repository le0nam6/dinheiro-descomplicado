/**
 * Watchdog da edição diária. Roda DEPOIS do horário que a edição deveria sair
 * (~7h/8h BRT). Verifica se a edição de hoje existe; se não:
 *  1) tenta reprocessar (chama /api/cron/edition uma vez);
 *  2) se publicar, manda um aviso leve de atraso;
 *  3) se AINDA faltar, dispara um alerta 🚨 no Telegram.
 * É a rede de segurança para o caso (raro) de TODOS os gatilhos falharem em
 * silêncio — situação que não gera "falha" detectável por si só.
 */
import { NextResponse } from 'next/server'
import { sanity, tgConfigured } from '@/lib/publish-core'

function brtDate(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
}

async function sendTelegram(text: string) {
  if (!tgConfigured()) return
  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text }),
  }).catch(() => {})
}

export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const date = brtDate()
  const url = `https://portalendinheirados.com.br/edicao/${date}`

  const exists = await sanity.fetch('*[_type=="edition" && slug.current==$d][0]._id', { d: date })
  if (exists) return NextResponse.json({ ok: true, status: 'ok', date })

  // Falta a edição de hoje → tenta reprocessar uma vez
  const origin = new URL(request.url).origin
  let triggerInfo = ''
  try {
    const r = await fetch(`${origin}/api/cron/edition`, {
      headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
      signal: AbortSignal.timeout(290000),
    }).then(r => r.json())
    triggerInfo = r?.error ? `erro: ${r.error}` : (r?.message || `ok (${r?.stories ?? '?'} matérias)`)
  } catch (e) {
    triggerInfo = e instanceof Error ? e.message : String(e)
  }

  // re-verifica
  const exists2 = await sanity.fetch('*[_type=="edition" && slug.current==$d][0]._id', { d: date })
  if (exists2) {
    await sendTelegram(`⚠️ A edição de hoje atrasou, mas o monitoramento acabou de publicá-la.\n\n${url}`)
    return NextResponse.json({ ok: true, status: 'recovered', date })
  }

  await sendTelegram(`🚨 A EDIÇÃO DE HOJE (${date}) NÃO SAIU e o reprocessamento falhou.\n\nDetalhe: ${triggerInfo}\n\nVerifique manualmente.`)
  return NextResponse.json({ ok: false, status: 'missing', date, triggerInfo }, { status: 200 })
}
