import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const CLIENT_ID = process.env.CANVA_CLIENT_ID!
const REDIRECT_URI = 'https://endinheirados.cc/api/canva/callback'
const SCOPES = 'design:content:read asset:write asset:read design:content:write design:meta:read'

function base64url(buf: Buffer) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export async function GET(req: NextRequest) {
  // Protect with a secret token to prevent public access
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CANVA_AUTH_SECRET) {
    return new Response('Unauthorized', { status: 401 })
  }

  // PKCE: generate code_verifier and code_challenge
  const codeVerifier = base64url(crypto.randomBytes(32))
  const codeChallenge = base64url(
    crypto.createHash('sha256').update(codeVerifier).digest()
  )

  // Store code_verifier in a secure cookie (5 min TTL)
  const cookieStore = await cookies()
  cookieStore.set('canva_cv', codeVerifier, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 300,
    path: '/',
  })

  const authUrl = new URL('https://www.canva.com/api/oauth/authorize')
  authUrl.searchParams.set('code_challenge_method', 's256')
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('client_id', CLIENT_ID)
  authUrl.searchParams.set('scope', SCOPES)
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
  authUrl.searchParams.set('code_challenge', codeChallenge)

  return Response.redirect(authUrl.toString())
}
