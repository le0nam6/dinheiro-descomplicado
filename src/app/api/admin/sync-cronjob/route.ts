import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'

function sessionToken(password: string) {
  const secret = process.env.CRON_SECRET || 'fallback-dev-secret'
  return createHmac('sha256', secret).update(password).digest('hex')
}

async function checkAuth() {
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

export async function POST() {
  if (!await checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cronSecret = process.env.CRON_SECRET
  const apiKey = process.env.CRONJOB_ORG_API_KEY

  if (!apiKey) return NextResponse.json({ error: 'CRONJOB_ORG_API_KEY não configurado' }, { status: 400 })
  if (!cronSecret) return NextResponse.json({ error: 'CRON_SECRET não configurado' }, { status: 400 })

  const base = 'https://api.cron-job.org'
  const headers = { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }

  // Busca todos os jobs
  const listRes = await fetch(`${base}/jobs`, { headers })
  if (!listRes.ok) {
    const body = await listRes.text().catch(() => '')
    return NextResponse.json({ error: `Erro ao listar jobs (${listRes.status}): ${body}` }, { status: 500 })
  }
  const { jobs } = await listRes.json()

  const updated: string[] = []
  const failed: string[] = []
  const skipped: string[] = []

  for (const job of jobs ?? []) {
    const jobId = job.jobId

    // Busca detalhes do job para ver extendedData.headers
    const detailRes = await fetch(`${base}/jobs/${jobId}`, { headers })
    if (!detailRes.ok) { failed.push(job.title ?? String(jobId)); continue }
    const detail = await detailRes.json()
    const jobHeaders = detail.jobDetails?.extendedData?.headers ?? {}

    if (!jobHeaders.Authorization) { skipped.push(job.title ?? String(jobId)); continue }

    const patchRes = await fetch(`${base}/jobs/${jobId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        job: { extendedData: { headers: { ...jobHeaders, Authorization: `Bearer ${cronSecret}` }, body: '' } },
      }),
    })

    if (patchRes.ok) updated.push(job.title ?? String(jobId))
    else failed.push(job.title ?? String(jobId))
  }

  return NextResponse.json({ ok: true, updated, failed, skipped })
}
