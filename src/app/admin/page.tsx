import { cookies } from 'next/headers'
import { AdminLogin } from './AdminLogin'
import { AdminDashboard } from './AdminDashboard'

export const metadata = { robots: { index: false, follow: false }, title: 'Painel — Endinheirados' }

export default async function AdminPage() {
  const store = await cookies()
  const auth = store.get('admin_auth')?.value
  const isAuth = auth && auth === (process.env.ADMIN_PASSWORD || 'endinheirados2026')

  if (!isAuth) return <AdminLogin />
  return <AdminDashboard />
}
