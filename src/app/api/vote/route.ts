/**
 * Termômetro de imparcialidade — votação ao vivo.
 * GET  /api/vote?slug=...        → totais atuais
 * POST /api/vote {slug, vote}    → registra voto (imparcial|tendencioso|neutro) e devolve totais
 */
import { NextResponse } from 'next/server'
import { sanity } from '@/lib/publish-core'

const OPTS = ['imparcial', 'tendencioso', 'neutro'] as const
type Opt = typeof OPTS[number]

function docId(slug: string) {
  return `votes-${slug}`.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120)
}

async function totals(slug: string) {
  const d = await sanity.fetch('*[_id==$id][0]{imparcial, tendencioso, neutro}', { id: docId(slug) })
  return { imparcial: d?.imparcial ?? 0, tendencioso: d?.tendencioso ?? 0, neutro: d?.neutro ?? 0 }
}

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'slug obrigatório' }, { status: 400 })
  return NextResponse.json({ ok: true, ...(await totals(slug)) })
}

export async function POST(request: Request) {
  const { slug, vote } = await request.json()
  if (!slug || !OPTS.includes(vote as Opt)) {
    return NextResponse.json({ error: 'slug e vote válidos obrigatórios' }, { status: 400 })
  }
  const id = docId(slug)
  try {
    // Garante que o doc existe (com zeros) e então incrementa o voto
    await sanity.createIfNotExists({ _id: id, _type: 'postVotes', slug, imparcial: 0, tendencioso: 0, neutro: 0 })
    await sanity.patch(id).inc({ [vote]: 1 }).commit()
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
  return NextResponse.json({ ok: true, ...(await totals(slug)) })
}
