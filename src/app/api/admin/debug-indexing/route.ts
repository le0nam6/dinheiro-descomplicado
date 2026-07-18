import { NextResponse } from 'next/server'
import { GoogleAuth } from 'google-auth-library'

// Endpoint de debug temporário — testa a Google Indexing API e reporta o erro
// real (a função de produção engole erros silenciosamente). Remover depois do uso.
export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const privateKey = process.env.GOOGLE_INDEXING_PRIVATE_KEY?.replace(/\\n/g, '\n')
  const clientEmail = process.env.GOOGLE_INDEXING_CLIENT_EMAIL
  if (!privateKey || !clientEmail) {
    return NextResponse.json({ error: 'credenciais não configuradas' }, { status: 400 })
  }

  const testUrl = 'https://portalendinheirados.com.br/blog/financiamento-imobiliario-2026'

  try {
    const auth = new GoogleAuth({
      credentials: { client_email: clientEmail, private_key: privateKey },
      scopes: ['https://www.googleapis.com/auth/indexing'],
    })
    const client = await auth.getClient()
    const token = await (client as { getAccessToken: () => Promise<{ token: string }> }).getAccessToken()

    const res = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token.token}` },
      body: JSON.stringify({ url: testUrl, type: 'URL_UPDATED' }),
    })
    const body = await res.text()
    return NextResponse.json({ status: res.status, ok: res.ok, body: JSON.parse(body || '{}'), clientEmail })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err), clientEmail }, { status: 500 })
  }
}
