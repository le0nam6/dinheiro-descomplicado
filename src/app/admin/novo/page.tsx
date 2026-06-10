import { PostForm } from '../PostForm'
import { isAdmin } from '@/lib/adminAuth'
import { redirect } from 'next/navigation'

export const metadata = { robots: { index: false, follow: false }, title: 'Novo artigo — Endinheirados' }

export default async function NovoPage() {
  if (!await isAdmin()) redirect('/admin')
  return <PostForm />
}
