import { PostForm } from '../../PostForm'
import { isAdmin } from '@/lib/adminAuth'
import { redirect } from 'next/navigation'

export const metadata = { robots: { index: false, follow: false }, title: 'Editar — Endinheirados' }

export default async function EditarPage({ params }: { params: Promise<{ id: string }> }) {
  if (!await isAdmin()) redirect('/admin')
  const { id } = await params
  return <PostForm id={id} />
}
