import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { password } = await request.json()
  const correct = process.env.ADMIN_PASSWORD || 'endinheirados2026'

  if (password === correct) {
    const res = NextResponse.json({ ok: true })
    res.cookies.set('admin_auth', correct, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: '/',
    })
    return res
  }
  return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 })
}
