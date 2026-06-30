import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const CLIENT_ID = process.env.CANVA_CLIENT_ID!
const CLIENT_SECRET = process.env.CANVA_CLIENT_SECRET!
const REDIRECT_URI = 'https://portalendinheirados.com.br/api/canva/callback'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return new Response(`Canva OAuth error: ${error || 'missing code'}`, { status: 400 })
  }

  const cookieStore = await cookies()
  const codeVerifier = cookieStore.get('canva_cv')?.value

  if (!codeVerifier) {
    return new Response('Session expired — start over at /api/canva/auth?secret=...', { status: 400 })
  }

  // Exchange code for tokens
  const tokenRes = await fetch('https://api.canva.com/rest/v1/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  })

  if (!tokenRes.ok) {
    const body = await tokenRes.text()
    return new Response(`Token exchange failed: ${body}`, { status: 500 })
  }

  const tokens = await tokenRes.json() as {
    access_token: string
    refresh_token: string
    expires_in: number
    token_type: string
  }

  // Clear the PKCE cookie
  cookieStore.delete('canva_cv')

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Canva OAuth — Tokens</title>
<style>body{font-family:monospace;padding:2rem;background:#0a1a0f;color:#D8E8DC}
h1{color:#7CFC00}pre{background:#14321f;padding:1rem;border-radius:8px;white-space:pre-wrap;word-break:break-all}
.warn{color:#ffcc00;margin-top:1rem}</style></head>
<body>
<h1>✅ Autorização concluída</h1>
<p>Copie o <strong>refresh_token</strong> e adicione como variável de ambiente no Vercel:</p>
<pre>CANVA_REFRESH_TOKEN=${tokens.refresh_token}</pre>
<p>access_token (expira em ${Math.round(tokens.expires_in / 60)} min — não é necessário salvar):</p>
<pre>${tokens.access_token}</pre>
<p class="warn">⚠️ Feche esta aba após copiar — os tokens não aparecem novamente aqui.</p>
</body></html>`

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
