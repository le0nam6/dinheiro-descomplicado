'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const CATEGORIES = ['ganhar dinheiro', 'empréstimo', 'cartão de crédito', 'financiamento', 'investimentos', 'previdência', 'educação financeira']
const FUNNELS = [
  { v: 'tofu', label: 'Topo (descoberta)' },
  { v: 'mofu', label: 'Meio (consideração)' },
  { v: 'bofu', label: 'Fundo (decisão)' },
]

// ISO (UTC) -> valor do input datetime-local (horário local do navegador)
function isoToLocal(iso?: string): string {
  const d = iso ? new Date(iso) : new Date()
  const off = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - off).toISOString().slice(0, 16)
}
// valor do input datetime-local -> ISO (UTC)
function localToIso(local: string): string {
  return local ? new Date(local).toISOString() : new Date().toISOString()
}

export function PostForm({ id }: { id?: string }) {
  const router = useRouter()
  const isEdit = !!id
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState('')

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [category, setCategory] = useState('educação financeira')
  const [funnel, setFunnel] = useState('tofu')
  const [keywords, setKeywords] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [bodyMarkdown, setBodyMarkdown] = useState('')
  const [publishedLocal, setPublishedLocal] = useState(isoToLocal())

  useEffect(() => {
    if (!isEdit) return
    fetch(`/api/admin/posts/${id}`).then(r => r.json()).then(d => {
      if (d.post) {
        setTitle(d.post.title || '')
        setSlug(d.post.slug?.current || '')
        setExcerpt(d.post.excerpt || '')
        setCategory(d.post.category || 'educação financeira')
        setFunnel(d.post.funnel || 'tofu')
        setKeywords((d.post.seoKeywords || []).join(', '))
        setCoverUrl(d.post.coverImage?.url || '')
        setBodyMarkdown(d.post.bodyMarkdown || '')
        if (d.post.publishedAt) setPublishedLocal(isoToLocal(d.post.publishedAt))
      }
      setLoading(false)
    })
  }, [id, isEdit])

  const publishIso = localToIso(publishedLocal)
  const isScheduled = new Date(publishIso).getTime() > Date.now() + 60000

  async function save() {
    if (!title.trim()) { setErr('Dá um título antes de salvar.'); return }
    setSaving(true); setSaved(false); setErr('')
    const payload = {
      title, excerpt, category, funnel,
      keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
      bodyMarkdown, coverUrl,
      publishedAt: publishIso,
      ...(isEdit ? { id } : { slug }),
    }
    const res = await fetch('/api/admin/posts', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) { setErr(data.error || 'Erro ao salvar.'); return }
    setSaved(true)
    if (!isEdit && data.id) { router.push(`/admin/editar/${data.id}`); return }
    setTimeout(() => setSaved(false), 3000)
  }

  function publishNow() { setPublishedLocal(isoToLocal(new Date().toISOString())) }

  async function remove() {
    if (!isEdit) return
    if (!confirm('Excluir este artigo de vez? Não dá pra desfazer.')) return
    setDeleting(true)
    const res = await fetch(`/api/admin/posts/${id}`, { method: 'DELETE' })
    if (res.ok) { router.push('/admin') } else { setErr('Não consegui excluir.'); setDeleting(false) }
  }

  if (loading) return <p className="text-gray-400 text-center py-16 max-w-4xl mx-auto">Carregando artigo...</p>

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-6">
        <Link href="/admin" className="text-sm text-green-700 hover:underline">← Voltar ao painel</Link>
        <div className="flex items-center gap-3">
          {isEdit && slug && <a href={`/blog/${slug}`} target="_blank" className="text-sm text-gray-400 hover:text-green-700">Ver no site ↗</a>}
          {saved && <span className="text-sm text-green-600 font-semibold">✓ Salvo!</span>}
          <button onClick={save} disabled={saving} className="bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white font-bold text-sm px-5 py-2 rounded-xl transition-colors">
            {saving ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar artigo'}
          </button>
        </div>
      </div>

      <h1 className="text-2xl font-extrabold text-gray-900 mb-5">{isEdit ? 'Editar artigo' : 'Novo artigo'}</h1>
      {err && <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{err}</div>}

      <div className="space-y-5">
        {/* Título */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Título</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título do artigo"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400" />
        </div>

        {/* Publicação / agendamento */}
        <div className="bg-blue-50/50 border border-blue-200 rounded-2xl p-5">
          <p className="text-sm font-bold text-blue-900 mb-3">📅 Publicação</p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[220px]">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Data e hora</label>
              <input type="datetime-local" value={publishedLocal} onChange={e => setPublishedLocal(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
            <button type="button" onClick={publishNow} className="px-4 py-2.5 border border-blue-300 text-blue-700 rounded-xl text-sm font-semibold hover:bg-blue-100">
              Publicar agora
            </button>
          </div>
          <p className="text-xs mt-2 font-medium">
            {isScheduled
              ? <span className="text-amber-600">⏰ Agendado — só aparece no site na data marcada.</span>
              : <span className="text-green-700">✓ No ar / publicado nesta data.</span>}
          </p>
        </div>

        {/* SEO */}
        <div className="grid md:grid-cols-2 gap-4 bg-green-50/50 border border-green-200 rounded-2xl p-5">
          <div className="md:col-span-2"><p className="text-sm font-bold text-green-900">🔍 SEO e classificação</p></div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Meta descrição <span className={`font-normal ${excerpt.length > 160 ? 'text-red-500' : 'text-gray-400'}`}>({excerpt.length}/160)</span></label>
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
            <label className="block text-sm font-semibold text-gray-700 mb-1">Funil</label>
            <select value={funnel} onChange={e => setFunnel(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400">
              {FUNNELS.map(f => <option key={f.v} value={f.v}>{f.label}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Palavras-chave (separadas por vírgula)</label>
            <input value={keywords} onChange={e => setKeywords(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">URL da imagem de capa</label>
            <input value={coverUrl} onChange={e => setCoverUrl(e.target.value)} placeholder="https://..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400" />
            {coverUrl && /* eslint-disable-next-line @next/next/no-img-element */ (
              <img src={coverUrl} alt="capa" className="mt-2 h-28 rounded-lg object-cover" />
            )}
          </div>
        </div>

        {/* Corpo */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-bold text-gray-700">Conteúdo (Markdown)</label>
            <span className="text-xs text-gray-400">## título · **negrito** · - lista · &gt; citação · | tabela |</span>
          </div>
          <textarea value={bodyMarkdown} onChange={e => setBodyMarkdown(e.target.value)} rows={26}
            placeholder="## Comece aqui&#10;&#10;Escreva o conteúdo do artigo em markdown..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 leading-relaxed font-mono focus:outline-none focus:ring-2 focus:ring-green-400"
            style={{ minHeight: 460 }} />
        </div>

        <div className="flex items-center gap-3">
          <button onClick={save} disabled={saving} className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors">
            {saving ? 'Salvando...' : saved ? '✓ Salvo!' : isEdit ? 'Salvar alterações' : 'Criar artigo'}
          </button>
          {isEdit && (
            <button onClick={remove} disabled={deleting} className="px-5 py-3 border border-red-300 text-red-600 rounded-xl font-bold hover:bg-red-50 disabled:opacity-60">
              {deleting ? 'Excluindo...' : 'Excluir'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
