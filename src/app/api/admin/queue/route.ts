import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/adminAuth'
import { sanity, addQueueItem, type QueueKind } from '@/lib/publish-core'

const KINDS: QueueKind[] = ['noticia', 'materia', 'curiosidade']

// GET — lista a fila ativa + os últimos usados (para histórico)
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const [queue, used] = await Promise.all([
    sanity.fetch(`*[_type=="editorialQueue" && status=="fila"]|order(priority desc, createdAt asc){_id, kind, brief, priority, status, createdAt, source}`),
    sanity.fetch(`*[_type=="editorialQueue" && status=="usado"]|order(usedAt desc)[0...10]{_id, kind, brief, usedAt, usedRef}`),
  ])
  return NextResponse.json({ queue, used })
}

// POST — adiciona uma pauta { kind, brief, priority }
export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { kind, brief, priority } = await request.json()
  if (!KINDS.includes(kind)) return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
  if (!brief?.trim()) return NextResponse.json({ error: 'Briefing obrigatório' }, { status: 400 })
  const created = await addQueueItem(kind, brief.trim(), 'admin', Number(priority) || 0)
  return NextResponse.json({ ok: true, id: created._id })
}

// PATCH — atualiza prioridade ou status de um item { id, priority?, status? }
export async function PATCH(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, priority, status } = await request.json()
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
  const patch: Record<string, unknown> = {}
  if (priority !== undefined) patch.priority = Number(priority) || 0
  if (status && ['fila', 'descartado'].includes(status)) patch.status = status
  if (!Object.keys(patch).length) return NextResponse.json({ error: 'Nada para atualizar' }, { status: 400 })
  await sanity.patch(id).set(patch).commit()
  return NextResponse.json({ ok: true })
}

// DELETE — remove um item de vez { id }
export async function DELETE(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
  await sanity.delete(id)
  return NextResponse.json({ ok: true })
}
