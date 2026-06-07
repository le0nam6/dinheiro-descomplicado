/**
 * Resumo do GA4 (Data API) via service account.
 * Requer envs: GA4_PROPERTY_ID, GOOGLE_SA_CLIENT_EMAIL, GOOGLE_SA_PRIVATE_KEY
 */
import { GoogleAuth } from 'google-auth-library'

export type GA4Summary = {
  sessions: number
  users: number
  pageViews: number
  topPages: Array<{ path: string; views: number }>
  sources: Array<{ source: string; sessions: number }>
  instagramSessions: number
}

export function ga4Configured() {
  return Boolean(
    process.env.GA4_PROPERTY_ID &&
    process.env.GOOGLE_SA_CLIENT_EMAIL &&
    process.env.GOOGLE_SA_PRIVATE_KEY
  )
}

async function getToken(): Promise<string> {
  const auth = new GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SA_CLIENT_EMAIL,
      // a private key vem com \n escapados quando guardada em env var
      private_key: (process.env.GOOGLE_SA_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  })
  const client = await auth.getClient()
  const token = await client.getAccessToken()
  return token.token as string
}

async function runReport(token: string, body: unknown) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${process.env.GA4_PROPERTY_ID}:runReport`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  )
  if (!res.ok) throw new Error(`GA4 ${res.status}: ${await res.text()}`)
  return res.json()
}

export async function getGA4Summary(): Promise<GA4Summary> {
  const token = await getToken()
  const dateRanges = [{ startDate: '7daysAgo', endDate: 'today' }]

  // 1. Totais
  const totals = await runReport(token, {
    dateRanges,
    metrics: [{ name: 'sessions' }, { name: 'activeUsers' }, { name: 'screenPageViews' }],
  })
  const tRow = totals.rows?.[0]?.metricValues ?? []
  const sessions = Number(tRow[0]?.value ?? 0)
  const users = Number(tRow[1]?.value ?? 0)
  const pageViews = Number(tRow[2]?.value ?? 0)

  // 2. Top páginas
  const pages = await runReport(token, {
    dateRanges,
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'screenPageViews' }],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 5,
  })
  const topPages = (pages.rows ?? []).map((r: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => ({
    path: r.dimensionValues[0].value,
    views: Number(r.metricValues[0].value),
  }))

  // 3. Fontes de tráfego
  const src = await runReport(token, {
    dateRanges,
    dimensions: [{ name: 'sessionSource' }],
    metrics: [{ name: 'sessions' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 6,
  })
  const sources = (src.rows ?? []).map((r: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => ({
    source: r.dimensionValues[0].value,
    sessions: Number(r.metricValues[0].value),
  }))
  const instagramSessions = sources
    .filter((s: { source: string }) => /instagram|ig|l\.instagram/i.test(s.source))
    .reduce((sum: number, s: { sessions: number }) => sum + s.sessions, 0)

  return { sessions, users, pageViews, topPages, sources, instagramSessions }
}
