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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Painel de Conteúdo</h1>
          <p className="text-sm text-gray-500">{posts.length} artigos publicados</p>
        </div>
        <a href="/studio" target="_blank" className="text-sm text-gray-400 hover:text-green-700">Sanity Studio ↗</a>
      </div>

      <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Buscar artigo..."
        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl mb-5 focus:outline-none focus:ring-2 focus:ring-green-400" />

      {loading ? (
        <p className="text-gray-400 text-center py-12">Carregando...</p>
      ) : (
        <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden">
          {filtered.map(post => (
            <Link key={post._id} href={`/admin/editar/${post._id}`} className="flex items-center justify-between gap-4 p-4 hover:bg-green-50 transition-colors group">
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-green-700">{post.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  <span className="capitalize">{post.category}</span> · {new Date(post.publishedAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <span className="shrink-0 text-xs font-semibold text-green-700 border border-green-300 px-3 py-1.5 rounded-lg group-hover:bg-green-600 group-hover:text-white transition-colors">Editar</span>
            </Link>
          ))}
          {filtered.length === 0 && <p className="text-gray-400 text-center py-12">Nenhum artigo encontrado.</p>}
        </div>
      )}
    </div>
  )
}
