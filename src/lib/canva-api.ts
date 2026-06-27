/**
 * Canva Connect REST API — helpers para pipeline de posts do Instagram.
 * Template: DAHNyFwG8KY (campos autofill: photo, title, excerpt, date)
 *
 * Canva rotaciona o refresh_token a cada uso. Por isso:
 * - getToken() lê o token do Sanity (ou env var como fallback)
 * - Após o refresh, salva o novo refresh_token de volta no Sanity
 * - O access_token é cacheado em memória para evitar duplo uso no mesmo request
 */

import { createClient } from '@sanity/client'

const API = 'https://api.canva.com/rest/v1'

export const CANVA_IG_TEMPLATE_ID = process.env.CANVA_IG_TEMPLATE_ID || 'DAHNyFwG8KY'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

let _cachedAccessToken: string | null = null

async function getRefreshToken(): Promise<string> {
  const doc = await sanity.fetch<{ canvaRefreshToken?: string } | null>(
    `*[_type=="siteSettings"][0]{ canvaRefreshToken }`
  )
  return doc?.canvaRefreshToken || process.env.CANVA_REFRESH_TOKEN!
}

async function saveRefreshToken(token: string): Promise<void> {
  const doc = await sanity.fetch<{ _id: string } | null>(`*[_type=="siteSettings"][0]{ _id }`)
  if (doc) {
    await sanity.patch(doc._id).set({ canvaRefreshToken: token }).commit()
  } else {
    await sanity.create({ _type: 'siteSettings', canvaRefreshToken: token })
  }
}

export async function getToken(): Promise<string> {
  if (_cachedAccessToken) return _cachedAccessToken

  const refreshToken = await getRefreshToken()
  const credentials = Buffer.from(
    `${process.env.CANVA_CLIENT_ID}:${process.env.CANVA_CLIENT_SECRET}`
  ).toString('base64')

  const res = await fetch(`${API}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })
  if (!res.ok) throw new Error(`Canva token refresh failed: ${await res.text()}`)
  const d = await res.json()

  _cachedAccessToken = d.access_token as string

  if (d.refresh_token) {
    await saveRefreshToken(d.refresh_token)
  }

  return _cachedAccessToken!
}

async function poll<T>(
  fn: () => Promise<{ status: string; result?: T }>,
  tries = 30,
  intervalMs = 2000,
): Promise<T> {
  for (let i = 0; i < tries; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, intervalMs))
    const { status, result } = await fn()
    if (status === 'success') return result as T
    if (status === 'failed') throw new Error('Canva job failed')
  }
  throw new Error('Canva job timeout')
}

/** Faz upload de uma imagem (via URL) para a biblioteca do Canva. Retorna o asset_id. */
export async function uploadAssetFromUrl(photoUrl: string, name: string, token: string): Promise<string> {
  const imgRes = await fetch(photoUrl, { signal: AbortSignal.timeout(15_000) })
  if (!imgRes.ok) throw new Error(`Falha ao buscar foto: ${photoUrl}`)
  const imgBuffer = Buffer.from(await imgRes.arrayBuffer())

  const toB64url = (s: string) => Buffer.from(s).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  // Tenta JSON puro (sem encoding) no header
  const metadataB64 = JSON.stringify({ name_base64: toB64url(`${name}.jpg`) })

  const uploadRes = await fetch(`${API}/asset-uploads`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/octet-stream',
      'Asset-Upload-Metadata': metadataB64,
    },
    body: imgBuffer,
  })
  const uploadText = await uploadRes.text()
  console.log('[canva] upload response:', uploadRes.status, uploadText)
  if (!uploadRes.ok) throw new Error(`Canva upload failed: ${uploadText}`)
  const { job } = await uploadRes.json()

  const assetId = await poll(async () => {
    const r = await fetch(`${API}/asset-uploads/${job.id}`, { headers: { Authorization: `Bearer ${token}` } })
    const d = await r.json()
    return { status: d.job?.status ?? 'pending', result: d.job?.asset?.id as string }
  })

  return assetId
}

/** Cria um post do Instagram via autofill do template. Retorna { designId, exportUrl }. */
export async function createIgDesign(data: {
  title: string
  excerpt: string
  date: string
  assetId: string
  token: string
}): Promise<{ designId: string; exportUrl: string }> {
  const { token } = data

  // 1. Autofill
  const autofillRes = await fetch(`${API}/autofills`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      brand_template_id: CANVA_IG_TEMPLATE_ID,
      title: data.title.slice(0, 50),
      data: {
        title:   { type: 'text',  text: data.title },
        excerpt: { type: 'text',  text: data.excerpt },
        date:    { type: 'text',  text: data.date },
        photo:   { type: 'image', asset_id: data.assetId },
      },
    }),
  })
  if (!autofillRes.ok) throw new Error(`Canva autofill failed: ${await autofillRes.text()}`)
  const { job: afJob } = await autofillRes.json()

  const designId = await poll<string>(async () => {
    const r = await fetch(`${API}/autofills/${afJob.id}`, { headers: { Authorization: `Bearer ${token}` } })
    const d = await r.json()
    return { status: d.job?.status ?? 'pending', result: d.job?.result?.design?.id as string }
  })

  // 2. Export
  const exportRes = await fetch(`${API}/exports`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ design_id: designId, format: 'jpg', export_quality: 'regular' }),
  })
  if (!exportRes.ok) throw new Error(`Canva export failed: ${await exportRes.text()}`)
  const { job: expJob } = await exportRes.json()

  const exportUrl = await poll<string>(async () => {
    const r = await fetch(`${API}/exports/${expJob.id}`, { headers: { Authorization: `Bearer ${token}` } })
    const d = await r.json()
    return { status: d.job?.status ?? 'pending', result: d.job?.urls?.[0] as string }
  })

  return { designId, exportUrl }
}
