import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'

// Token de sessão = HMAC da senha (nunca guardamos a senha em texto no cookie)
export function sessionToken(password: string): string {
  const secret = process.env.CRON_SECRET || 'fallback-dev-secret'
  return createHmac('sha256', secret).update(password).digest('hex')
}

// Valida o cookie admin_auth contra o HMAC esperado (timing-safe)
export async function isAdmin(): Promise<boolean> {
  const password = process.env.ADMIN_PASSWORD
  if (!password) return false
  const store = await cookies()
  const cookie = store.get('admin_auth')?.value
  if (!cookie) return false
  const expected = sessionToken(password)
  const a = Buffer.from(cookie)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}
