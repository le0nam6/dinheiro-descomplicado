import { AdminLogin } from './AdminLogin'
import { AdminDashboard } from './AdminDashboard'
import { isAdmin } from '@/lib/adminAuth'

export const metadata = { robots: { index: false, follow: false }, title: 'Painel — Endinheirados' }

export default async function AdminPage() {
  if (!await isAdmin()) return <AdminLogin />
  return <AdminDashboard />
}
