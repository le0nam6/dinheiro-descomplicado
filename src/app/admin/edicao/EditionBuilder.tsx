'use client'
import { useEffect, useState, useCallback } from 'react'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { nanoid } from 'nanoid'

// ── Types ────────────────────────────────────────────────────────────────────

type StoryFormat = 'standard' | 'brief' | 'deep' | 'stat'

type Block =
  | { _key: string; _type: 'storyBlock'; format: StoryFormat; emoji: string; tag: string; headline: string; sourceUrl: string; hook: string; what: string; why: string; deepStat?: string; deepImplication?: string; deepQuote?: string; statNumber?: string; statLabel?: string; image?: { url: string; alt: string; credit: string } }
  | { _key: string; _type: 'headlinesBlock'; sectionTitle: string; items: Array<{ _key: string; emoji: string; headline: string; sourceUrl: string }> }
  | { _key: string; _type: 'publiBlock'; sponsor: string; logoUrl: string; link: string; text: string }
  | { _key: string; _type: 'marketBlock'; items: Array<{ _key: string; label: string; value: string; changePct: number }> }
  | { _key: string; _type: 'curiosidadeBlock'; text: string }
  | { _key: string; _type: 'palavraBlock'; word: string; meaning: string; application: string }
  | { _key: string; _type: 'featuredPostsBlock'; posts: Array<{ _key: string; title: string; slug: string; excerpt: string; category: string }> }
  | { _key: string; _type: 'recomendacaoBlock'; text: string }
  | { _key: string; _type: 'reflexaoBlock'; text: string }

type IntroOption = { _key: string; punchline: string; intro: string }

type Candidate = { _key: string; idx: number; source: string; title: string; description: string; url: string; pubDate: string; selected: boolean; imageUrl?: string }

type Draft = { _id: string; date: string; number: number; status: string; introOptions: IntroOption[]; selectedIntroIndex?: number; title?: string; punchline?: string; intro?: string; closing?: string; blocks: Block[] }

// ── Block label helpers ───────────────────────────────────────────────────────

const BLOCK_LABELS: Record<string, string> = {
  storyBlock: 'Matéria', headlinesBlock: 'Headlines', publiBlock: 'Publi',
  marketBlock: 'Mercado', curiosidadeBlock: 'Curiosidade', palavraBlock: 'Palavra do dia',
  featuredPostsBlock: 'Você tb pode ler', recomendacaoBlock: 'Recomendação', reflexaoBlock: 'Reflexão',
}
const FORMAT_LABELS: Record<StoryFormat, string> = {
  standard: 'Standard', brief: 'Brief', deep: 'Deep', stat: 'Stat',
}
const FORMAT_COLORS: Record<StoryFormat, string> = {
  standard: 'bg-blue-100 text-blue-700',
  brief: 'bg-gray-100 text-gray-600',
  deep: 'bg-purple-100 text-purple-700',
  stat: 'bg-amber-100 text-amber-700',
}

// ── SortableBlock wrapper ────────────────────────────────────────────────────

function SortableBlock({ block, onRemove, onChange, storyHeadlines }: {
  block: Block
  onRemove: () => void
  onChange: (b: Block) => void
  storyHeadlines: string[]
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block._key })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }
  const [expanded, setExpanded] = useState(false)

  return (
    <div ref={setNodeRef} style={style} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button {...attributes} {...listeners} className="cursor-grab text-gray-300 hover:text-gray-500 shrink-0" title="Arrastar">
          <svg width="14" height="20" viewBox="0 0 14 20" fill="currentColor"><circle cx="4" cy="4" r="1.5"/><circle cx="10" cy="4" r="1.5"/><circle cx="4" cy="10" r="1.5"/><circle cx="10" cy="10" r="1.5"/><circle cx="4" cy="16" r="1.5"/><circle cx="10" cy="16" r="1.5"/></svg>
        </button>
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-28 shrink-0">{BLOCK_LABELS[block._type]}</span>
        {block._type === 'storyBlock' && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${FORMAT_COLORS[block.format]}`}>{FORMAT_LABELS[block.format]}</span>
        )}
        <span className="flex-1 text-sm text-gray-700 truncate">
          {block._type === 'storyBlock' ? block.headline || '(sem manchete)' :
           block._type === 'headlinesBlock' ? block.sectionTitle :
           block._type === 'publiBlock' ? block.sponsor || '(sem patrocinador)' :
           block._type === 'marketBlock' ? `${block.items?.length ?? 0} ativos` :
           block._type === 'curiosidadeBlock' ? block.text?.slice(0, 60) || '' :
           block._type === 'palavraBlock' ? block.word || '' :
           block._type === 'featuredPostsBlock' ? `${block.posts?.length ?? 0} posts` :
           block._type === 'recomendacaoBlock' ? block.text?.slice(0, 60) || '' :
           block._type === 'reflexaoBlock' ? block.text?.slice(0, 60) || '' : ''}
        </span>
        <button onClick={() => setExpanded(e => !e)} className="text-xs text-gray-400 hover:text-gray-600 px-1 shrink-0">
          {expanded ? '▲' : '▼'}
        </button>
        <button onClick={onRemove} className="text-gray-300 hover:text-red-500 shrink-0" title="Remover">✕</button>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 p-3 space-y-2">
          <BlockEditor block={block} onChange={onChange} storyHeadlines={storyHeadlines} />
        </div>
      )}
    </div>
  )
}

// ── Block inline editors ─────────────────────────────────────────────────────

function Field({ label, value, onChange, multiline = false, placeholder = '' }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={2} className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-green-400" />
        : <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-400" />
      }
    </div>
  )
}

function BlockEditor({ block, onChange, storyHeadlines }: { block: Block; onChange: (b: Block) => void; storyHeadlines: string[] }) {
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')

  async function generateWithAI() {
    if (block._type !== 'storyBlock') return
    setGenerating(true); setGenError('')
    try {
      const res = await fetch('/api/admin/edition-generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headline: block.headline, hook: block.hook, sourceUrl: block.sourceUrl, format: block.format }),
      }).then(r => r.json())
      if (res.error) { setGenError(res.error); return }
      onChange({ ...block, ...res.fields })
    } catch (e) { setGenError(String(e)) }
    finally { setGenerating(false) }
  }

  async function generateExtra(type: 'curiosidade' | 'palavra') {
    setGenerating(true); setGenError('')
    try {
      const res = await fetch('/api/admin/edition-generate-extras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, headlines: storyHeadlines }),
      }).then(r => r.json())
      if (res.error) { setGenError(res.error); return }
      if (type === 'curiosidade' && block._type === 'curiosidadeBlock') onChange({ ...block, text: res.text })
      if (type === 'palavra' && block._type === 'palavraBlock') onChange({ ...block, ...res.fields })
    } catch (e) { setGenError(String(e)) }
    finally { setGenerating(false) }
  }

  async function fetchMarketQuotes() {
    if (block._type !== 'marketBlock') return
    setGenerating(true); setGenError('')
    try {
      const res = await fetch('/api/quotes').then(r => r.json())
      if (!res.ok) { setGenError('Erro ao buscar cotações'); return }
      const quotes: Array<{ symbol: string; label: string; price: number; changePct: number }> = res.quotes

      function fmt(price: number, label: string) {
        if (label.includes('BTC') || label.includes('Bitcoin') || label.includes('IBOV') || label.includes('bovespa') || price > 10000)
          return Math.round(price).toLocaleString('pt-BR')
        return price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      }

      function match(label: string) {
        const l = label.toLowerCase()
        if (l.includes('usd') || l.includes('dólar') || l.includes('dollar')) return quotes.find(q => q.symbol === 'USDBRL')
        if (l.includes('ibov') || l.includes('bovespa')) return quotes.find(q => q.symbol.includes('BVSP') || q.label.toLowerCase().includes('ibov'))
        if (l.includes('btc') || l.includes('bitcoin')) return quotes.find(q => q.symbol === 'BTCBRL')
        if (l.includes('eur') || l.includes('euro')) return quotes.find(q => q.symbol === 'EURBRL')
        if (l.includes('eth') || l.includes('ethereum')) return quotes.find(q => q.symbol === 'ETHBRL')
        if (l.includes('s&p') || l.includes('sp500')) return quotes.find(q => q.symbol.includes('GSPC') || q.label.includes('S&P'))
        return null
      }

      const updated = block.items.map(item => {
        const q = match(item.label)
        if (!q) return item
        return { ...item, value: fmt(q.price, item.label), changePct: parseFloat(q.changePct.toFixed(2)) }
      })
      onChange({ ...block, items: updated })
    } catch (e) { setGenError(String(e)) }
    finally { setGenerating(false) }
  }

  if (block._type === 'storyBlock') {
    const set = (k: string, v: string) => onChange({ ...block, [k]: v })
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          {(['brief', 'standard', 'deep', 'stat'] as StoryFormat[]).map(f => (
            <button key={f} onClick={() => onChange({ ...block, format: f })}
              className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${block.format === f ? FORMAT_COLORS[f] + ' ring-1 ring-current' : 'bg-gray-100 text-gray-500'}`}>
              {FORMAT_LABELS[f]}
            </button>
          ))}
          <button
            onClick={generateWithAI}
            disabled={generating || !block.headline}
            className="ml-auto text-xs font-bold px-3 py-1 rounded-full bg-violet-100 text-violet-700 hover:bg-violet-200 disabled:opacity-50 transition-colors"
          >
            {generating ? '⏳ Gerando…' : '✨ Gerar com IA'}
          </button>
        </div>
        {genError && <p className="text-xs text-red-500">{genError}</p>}
        <div className="grid grid-cols-2 gap-2">
          <Field label="Emoji" value={block.emoji || ''} onChange={v => set('emoji', v)} placeholder="💰" />
          <Field label="Editoria (tag)" value={block.tag || ''} onChange={v => set('tag', v)} placeholder="Economia" />
        </div>
        <Field label="Manchete" value={block.headline || ''} onChange={v => set('headline', v)} />
        <Field label="URL da fonte" value={block.sourceUrl || ''} onChange={v => set('sourceUrl', v)} placeholder="https://..." />
        {block.format !== 'brief' && <>
          <Field label="Gancho" value={block.hook || ''} onChange={v => set('hook', v)} multiline />
          <Field label="O que aconteceu" value={block.what || ''} onChange={v => set('what', v)} multiline />
          <Field label="Por que importa" value={block.why || ''} onChange={v => set('why', v)} multiline />
        </>}
        {block.format === 'brief' && (
          <Field label="Gancho" value={block.hook || ''} onChange={v => set('hook', v)} multiline />
        )}
        {block.format === 'deep' && <>
          <Field label="Dado em destaque" value={block.deepStat || ''} onChange={v => set('deepStat', v)} />
          <Field label="Implicação prática" value={block.deepImplication || ''} onChange={v => set('deepImplication', v)} multiline />
          <Field label="Citação / pull quote" value={block.deepQuote || ''} onChange={v => set('deepQuote', v)} multiline />
        </>}
        {block.format === 'stat' && <>
          <Field label="O número" value={block.statNumber || ''} onChange={v => set('statNumber', v)} placeholder="R$ 1,2 trilhão" />
          <Field label="O que significa" value={block.statLabel || ''} onChange={v => set('statLabel', v)} />
        </>}
        <div className="pt-1 border-t border-gray-100 space-y-1.5">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-500 flex-1">Imagem</label>
            <button
              onClick={async () => {
                if (!block.sourceUrl) return
                setGenerating(true)
                try {
                  const res = await fetch(`/api/admin/edition-fetch-og?url=${encodeURIComponent(block.sourceUrl)}`).then(r => r.json())
                  if (res.imageUrl) onChange({ ...block, image: { url: res.imageUrl, alt: block.headline || '', credit: '' } })
                  else setGenError('Imagem não encontrada nessa URL')
                } catch { setGenError('Erro ao buscar imagem') }
                finally { setGenerating(false) }
              }}
              disabled={generating || !block.sourceUrl}
              className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              {generating ? '⏳' : '🖼️ Buscar imagem'}
            </button>
          </div>
          <input type="text" value={block.image?.url || ''} onChange={e => onChange({ ...block, image: { url: e.target.value, alt: block.image?.alt || block.headline || '', credit: block.image?.credit || '' } })} placeholder="https://..." className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-400" />
          {block.image?.url && (
            <img src={block.image.url} alt={block.image.alt || ''} className="w-full h-32 object-cover rounded-lg border border-gray-200" />
          )}
        </div>
      </div>
    )
  }

  if (block._type === 'headlinesBlock') {
    return (
      <div className="space-y-2">
        <Field label="Título da seção" value={block.sectionTitle || ''} onChange={v => onChange({ ...block, sectionTitle: v })} />
        <div className="space-y-1.5">
          {(block.items || []).map((item, i) => (
            <div key={item._key} className="flex gap-2 items-start">
              <input type="text" value={item.emoji || ''} onChange={e => { const items = [...block.items]; items[i] = { ...items[i], emoji: e.target.value }; onChange({ ...block, items }) }} placeholder="🌍" className="w-10 text-sm border border-gray-200 rounded px-1.5 py-1 text-center focus:outline-none" />
              <input type="text" value={item.headline || ''} onChange={e => { const items = [...block.items]; items[i] = { ...items[i], headline: e.target.value }; onChange({ ...block, items }) }} placeholder="Manchete" className="flex-1 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none" />
              <input type="text" value={item.sourceUrl || ''} onChange={e => { const items = [...block.items]; items[i] = { ...items[i], sourceUrl: e.target.value }; onChange({ ...block, items }) }} placeholder="URL" className="flex-1 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none" />
              <button onClick={() => onChange({ ...block, items: block.items.filter((_, j) => j !== i) })} className="text-gray-300 hover:text-red-500 text-sm">✕</button>
            </div>
          ))}
        </div>
        <button onClick={() => onChange({ ...block, items: [...(block.items || []), { _key: nanoid(8), emoji: '', headline: '', sourceUrl: '' }] })}
          className="text-xs font-semibold text-green-700 hover:text-green-600">+ Adicionar headline</button>
      </div>
    )
  }

  if (block._type === 'publiBlock') {
    const set = (k: string, v: string) => onChange({ ...block, [k]: v })
    return (
      <div className="space-y-2">
        <Field label="Patrocinador" value={block.sponsor || ''} onChange={v => set('sponsor', v)} />
        <Field label="Logo URL" value={block.logoUrl || ''} onChange={v => set('logoUrl', v)} placeholder="https://..." />
        <Field label="Link" value={block.link || ''} onChange={v => set('link', v)} placeholder="https://..." />
        <Field label="Texto do publi" value={block.text || ''} onChange={v => set('text', v)} multiline />
      </div>
    )
  }

  if (block._type === 'marketBlock') {
    return (
      <div className="space-y-2">
        <div className="flex justify-end">
          <button onClick={fetchMarketQuotes} disabled={generating}
            className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50 transition-colors">
            {generating ? '⏳ Buscando…' : '🔄 Buscar cotações'}
          </button>
        </div>
        {genError && <p className="text-xs text-red-500">{genError}</p>}
        <div className="space-y-1.5">
          {(block.items || []).map((item, i) => (
            <div key={item._key} className="flex gap-2 items-center">
              <input type="text" value={item.label || ''} onChange={e => { const items = [...block.items]; items[i] = { ...items[i], label: e.target.value }; onChange({ ...block, items }) }} placeholder="USD/BRL" className="flex-1 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none" />
              <input type="text" value={item.value || ''} onChange={e => { const items = [...block.items]; items[i] = { ...items[i], value: e.target.value }; onChange({ ...block, items }) }} placeholder="5,85" className="w-20 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none" />
              <input type="number" value={item.changePct ?? ''} onChange={e => { const items = [...block.items]; items[i] = { ...items[i], changePct: parseFloat(e.target.value) || 0 }; onChange({ ...block, items }) }} placeholder="0.5" className="w-20 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none" />
              <button onClick={() => onChange({ ...block, items: block.items.filter((_, j) => j !== i) })} className="text-gray-300 hover:text-red-500">✕</button>
            </div>
          ))}
        </div>
        <button onClick={() => onChange({ ...block, items: [...(block.items || []), { _key: nanoid(8), label: '', value: '', changePct: 0 }] })}
          className="text-xs font-semibold text-green-700 hover:text-green-600">+ Adicionar ativo</button>
      </div>
    )
  }

  if (block._type === 'curiosidadeBlock') {
    return (
      <div className="space-y-2">
        <div className="flex justify-end">
          <button onClick={() => generateExtra('curiosidade')} disabled={generating}
            className="text-xs font-bold px-3 py-1 rounded-full bg-violet-100 text-violet-700 hover:bg-violet-200 disabled:opacity-50 transition-colors">
            {generating ? '⏳ Gerando…' : '✨ Gerar com IA'}
          </button>
        </div>
        {genError && <p className="text-xs text-red-500">{genError}</p>}
        <Field label="Curiosidade" value={block.text || ''} onChange={v => onChange({ ...block, text: v })} multiline />
      </div>
    )
  }

  if (block._type === 'palavraBlock') {
    return (
      <div className="space-y-2">
        <div className="flex justify-end">
          <button onClick={() => generateExtra('palavra')} disabled={generating}
            className="text-xs font-bold px-3 py-1 rounded-full bg-violet-100 text-violet-700 hover:bg-violet-200 disabled:opacity-50 transition-colors">
            {generating ? '⏳ Gerando…' : '✨ Gerar com IA'}
          </button>
        </div>
        {genError && <p className="text-xs text-red-500">{genError}</p>}
        <Field label="Termo" value={block.word || ''} onChange={v => onChange({ ...block, word: v })} />
        <Field label="O que significa" value={block.meaning || ''} onChange={v => onChange({ ...block, meaning: v })} multiline />
        <Field label="Aplicação prática" value={block.application || ''} onChange={v => onChange({ ...block, application: v })} multiline />
      </div>
    )
  }

  if (block._type === 'featuredPostsBlock') {
    return (
      <div className="space-y-2">
        {(block.posts || []).map((post, i) => (
          <div key={post._key} className="flex gap-2 items-center">
            <input type="text" value={post.title || ''} onChange={e => { const posts = [...block.posts]; posts[i] = { ...posts[i], title: e.target.value }; onChange({ ...block, posts }) }} placeholder="Título" className="flex-1 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none" />
            <input type="text" value={post.slug || ''} onChange={e => { const posts = [...block.posts]; posts[i] = { ...posts[i], slug: e.target.value }; onChange({ ...block, posts }) }} placeholder="slug-do-post" className="flex-1 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none" />
            <button onClick={() => onChange({ ...block, posts: block.posts.filter((_, j) => j !== i) })} className="text-gray-300 hover:text-red-500">✕</button>
          </div>
        ))}
        <button onClick={() => onChange({ ...block, posts: [...(block.posts || []), { _key: nanoid(8), title: '', slug: '', excerpt: '', category: '' }] })}
          className="text-xs font-semibold text-green-700 hover:text-green-600">+ Adicionar post</button>
      </div>
    )
  }

  if (block._type === 'recomendacaoBlock' || block._type === 'reflexaoBlock') {
    return <Field label="Texto" value={block.text || ''} onChange={v => onChange({ ...block, text: v })} multiline />
  }

  return null
}

// ── Add block palette ────────────────────────────────────────────────────────

const PALETTE = [
  { type: 'headlinesBlock', label: '📋 Headlines', init: () => ({ _type: 'headlinesBlock', sectionTitle: 'Headlines pelo mundo', items: [] }) },
  { type: 'publiBlock', label: '💼 Publi', init: () => ({ _type: 'publiBlock', sponsor: '', logoUrl: '', link: '', text: '' }) },
  { type: 'marketBlock', label: '📊 Mercado', init: () => ({ _type: 'marketBlock', items: [{ label: 'USD/BRL', value: '', changePct: 0 }, { label: 'IBOV', value: '', changePct: 0 }, { label: 'BTC', value: '', changePct: 0 }, { label: 'CDI', value: '', changePct: 0 }].map(i => ({ ...i, _key: nanoid(8) })) }) },
  { type: 'curiosidadeBlock', label: '💡 Curiosidade', init: () => ({ _type: 'curiosidadeBlock', text: '' }) },
  { type: 'palavraBlock', label: '📚 Palavra do dia', init: () => ({ _type: 'palavraBlock', word: '', meaning: '', application: '' }) },
  { type: 'featuredPostsBlock', label: '📖 Você tb pode ler', init: () => ({ _type: 'featuredPostsBlock', posts: [] }) },
  { type: 'recomendacaoBlock', label: '🍿 Recomendação', init: () => ({ _type: 'recomendacaoBlock', text: '' }) },
  { type: 'reflexaoBlock', label: '🌅 Reflexão', init: () => ({ _type: 'reflexaoBlock', text: '' }) },
]

// ── Main component ────────────────────────────────────────────────────────────

export function EditionBuilder() {
  const [draft, setDraft] = useState<Draft | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [blocks, setBlocks] = useState<Block[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [scheduling, setScheduling] = useState(false)
  const [generatingIntro, setGeneratingIntro] = useState(false)
  const [sendingPreview, setSendingPreview] = useState(false)
  const [previewEmail, setPreviewEmail] = useState('')
  const [showEmailInput, setShowEmailInput] = useState(false)
  const [error, setError] = useState('')
  const [selectedIntro, setSelectedIntro] = useState<number | null>(null)
  const [searchQ, setSearchQ] = useState('')
  const [date, setDate] = useState(() => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date()))

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const load = useCallback(async (d: string) => {
    const [draftRes, candRes] = await Promise.all([
      fetch(`/api/admin/edition-draft?date=${d}`).then(r => r.json()),
      fetch(`/api/admin/edition-candidates?date=${d}`).then(r => r.json()),
    ])
    setDraft(draftRes.draft)
    setBlocks(draftRes.draft?.blocks ?? [])
    setSelectedIntro(draftRes.draft?.selectedIntroIndex ?? null)
    setCandidates(candRes.candidates ?? [])
  }, [])

  useEffect(() => { load(date) }, [date, load])

  const save = useCallback(async (b: Block[], introIdx: number | null, extra: Record<string, string> = {}) => {
    if (!draft) return
    setSaving(true); setSaved(false)
    const intro = introIdx !== null ? draft.introOptions?.[introIdx] : null
    await fetch('/api/admin/edition-draft', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: draft._id, blocks: b, selectedIntroIndex: introIdx,
        punchline: intro?.punchline ?? draft.punchline ?? '',
        intro: intro?.intro ?? draft.intro ?? '',
        ...extra,
      }),
    })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [draft])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = blocks.findIndex(b => b._key === active.id)
    const newIdx = blocks.findIndex(b => b._key === over.id)
    const next = arrayMove(blocks, oldIdx, newIdx)
    setBlocks(next)
    save(next, selectedIntro)
  }

  function addCandidateAsStory(c: Candidate, format: StoryFormat = 'standard') {
    const image = c.imageUrl ? { url: c.imageUrl, alt: c.title, credit: '' } : undefined
    const block: Block = {
      _key: nanoid(8), _type: 'storyBlock', format,
      emoji: '', tag: '', headline: c.title, sourceUrl: c.url,
      hook: c.description || '', what: '', why: '',
      ...(image ? { image } : {}),
    }
    const next = [...blocks, block]
    setBlocks(next)
    save(next, selectedIntro)

    // Se não havia imageUrl pré-carregado, busca em background
    if (!c.imageUrl && c.url) {
      fetch(`/api/admin/edition-fetch-og?url=${encodeURIComponent(c.url)}`)
        .then(r => r.json())
        .then(res => {
          if (!res.imageUrl) return
          const withImage: Block = { ...block, image: { url: res.imageUrl, alt: c.title, credit: '' } }
          setBlocks(prev => {
            const updated = prev.map(b => b._key === block._key ? withImage : b)
            save(updated, selectedIntro)
            return updated
          })
        })
        .catch(() => {})
    }
  }

  function addBlock(type: string) {
    const palette = PALETTE.find(p => p.type === type)
    if (!palette) return
    const block = { ...palette.init(), _key: nanoid(8) } as Block
    const next = [...blocks, block]
    setBlocks(next)
    save(next, selectedIntro)
  }

  function updateBlock(key: string, updated: Block) {
    const next = blocks.map(b => b._key === key ? updated : b)
    setBlocks(next)
    save(next, selectedIntro)
  }

  function removeBlock(key: string) {
    const next = blocks.filter(b => b._key !== key)
    setBlocks(next)
    save(next, selectedIntro)
  }

  function pickIntro(idx: number) {
    setSelectedIntro(idx)
    save(blocks, idx)
  }

  async function schedule() {
    if (!draft) return
    setScheduling(true); setError('')
    const res = await fetch('/api/admin/edition-schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: draft._id }),
    }).then(r => r.json())
    setScheduling(false)
    if (res.error) { setError(res.error); return }
    await load(date)
  }

  async function sendPreview() {
    if (!draft || !previewEmail) return
    setSendingPreview(true)
    const res = await fetch('/api/admin/test-edition-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: previewEmail, draftId: draft._id }),
    }).then(r => r.json())
    setSendingPreview(false)
    if (res.error) { setError(res.error); return }
    setShowEmailInput(false)
  }

  async function unschedule() {
    if (!draft) return
    await fetch('/api/admin/edition-schedule', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: draft._id }),
    })
    await load(date)
  }

  const filteredCandidates = candidates.filter(c =>
    !searchQ || c.title.toLowerCase().includes(searchQ.toLowerCase()) || c.source.toLowerCase().includes(searchQ.toLowerCase())
  )

  const addedUrls = new Set(blocks.filter(b => b._type === 'storyBlock').map(b => (b as { sourceUrl?: string }).sourceUrl).filter(Boolean))
  const storyHeadlines = blocks.filter(b => b._type === 'storyBlock').map(b => (b as { headline?: string }).headline).filter(Boolean) as string[]

  async function regenerateIntro() {
    if (!draft) return
    setGeneratingIntro(true)
    try {
      const res = await fetch('/api/admin/edition-generate-extras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'intro', headlines: storyHeadlines, draftId: draft._id }),
      }).then(r => r.json())
      if (res.error) { setError(res.error); return }
      setDraft(d => d ? { ...d, introOptions: res.introOptions, selectedIntroIndex: undefined } : d)
      setSelectedIntro(null)
    } catch (e) { setError(String(e)) }
    finally { setGeneratingIntro(false) }
  }

  if (!draft) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 p-8">
        <div className="text-4xl">📋</div>
        <p className="text-gray-600 text-center max-w-md">
          Nenhum rascunho encontrado para {date}.<br />
          Dispare o cron de candidatos para gerar um.
        </p>
        <div className="flex gap-2 items-center">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <button onClick={() => load(date)} className="bg-gray-800 text-white text-sm font-semibold px-4 py-2 rounded-lg">Recarregar</button>
        </div>
      </div>
    )
  }

  const isScheduled = draft.status === 'agendado'
  const isSent = draft.status === 'enviado'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 sticky top-0 z-10">
        <a href="/admin" className="text-sm text-gray-500 hover:text-gray-700">← Admin</a>
        <span className="text-gray-300">|</span>
        <h1 className="font-bold text-gray-900 text-sm">Edição #{draft.number} — {draft.date}</h1>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isSent ? 'bg-green-100 text-green-700' : isScheduled ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
          {isSent ? '✅ Enviada' : isScheduled ? '🗓 Agendada para 5h' : '✏️ Rascunho'}
        </span>
        <span className="flex-1" />
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-600 focus:outline-none" />
        {saving && <span className="text-xs text-gray-400">Salvando…</span>}
        {saved && <span className="text-xs text-green-600 font-semibold">✓ Salvo</span>}
        <button
          onClick={() => window.open(`/api/admin/edition-preview?id=${draft?._id}`, '_blank')}
          disabled={!draft}
          className="text-sm bg-white border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-40"
        >
          👁 Preview
        </button>
        {showEmailInput ? (
          <div className="flex items-center gap-1">
            <input
              type="email"
              value={previewEmail}
              onChange={e => setPreviewEmail(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') sendPreview(); if (e.key === 'Escape') setShowEmailInput(false) }}
              placeholder="seu@email.com"
              autoFocus
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 w-48 focus:outline-none focus:ring-1 focus:ring-orange-400"
            />
            <button onClick={sendPreview} disabled={sendingPreview || !previewEmail}
              className="text-sm bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-bold px-3 py-2 rounded-lg transition-colors">
              {sendingPreview ? '⏳' : 'Enviar'}
            </button>
            <button onClick={() => setShowEmailInput(false)} className="text-gray-400 hover:text-gray-600 px-1">✕</button>
          </div>
        ) : (
          <button
            onClick={() => setShowEmailInput(true)}
            disabled={!draft}
            className="text-sm bg-white border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-40"
          >
            📧 Prévia por e-mail
          </button>
        )}
        {!isSent && (
          isScheduled
            ? <button onClick={unschedule} className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-4 py-2 rounded-lg transition-colors">Voltar para rascunho</button>
            : <button onClick={schedule} disabled={scheduling} className="text-sm bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white font-bold px-5 py-2 rounded-lg transition-colors">
                {scheduling ? 'Agendando…' : '🗓 Agendar para 5h'}
              </button>
        )}
      </div>
      {error && <div className="bg-red-50 border-b border-red-200 px-6 py-2 text-sm text-red-700">{error}</div>}

      <div className="flex h-[calc(100vh-57px)]">
        {/* Left: candidates */}
        <aside className="w-96 shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Candidatos do dia ({candidates.length})</p>
            <input
              type="search" value={searchQ} onChange={e => setSearchQ(e.target.value)}
              placeholder="Buscar…"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-400"
            />
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {filteredCandidates.map(c => {
              const alreadyAdded = addedUrls.has(c.url)
              return (
                <div key={c._key} className={`p-3 ${alreadyAdded ? 'opacity-40' : ''}`}>
                  <div className="flex items-start gap-2">
                    {c.imageUrl && (
                      <img src={c.imageUrl} alt="" className="w-16 h-12 object-cover rounded-lg shrink-0 border border-gray-100" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-green-700 mb-0.5 truncate">{c.source}</p>
                      <p className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2">{c.title}</p>
                      {c.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{c.description}</p>}
                      {c.url && (
                        <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mt-0.5 inline-block">
                          Abrir ↗
                        </a>
                      )}
                    </div>
                  </div>
                  {!alreadyAdded && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {(['standard', 'brief', 'deep', 'stat'] as StoryFormat[]).map(f => (
                        <button key={f} onClick={() => addCandidateAsStory(c, f)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors hover:opacity-80 ${FORMAT_COLORS[f]} border-current`}>
                          + {FORMAT_LABELS[f]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
            {filteredCandidates.length === 0 && (
              <div className="p-6 text-center text-sm text-gray-400">Nenhum candidato encontrado</div>
            )}
          </div>
        </aside>

        {/* Right: builder */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Intro picker */}
          <section>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex-1">Abertura</h2>
              <button
                onClick={regenerateIntro}
                disabled={generatingIntro || storyHeadlines.length === 0}
                title={storyHeadlines.length === 0 ? 'Adicione matérias primeiro' : 'Gerar abertura com base nas histórias selecionadas'}
                className="text-xs font-bold px-3 py-1 rounded-full bg-violet-100 text-violet-700 hover:bg-violet-200 disabled:opacity-40 transition-colors"
              >
                {generatingIntro ? '⏳ Gerando…' : '✨ Gerar abertura das histórias'}
              </button>
            </div>
            {(draft.introOptions?.length > 0) ? (
              <div className="grid grid-cols-1 gap-3">
                {draft.introOptions.map((opt, i) => (
                  <button key={opt._key || i} onClick={() => pickIntro(i)}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${selectedIntro === i ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                    <p className="font-bold text-gray-900 text-sm mb-1">{opt.punchline}</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{opt.intro}</p>
                    {selectedIntro === i && <p className="text-xs text-green-600 font-semibold mt-2">✓ Selecionada</p>}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4 border-2 border-dashed border-gray-200 rounded-xl">
                {storyHeadlines.length === 0 ? 'Adicione matérias e clique em "Gerar abertura das histórias"' : 'Clique em "✨ Gerar abertura das histórias" para criar as opções'}
              </p>
            )}
          </section>

          {/* Blocks */}
          <section>
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
              Blocos da edição ({blocks.length})
            </h2>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={blocks.map(b => b._key)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {blocks.map(block => (
                    <SortableBlock
                      key={block._key}
                      block={block}
                      onRemove={() => removeBlock(block._key)}
                      onChange={updated => updateBlock(block._key, updated)}
                      storyHeadlines={storyHeadlines}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {blocks.length === 0 && (
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                <p className="text-gray-400 text-sm">Adicione blocos pelos candidatos à esquerda ou pelo menu abaixo</p>
              </div>
            )}

            {/* Add block palette */}
            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-400 mb-2">Adicionar seção</p>
              <div className="flex flex-wrap gap-2">
                {PALETTE.map(p => (
                  <button key={p.type} onClick={() => addBlock(p.type)}
                    className="text-xs bg-white border border-gray-200 hover:border-gray-400 text-gray-700 font-semibold px-3 py-1.5 rounded-lg transition-colors">
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
