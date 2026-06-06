'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const CATEGORIES = ['empréstimo', 'cartão de crédito', 'financiamento', 'investimentos', 'previdência', 'educação financeira']

export function EditorClient({ id }: { id: string }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [category, setCategory] = useState('')
  const [keywords, setKeywords] = useState('')
  const [bodyMarkdown, setBodyMarkdown] = useState('')
  const [slug, setSlug] = useState('')

  useEffect(() => {
    fetch(`/api/admin/posts/${id}`).then(r => r.json()).then(d => {
      if (d.post) {
        setTitle(d.post.title || '')
        setExcerpt(d.post.excerpt || '')
        setCategory(d.post.category || '')
        setKeywords((d.post.seoKeywords || []).join(', '))
        setBodyMarkdown(d.post.bodyMarkdown || '')
        setSlug(d.post.slug?.current || '')
      }
      setLoading(false)
    })
  }, [id])

  async function handleSave() {
    setSaving(true); setSaved(false)
    await fetch('/api/admin/posts', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, title, excerpt, category, keywords: keywords.split(',').map(k => k.trim()).filter(Boolean), bodyMarkdown }),
    })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return <p className="text-gray-400 text-center py-16 max-w-4xl mx-auto">Carregando artigo...</p>

  const excerptCount = excerpt.length

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-6">
        <Link href="/admin" className="text-sm text-green-700 hover:underline">← Voltar ao painel</Link>
        <div className="flex items-center gap-3">
          {slug && <a href={`/blog/${slug}`} target="_blank" className="text-sm text-gray-400 hover:text-green-700">Ver no site ↗</a>}
          {saved && <span className="text-sm text-green-600 font-semibold">✓ Salvo!</span>}
          <button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white font-bold text-sm px-5 py-2 rounded-xl transition-colors">
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {/* Título */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Título</label>
          <input value={title} onChange={e => setTitle(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400" />
        </div>

        {/* SEO Box */}
        <div className="grid md:grid-cols-2 gap-4 bg-green-50/50 border border-green-200 rounded-2xl p-5">
          <div className="md:col-span-2">
            <p className="text-sm font-bold text-green-900 mb-3">🔍 SEO</p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Meta descrição <span className={`font-normal ${excerptCount > 160 ? 'text-red-500' : 'text-gray-400'}`}>({excerptCount}/160)</span></label>
            <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} rows={2}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Categoria</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400 capitalize">
              {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Palavras-chave (vírgula)</label>
            <input value={keywords} onChange={e => setKeywords(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400" />
          </div>
        </div>

        {/* Corpo */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-bold text-gray-700">Conteúdo (Markdown)</label>
            <span className="text-xs text-gray-400">## título · **negrito** · - lista · &gt; citação · | tabela |</span>
          </div>
          <textarea value={bodyMarkdown} onChange={e => setBodyMarkdown(e.target.value)} rows={28}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 leading-relaxed font-mono focus:outline-none focus:ring-2 focus:ring-green-400"
            style={{ minHeight: 500 }} />
        </div>

        <button onClick={handleSave} disabled={saving} className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors">
          {saving ? 'Salvando...' : saved ? '✓ Salvo!' : 'Salvar alterações'}
        </button>
      </div>
    </div>
  )
}
