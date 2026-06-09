import { NextResponse } from 'next/server'
import { timingSafeEqual, createHmac } from 'crypto'

function sessionToken(password: string): string {
  const secret = process.env.CRON_SECRET || 'fallback-dev-secret'
  return createHmac('sha256', secret).update(password).digest('hex')
}

export async function POST(request: Request) {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) {
    return NextResponse.json({ error: 'Servidor não configurado' }, { status: 500 })
  }

  let password: string
  try {
    const body = await request.json()
    password = body?.password
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }

  if (!password || typeof password !== 'string') {
    return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 })
  }

  // Comparação timing-safe para evitar timing attacks
  const a = Buffer.from(password.padEnd(expected.length))
  const b = Buffer.from(expected)
  const match = a.length === b.length && timingSafeEqual(a, b)

  if (!match) {
    return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 })
  }

  // Cookie armazena HMAC da senha — nunca a senha em texto
  const token = sessionToken(expected)
  const res = NextResponse.json({ ok: true })
  res.cookies.set('admin_auth', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return res
}
