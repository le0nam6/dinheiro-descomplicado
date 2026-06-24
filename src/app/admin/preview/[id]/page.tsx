import { createHmac, timingSafeEqual } from 'crypto'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { sanity } from '@/lib/publish-core'

export const metadata = { robots: { index: false, follow: false }, title: 'Preview — Endinheirados' }
export const dynamic = 'force-dynamic'

function isAuthorized(token: string | null): boolean {
  const password = process.env.ADMIN_PASSWORD || ''
  const secret = process.env.CRON_SECRET || 'fallback-dev-secret'
  const expected = createHmac('sha256', secret).update(password).digest('hex')
  if (!token) return false
  try {
    const a = Buffer.from(token)
    const b = Buffer.from(expected)
    return a.length === b.length && timingSafeEqual(a, b)
  } catch { return false }
}

async function isCookieAdmin(): Promise<boolean> {
  const store = await cookies()
  const cookie = store.get('admin_auth')?.value
  return isAuthorized(cookie ?? null)
}

type Block = {
  _type: string
  style?: string
  listItem?: string
  children?: Array<{ text: string; marks?: string[] }>
}

function renderBlocks(blocks: Block[]): string {
  return blocks.map(b => {
    const text = (b.children ?? []).map(c => c.text).join('')
    if (b.style === 'h2' || b.style === 'h3') return `\n## ${text}\n`
    if (b.listItem === 'bullet') return `• ${text}`
    return text
  }).join('\n')
}

type PostData = {
  title?: string
  excerpt?: string
  category?: string
  articleType?: string
  body?: string[]
  igCaption?: string
  igTitle?: string
}

type SanityDoc = {
  _id: string
  _type: string
  // post fields
  title?: string
  excerpt?: string
  status?: string
  category?: string
  articleType?: string
  body?: Block[]
  igCaption?: string
  igTitle?: string
  // pendingPost fields
  data?: string
}

function renderLines(lines: string[]) {
  return lines.map((line, i) => {
    if (line.startsWith('## ')) {
      return <h2 key={i} style={{ fontSize: 18, fontWeight: 700, marginTop: 28, marginBottom: 8 }}>{line.slice(3)}</h2>
    }
    if (line.startsWith('- ') || line.startsWith('• ')) {
      return <p key={i} style={{ margin: '4px 0', paddingLeft: 16 }}>{line.replace(/^[-•]\s/, '• ')}</p>
    }
    if (line.trim() === '') return <br key={i} />
    return <p key={i} style={{ margin: '10px 0' }}>{line}</p>
  })
}

export default async function PreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ token?: string; type?: string }>
}) {
  const { id } = await params
  const { token } = await searchParams

  const authorized = isAuthorized(token ?? null) || await isCookieAdmin()
  if (!authorized) notFound()

  const doc: SanityDoc | null = await sanity.fetch(
    `*[_id == $id][0]{ _id, _type, title, excerpt, status, category, articleType, body, igCaption, igTitle, data }`,
    { id },
  )
  if (!doc) notFound()

  // pendingPost armazena o conteúdo serializado em doc.data
  let post: PostData = {}
  if (doc._type === 'pendingPost' && doc.data) {
    try {
      const parsed = JSON.parse(doc.data)
      post = parsed.post ?? {}
    } catch { /* malformed */ }
  } else {
    post = {
      title: doc.title,
      excerpt: doc.excerpt,
      category: doc.category,
      articleType: doc.articleType,
      body: doc.body ? doc.body.map(b => {
        const text = (b.children ?? []).map(c => c.text).join('')
        if (b.style === 'h2' || b.style === 'h3') return `## ${text}`
        if (b.listItem === 'bullet') return `- ${text}`
        return text
      }) : [],
      igCaption: doc.igCaption,
      igTitle: doc.igTitle,
    }
  }

  const bodyLines: string[] = Array.isArray(post.body) ? post.body as string[] : []

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 720, margin: '0 auto', padding: '24px 16px', color: '#111' }}>
      <div style={{ marginBottom: 24, padding: '12px 16px', background: '#f5f5f5', borderRadius: 8, fontSize: 13, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <span><strong>Tipo:</strong> {doc._type === 'pendingPost' ? 'pendente (publish)' : doc.articleType ?? '—'}</span>
        {doc.status && <span><strong>Status:</strong> {doc.status}</span>}
        {post.category && <span><strong>Categoria:</strong> {post.category}</span>}
      </div>

      <h1 style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.3, marginBottom: 12 }}>{post.title ?? doc.title ?? '—'}</h1>

      {post.excerpt && (
        <p style={{ fontSize: 15, color: '#555', borderLeft: '3px solid #ddd', paddingLeft: 12, marginBottom: 24 }}>
          {post.excerpt}
        </p>
      )}

      <div style={{ lineHeight: 1.7, fontSize: 15 }}>
        {renderLines(bodyLines)}
      </div>

      {post.igCaption && (
        <details style={{ marginTop: 40, borderTop: '1px solid #eee', paddingTop: 20 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#555' }}>📸 Caption Instagram</summary>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, marginTop: 12, color: '#333' }}>{post.igCaption}</pre>
        </details>
      )}
    </div>
  )
}
