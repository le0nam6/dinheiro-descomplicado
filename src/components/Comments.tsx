'use client'
import { useEffect, useState } from 'react'
import { IconMessageCircle, IconUserCircle, IconSend } from '@tabler/icons-react'

type Comment = { _id: string; name: string; body: string; createdAt: string }

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60) return 'agora'
  if (s < 3600) return `há ${Math.floor(s / 60)} min`
  if (s < 86400) return `há ${Math.floor(s / 3600)} h`
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function Comments({ slug }: { slug: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [name, setName] = useState('')
  const [body, setBody] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    const savedName = localStorage.getItem('comment-name')
    if (savedName) setName(savedName)
    fetch(`/api/comments?slug=${encodeURIComponent(slug)}`).then(r => r.json()).then(d => { if (d.ok) setComments(d.comments) }).catch(() => {})
  }, [slug])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (name.trim().length < 2 || body.trim().length < 2) { setError('Preencha nome e comentário.'); return }
    setSending(true)
    localStorage.setItem('comment-name', name.trim())
    const r = await fetch('/api/comments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, name, body, website }),
    }).then(r => r.json()).catch(() => null)
    setSending(false)
    if (r?.ok && r.comment) {
      setComments(c => [...c, r.comment])
      setBody(''); setDone(true); setTimeout(() => setDone(false), 3000)
    } else {
      setError(r?.error || 'Não foi possível enviar. Tente de novo.')
    }
  }

  return (
    <section className="mt-16 border-t border-gray-200 pt-10">
      <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 mb-6">
        <IconMessageCircle size={22} stroke={1.75} className="text-green-600" />
        Comentários {comments.length > 0 && <span className="text-gray-400 font-normal">({comments.length})</span>}
      </h2>

      {/* Lista */}
      <div className="space-y-5 mb-8">
        {comments.length === 0 && <p className="text-gray-400 text-sm">Seja o primeiro a comentar.</p>}
        {comments.map(c => (
          <div key={c._id} className="flex gap-3">
            <IconUserCircle size={36} stroke={1.5} className="text-gray-300 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm">
                <span className="font-semibold text-gray-900">{c.name}</span>
                <span className="text-gray-400"> · {timeAgo(c.createdAt)}</span>
              </p>
              <p className="text-gray-700 text-[15px] whitespace-pre-wrap break-words">{c.body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Formulário */}
      <form onSubmit={submit} className="border border-gray-200 rounded-2xl p-5 bg-gray-50">
        <p className="font-semibold text-gray-900 mb-3">Deixe seu comentário</p>
        <input
          value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" maxLength={60}
          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
        />
        <textarea
          value={body} onChange={e => setBody(e.target.value)} placeholder="Escreva algo respeitoso e construtivo…" rows={3} maxLength={2000}
          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white resize-y"
        />
        {/* honeypot escondido */}
        <input value={website} onChange={e => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        {done && <p className="text-green-600 text-sm mb-2">✓ Comentário publicado!</p>}
        <button
          type="submit" disabled={sending}
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
        >
          <IconSend size={16} stroke={2} /> {sending ? 'Enviando…' : 'Comentar'}
        </button>
        <p className="text-xs text-gray-400 mt-3">Sem cadastro. Comentários são moderados; respeite os outros leitores.</p>
      </form>
    </section>
  )
}
