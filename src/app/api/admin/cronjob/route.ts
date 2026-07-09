import { NextResponse } from 'next/server'

function checkAuth(request: Request) {
  return request.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`
}

const BASE = 'https://api.cron-job.org'

function headers() {
  return {
    Authorization: `Bearer ${process.env.CRONJOB_ORG_API_KEY}`,
    'Content-Type': 'application/json',
  }
}

// GET: lista todos os jobs configurados no cron-job.org (título, url, schedule)
export async function GET(request: Request) {
  if (!checkAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!process.env.CRONJOB_ORG_API_KEY) return NextResponse.json({ error: 'CRONJOB_ORG_API_KEY não configurado' }, { status: 400 })

  const res = await fetch(`${BASE}/jobs`, { headers: headers() })
  if (!res.ok) return NextResponse.json({ error: `Erro ao listar jobs (${res.status})` }, { status: 500 })
  const { jobs } = await res.json()

  const summary = (jobs ?? []).map((j: { jobId: number; title?: string; url?: string; enabled?: boolean; schedule?: Record<string, unknown> }) => ({
    jobId: j.jobId,
    title: j.title,
    url: j.url,
    enabled: j.enabled,
    schedule: j.schedule,
  }))

  return NextResponse.json({ ok: true, jobs: summary })
}

// PATCH: atualiza o schedule de um job específico. Body: { jobId, schedule }
export async function PATCH(request: Request) {
  if (!checkAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!process.env.CRONJOB_ORG_API_KEY) return NextResponse.json({ error: 'CRONJOB_ORG_API_KEY não configurado' }, { status: 400 })

  const body = await request.json()
  const { jobId, schedule } = body as { jobId: number; schedule: Record<string, unknown> }
  if (!jobId || !schedule) return NextResponse.json({ error: 'jobId e schedule são obrigatórios' }, { status: 400 })

  const res = await fetch(`${BASE}/jobs/${jobId}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({ job: { schedule } }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    return NextResponse.json({ error: `Erro ao atualizar job (${res.status}): ${text}` }, { status: 500 })
  }

  return NextResponse.json({ ok: true, jobId })
}
