/**
 * Digest semanal de busca, no Telegram.
 *
 * Antes resumia a performance do Instagram. O canal parou de ser alimentado,
 * então o relatório virou ruído — e o dado que move o projeto está no Search
 * Console. O conteúdo do relatório mora em src/lib/search-console.ts, para
 * este cron e o comando /busca do bot nunca divergirem.
 */
import { NextResponse } from 'next/server'
import { tgConfigured, tgSendMessage, tgAlert } from '@/lib/publish-core'
import { relatorioDeBusca } from '@/lib/search-console'

export const maxDuration = 300

export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const texto = await relatorioDeBusca(7)
    if (tgConfigured()) await tgSendMessage(texto, undefined, 'HTML')
    else console.log('[insights]', texto)
    return NextResponse.json({ ok: true })
  } catch (err) {
    await tgAlert('Digest semanal de busca', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
