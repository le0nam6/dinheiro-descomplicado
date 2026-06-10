'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type Post = { _id: string; title: string; slug: { current: string }; category: string; funnel: string; publishedAt: string; excerpt: string }

export function AdminDashboard() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    fetch('/api/admin/posts').then(r => r.json()).then(d => { setPosts(d.posts || []); setLoading(false) })
  }, [])

  const filtered = posts.filter(p => p.title.toLowerCase().includes(filter.toLowerCase()))
  const scheduled = posts.filter(p => new Date(p.publishedAt).getTime() > Date.now()).length

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Painel de Conteúdo</h1>
          <p className="text-sm text-gray-500">
            {posts.length} artigos{scheduled > 0 && <> · <span className="text-amber-600 font-semibold">{scheduled} agendado{scheduled > 1 ? 's' : ''}</span></>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a href="/studio" target="_blank" className="text-sm text-gray-400 hover:text-green-700">Sanity Studio ↗</a>
          <Link href="/admin/novo" className="bg-green-600 hover:bg-green-500 text-white font-bold text-sm px-4 py-2 rounded-xl transition-colors">
            + Novo artigo
          </Link>
        </div>
      </div>

      <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Buscar artigo..."
        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl mb-5 focus:outline-none focus:ring-2 focus:ring-green-400" />

      {loading ? (
        <p className="text-gray-400 text-center py-12">Carregando...</p>
      ) : (
        <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden">
          {filtered.map(post => {
            const isScheduled = new Date(post.publishedAt).getTime() > Date.now()
            return (
              <Link key={post._id} href={`/admin/editar/${post._id}`} className="flex items-center justify-between gap-4 p-4 hover:bg-green-50 transition-colors group">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-green-700">{post.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    <span className="capitalize">{post.category}</span> · {new Date(post.publishedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  {isScheduled
                    ? <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md">⏰ Agendado</span>
                    : <span className="text-[11px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-md">● No ar</span>}
                  <span className="text-xs font-semibold text-green-700 border border-green-300 px-3 py-1.5 rounded-lg group-hover:bg-green-600 group-hover:text-white transition-colors">Editar</span>
                </div>
              </Link>
            )
          })}
          {filtered.length === 0 && <p className="text-gray-400 text-center py-12">Nenhum artigo encontrado.</p>}
        </div>
      )}
    </div>
  )
}
