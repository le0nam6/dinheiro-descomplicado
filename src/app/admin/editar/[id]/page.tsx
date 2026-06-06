import { EditorClient } from './EditorClient'

export const metadata = { robots: { index: false, follow: false }, title: 'Editar — Endinheirados' }

export default async function EditarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <EditorClient id={id} />
}
