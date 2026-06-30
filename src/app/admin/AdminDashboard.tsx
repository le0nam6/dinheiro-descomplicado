'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type Post = { _id: string; title: string; slug: { current: string }; category: string; funnel: string; publishedAt: string; excerpt: string }
type Milestone = { count: number; emoji: string; label: string; reward: string }
type QueueItem = { _id: string; kind: 'noticia' | 'materia' | 'curiosidade'; brief: string; priority: number; status: string; createdAt?: string; source?: string }
type UsedItem = { _id: string; kind: string; brief: string; usedAt?: string; usedRef?: string }
type IgPost = { _id: string; title: string; slug: string; publishedAt: string; igExportUrl: string; igCaption: string; igCanvaDesignId: string }

const QUEUE_KINDS: { value: QueueItem['kind']; label: string; emoji: string }[] = [
  { value: 'noticia',     label: 'Notícia (tema)', emoji: '📰' },
  { value: 'materia',     label: 'Matéria própria', emoji: '📝' },
  { value: 'curiosidade', label: 'Curiosidade',     emoji: '💡' },
]

export function AdminDashboard() {
  const [tab, setTab] = useState<'posts' | 'fila' | 'instagram' | 'settings' | 'email' | 'fluxos'>('posts')
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  // Settings state
  const [goal, setGoal] = useState(100)
  const [reward, setReward] = useState('sortearemos um livro de finanças entre todos os inscritos')
  const [milestones, setMilestones] = useState<Milestone[]>([
    { count: 1,  emoji: '🌱', label: 'Poupador Ativo',          reward: 'Acesso ao grupo exclusivo no Telegram' },
    { count: 3,  emoji: '📊', label: 'Investidor Descoberto',   reward: 'Planilha de controle financeiro personalizada' },
    { count: 5,  emoji: '💼', label: 'Gestor de Dinheiro',      reward: 'Kit Digital Endinheirados (guias + templates)' },
    { count: 10, emoji: '🏆', label: 'Guardião da Grana',       reward: 'Menção especial na newsletter + badge exclusivo' },
    { count: 20, emoji: '👑', label: 'Embaixador Endinheirado', reward: 'Acesso antecipado a conteúdos e ferramentas' },
  ])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [testEmail, setTestEmail] = useState('leonamalvesllap@gmail.com')
  const [testSending, setTestSending] = useState(false)
  const [testSent, setTestSent] = useState(false)
  const [campaignSending, setCampaignSending] = useState(false)
  const [campaignResult, setCampaignResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [syncSending, setSyncSending] = useState(false)
  const [syncResult, setSyncResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [migrating, setMigrating] = useState(false)
  const [migrateResult, setMigrateResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [migratingTitles, setMigratingTitles] = useState(false)
  const [migrateTitlesResult, setMigrateTitlesResult] = useState<{ ok: boolean; msg: string } | null>(null)

  // Instagram pendente
  const [igPosts, setIgPosts] = useState<IgPost[]>([])
  const [igLoading, setIgLoading] = useState(true)
  const [igPublishing, setIgPublishing] = useState<string | null>(null)
  const [igResult, setIgResult] = useState<Record<string, { ok: boolean; msg: string }>>({})

  async function loadIgPosts() {
    setIgLoading(true)
    const d = await fetch('/api/admin/ig-posts').then(r => r.json()).catch(() => null)
    setIgPosts(d?.posts || [])
    setIgLoading(false)
  }

  async function approveIgPost(id: string) {
    setIgPublishing(id)
    try {
      const res = await fetch(`/api/admin/ig-approve?postId=${id}`, { method: 'POST' })
      const d = await res.json()
      setIgResult(prev => ({ ...prev, [id]: d.ok ? { ok: true, msg: 'Publicado!' } : { ok: false, msg: d.error || 'Erro' } }))
      if (d.ok) setIgPosts(prev => prev.filter(p => p._id !== id))
    } catch (e) {
      setIgResult(prev => ({ ...prev, [id]: { ok: false, msg: String(e) } }))
    }
    setIgPublishing(null)
  }

  // Fila editorial
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [used, setUsed] = useState<UsedItem[]>([])
  const [queueLoading, setQueueLoading] = useState(true)
  const [newKind, setNewKind] = useState<QueueItem['kind']>('noticia')
  const [newBrief, setNewBrief] = useState('')
  const [newPriority, setNewPriority] = useState(0)
  const [adding, setAdding] = useState(false)

  async function loadQueue() {
    setQueueLoading(true)
    const d = await fetch('/api/admin/queue').then(r => r.json()).catch(() => null)
    setQueue(d?.queue || [])
    setUsed(d?.used || [])
    setQueueLoading(false)
  }

  async function addQueue() {
    if (!newBrief.trim()) return
    setAdding(true)
    await fetch('/api/admin/queue', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: newKind, brief: newBrief, priority: newPriority }),
    })
    setNewBrief(''); setNewPriority(0)
    setAdding(false)
    loadQueue()
  }

  async function discardQueue(id: string) {
    await fetch('/api/admin/queue', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'descartado' }),
    })
    loadQueue()
  }

  async function setQueuePriority(id: string, priority: number) {
    setQueue(q => q.map(i => i._id === id ? { ...i, priority } : i))
    await fetch('/api/admin/queue', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, priority }),
    })
    loadQueue()
  }

  useEffect(() => {
    fetch('/api/admin/posts').then(r => r.json()).then(d => { setPosts(d.posts || []); setLoading(false) })
    loadIgPosts()
    fetch('/api/admin/settings').then(r => r.json()).then(d => {
      if (d.subscriberGoal) setGoal(d.subscriberGoal)
      if (d.subscriberGoalReward) setReward(d.subscriberGoalReward)
      if (d.referralMilestones?.length) setMilestones(d.referralMilestones)
    })
    loadQueue()
  }, [])

  const filtered = posts.filter(p => p.title.toLowerCase().includes(filter.toLowerCase()))
  const scheduled = posts.filter(p => new Date(p.publishedAt).getTime() > Date.now()).length

  function updateMilestone(i: number, field: keyof Milestone, value: string | number) {
    setMilestones(ms => ms.map((m, idx) => idx === i ? { ...m, [field]: field === 'count' ? Number(value) : value } : m))
  }

  function addMilestone() {
    setMilestones(ms => [...ms, { count: 0, emoji: '🎯', label: 'Nova meta', reward: '' }])
  }

  function removeMilestone(i: number) {
    setMilestones(ms => ms.filter((_, idx) => idx !== i))
  }

  async function sendTestEditionEmail() {
    setTestSending(true)
    await fetch('/api/admin/test-edition-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail }),
    })
    setTestSending(false)
    setTestSent(true)
    setTimeout(() => setTestSent(false), 3000)
  }

  async function sendEditionCampaign() {
    setCampaignSending(true)
    setCampaignResult(null)
    try {
      const res = await fetch('/api/admin/send-edition-campaign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      const data = await res.json()
      if (data.ok) setCampaignResult({ ok: true, msg: `Campanha disparada: "${data.title}" (${data.date})` })
      else setCampaignResult({ ok: false, msg: data.error || 'Erro desconhecido' })
    } catch (e) {
      setCampaignResult({ ok: false, msg: String(e) })
    }
    setCampaignSending(false)
  }

  async function syncCronJob() {
    setSyncSending(true)
    setSyncResult(null)
    try {
      const res = await fetch('/api/admin/sync-cronjob', { method: 'POST' })
      const data = await res.json()
      if (data.ok) setSyncResult({ ok: true, msg: `Sincronizado: ${data.updated.join(', ') || 'nenhum job com Authorization'} ${data.failed.length ? `| Falhou: ${data.failed.join(', ')}` : ''}` })
      else setSyncResult({ ok: false, msg: data.error || 'Erro desconhecido' })
    } catch (e) {
      setSyncResult({ ok: false, msg: String(e) })
    }
    setSyncSending(false)
  }

  async function migrateEditionTitles() {
    setMigratingTitles(true)
    setMigrateTitlesResult(null)
    try {
      const res = await fetch('/api/admin/migrate-edition-titles', { method: 'POST' })
      const data = await res.json()
      if (data.ok) setMigrateTitlesResult({ ok: true, msg: `${data.updated?.length ?? 0} títulos gerados. ${data.failed?.length ? `Falhas: ${data.failed.join(', ')}` : ''}` })
      else setMigrateTitlesResult({ ok: false, msg: data.error || 'Erro desconhecido' })
    } catch (e) {
      setMigrateTitlesResult({ ok: false, msg: String(e) })
    }
    setMigratingTitles(false)
  }

  async function migrateEditionNumbers() {
    setMigrating(true)
    setMigrateResult(null)
    try {
      const res = await fetch('/api/admin/migrate-edition-numbers', { method: 'POST' })
      const data = await res.json()
      if (data.ok) setMigrateResult({ ok: true, msg: `${data.updated?.length ?? 0} edições numeradas. ${data.failed?.length ? `Falhas: ${data.failed.join(', ')}` : ''}` })
      else setMigrateResult({ ok: false, msg: data.error || 'Erro desconhecido' })
    } catch (e) {
      setMigrateResult({ ok: false, msg: String(e) })
    }
    setMigrating(false)
  }

  async function saveSettings() {
    setSaving(true)
    await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriberGoal: goal, subscriberGoalReward: reward, referralMilestones: milestones }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Painel de Administração</h1>
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

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        <button onClick={() => setTab('posts')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${tab === 'posts' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          Conteúdo
        </button>
        <button onClick={() => setTab('fila')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${tab === 'fila' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          Fila editorial{queue.length > 0 && <span className="ml-1.5 text-[11px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">{queue.length}</span>}
        </button>
        <button onClick={() => setTab('instagram')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${tab === 'instagram' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          Instagram{igPosts.length > 0 && <span className="ml-1.5 text-[11px] font-bold text-pink-700 bg-pink-100 px-1.5 py-0.5 rounded-full">{igPosts.length}</span>}
        </button>
        <button onClick={() => setTab('settings')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${tab === 'settings' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          Metas e Recompensas
        </button>
        <button onClick={() => setTab('email')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${tab === 'email' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          E-mail
        </button>
        <button onClick={() => setTab('fluxos')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${tab === 'fluxos' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          Fluxos
        </button>
      </div>

      {/* Posts tab */}
      {tab === 'posts' && (
        <>
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
        </>
      )}

      {/* Instagram tab */}
      {tab === 'instagram' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Posts gerados via Canva aguardando aprovação para o Instagram.</p>
            <button onClick={loadIgPosts} className="text-xs font-semibold text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg">
              ↻ Atualizar
            </button>
          </div>

          {igLoading ? (
            <p className="text-gray-400 text-center py-16">Carregando...</p>
          ) : igPosts.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl">
              <p className="text-gray-400 text-sm">Nenhum post pendente.</p>
              <p className="text-gray-300 text-xs mt-1">O cron gera automaticamente a partir das notícias publicadas.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {igPosts.map(post => (
                <div key={post._id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                  <div className="flex gap-0 items-stretch">
                    {/* Preview da imagem */}
                    {post.igExportUrl && (
                      <div className="shrink-0 w-48 bg-gray-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={post.igExportUrl} alt={post.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    {/* Info + ações */}
                    <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                      <div className="space-y-2">
                        <p className="font-bold text-gray-900 text-sm leading-snug">{post.title}</p>
                        <p className="text-[11px] text-gray-400">
                          {new Date(post.publishedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                          {post.igCanvaDesignId && (
                            <> · <a href={`https://www.canva.com/design/${post.igCanvaDesignId}/edit`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">Editar no Canva ↗</a></>
                          )}
                        </p>
                        {post.igCaption && (
                          <details className="text-xs text-gray-500">
                            <summary className="cursor-pointer text-gray-400 hover:text-gray-600 select-none">Ver legenda</summary>
                            <pre className="mt-2 whitespace-pre-wrap font-sans leading-relaxed bg-gray-50 rounded-lg p-3 border border-gray-100">{post.igCaption}</pre>
                          </details>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-4">
                        <a
                          href={post.igExportUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 px-4 py-2 rounded-xl transition-colors"
                        >
                          ↓ Baixar imagem
                        </a>
                        <button
                          onClick={() => navigator.clipboard.writeText(post.igCaption)}
                          className="text-sm font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-400 px-4 py-2 rounded-xl transition-colors"
                        >
                          Copiar legenda
                        </button>
                        <button
                          onClick={() => approveIgPost(post._id)}
                          disabled={igPublishing === post._id}
                          className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold text-sm px-5 py-2 rounded-xl transition-colors"
                        >
                          {igPublishing === post._id ? 'Salvando...' : '✓ Marcar como postado'}
                        </button>
                        {igResult[post._id] && (
                          <span className={`text-xs font-semibold ${igResult[post._id].ok ? 'text-green-600' : 'text-red-500'}`}>
                            {igResult[post._id].ok ? '✓ Feito' : '✗ ' + igResult[post._id].msg}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Fila editorial tab */}
      {tab === 'fila' && (
        <div className="space-y-6">
          <section className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
            <div>
              <h2 className="font-bold text-gray-900">Sugerir pauta</h2>
              <p className="text-sm text-gray-500 mt-0.5">Sua ideia entra na fila e o robô usa antes de escolher tema sozinho. Pelo Telegram: <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">/pauta</code>, <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">/materia</code>, <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">/curiosidade</code>.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {QUEUE_KINDS.map(k => (
                <button key={k.value} onClick={() => setNewKind(k.value)}
                  className={`px-3 py-1.5 text-sm font-semibold rounded-lg border transition-colors ${newKind === k.value ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'}`}>
                  {k.emoji} {k.label}
                </button>
              ))}
            </div>
            <textarea value={newBrief} onChange={e => setNewBrief(e.target.value)} rows={3}
              placeholder="Ex: Como funciona o Tesouro IPCA+ na prática, com exemplo de quem investe 100 reais por mês"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" />
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-500">Prioridade</label>
              <input type="number" value={newPriority} onChange={e => setNewPriority(Number(e.target.value))}
                className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              <span className="text-xs text-gray-400">maior = sai antes</span>
              <button onClick={addQueue} disabled={adding || !newBrief.trim()}
                className="ml-auto bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold text-sm px-5 py-2 rounded-xl transition-colors">
                {adding ? 'Adicionando...' : 'Adicionar à fila'}
              </button>
            </div>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-3">Na fila {queue.length > 0 && <span className="text-gray-400 font-normal text-sm">({queue.length})</span>}</h2>
            {queueLoading ? (
              <p className="text-gray-400 text-center py-10">Carregando...</p>
            ) : queue.length === 0 ? (
              <p className="text-gray-400 text-center py-10 border border-dashed border-gray-200 rounded-2xl">Fila vazia. O robô vai escolher os temas sozinho.</p>
            ) : (
              <div className="space-y-2">
                {queue.map(item => {
                  const k = QUEUE_KINDS.find(x => x.value === item.kind)
                  return (
                    <div key={item._id} className="flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-2xl">
                      <span className="text-xl shrink-0" title={k?.label}>{k?.emoji || '•'}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-800 leading-snug">{item.brief}</p>
                        <p className="text-[11px] text-gray-400 mt-1">{k?.label} · via {item.source || 'admin'}</p>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <input type="number" value={item.priority} onChange={e => setQueuePriority(item._id, Number(e.target.value))}
                          title="Prioridade"
                          className="w-14 px-2 py-1 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-green-400" />
                        <button onClick={() => discardQueue(item._id)}
                          className="text-xs font-semibold text-red-600 hover:text-white hover:bg-red-500 border border-red-200 px-3 py-1.5 rounded-lg transition-colors">
                          Descartar
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {used.length > 0 && (
            <section>
              <h2 className="font-bold text-gray-900 mb-3">Usadas recentemente</h2>
              <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden">
                {used.map(item => (
                  <div key={item._id} className="flex items-center gap-3 p-3.5">
                    <span className="text-base shrink-0">✅</span>
                    <p className="text-sm text-gray-500 truncate flex-1">{item.brief}</p>
                    {item.usedAt && <span className="text-[11px] text-gray-400 shrink-0">{new Date(item.usedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Email tab */}
      {tab === 'email' && (
        <div className="space-y-6">
          <section className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-gray-900">Prévia da edição</h2>
            <p className="text-sm text-gray-500">Envia a última edição publicada para o e-mail abaixo, exatamente como os inscritos recebem.</p>
            <div className="flex gap-3">
              <input
                type="email"
                value={testEmail}
                onChange={e => setTestEmail(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              <button
                onClick={sendTestEditionEmail}
                disabled={testSending}
                className="shrink-0 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white font-bold text-sm px-5 py-2 rounded-xl transition-colors"
              >
                {testSending ? 'Enviando...' : testSent ? '✓ Enviado!' : 'Enviar prévia'}
              </button>
            </div>
          </section>

          <section className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-gray-900">Gerar títulos temáticos (edições antigas)</h2>
            <p className="text-sm text-gray-500">Usa o Claude para gerar um título jornalístico para cada edição que ainda tem o título genérico "Edição de DD de mês de AAAA". Pode demorar alguns minutos.</p>
            <button
              onClick={migrateEditionTitles}
              disabled={migratingTitles}
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white font-bold text-sm px-5 py-2 rounded-xl transition-colors"
            >
              {migratingTitles ? 'Gerando títulos...' : 'Gerar títulos temáticos'}
            </button>
            {migrateTitlesResult && (
              <p className={`text-sm font-medium ${migrateTitlesResult.ok ? 'text-green-700' : 'text-red-600'}`}>
                {migrateTitlesResult.ok ? '✓ ' : '✗ '}{migrateTitlesResult.msg}
              </p>
            )}
          </section>

          <section className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-gray-900">Numerar edições existentes</h2>
            <p className="text-sm text-gray-500">Migração one-shot: atribui número sequencial (do mais antigo ao mais novo) a todas as edições que ainda não têm número. Execute uma vez.</p>
            <button
              onClick={migrateEditionNumbers}
              disabled={migrating}
              className="bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white font-bold text-sm px-5 py-2 rounded-xl transition-colors"
            >
              {migrating ? 'Numerando...' : 'Numerar edições'}
            </button>
            {migrateResult && (
              <p className={`text-sm font-medium ${migrateResult.ok ? 'text-green-700' : 'text-red-600'}`}>
                {migrateResult.ok ? '✓ ' : '✗ '}{migrateResult.msg}
              </p>
            )}
          </section>

          <section className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-gray-900">Sincronizar cron-job.org</h2>
            <p className="text-sm text-gray-500">Empurra o CRON_SECRET atual para o header Authorization de todos os jobs no cron-job.org. Usa quando o secret mudar.</p>
            <button
              onClick={syncCronJob}
              disabled={syncSending}
              className="bg-gray-800 hover:bg-gray-700 disabled:opacity-60 text-white font-bold text-sm px-5 py-2 rounded-xl transition-colors"
            >
              {syncSending ? 'Sincronizando...' : 'Sincronizar cron-job.org'}
            </button>
            {syncResult && (
              <p className={`text-sm font-medium ${syncResult.ok ? 'text-green-700' : 'text-red-600'}`}>
                {syncResult.ok ? '✓ ' : '✗ '}{syncResult.msg}
              </p>
            )}
          </section>

          <section className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-gray-900">Disparar campanha para todos os inscritos</h2>
            <p className="text-sm text-gray-500">Envia a última edição publicada como campanha no Brevo para toda a lista. Use quando o disparo automático das 5h falhar.</p>
            <button
              onClick={sendEditionCampaign}
              disabled={campaignSending}
              className="bg-green-700 hover:bg-green-600 disabled:opacity-60 text-white font-bold text-sm px-5 py-2 rounded-xl transition-colors"
            >
              {campaignSending ? 'Disparando...' : 'Disparar campanha agora'}
            </button>
            {campaignResult && (
              <p className={`text-sm font-medium ${campaignResult.ok ? 'text-green-700' : 'text-red-600'}`}>
                {campaignResult.ok ? '✓ ' : '✗ '}{campaignResult.msg}
              </p>
            )}
          </section>
        </div>
      )}

      {/* Settings tab */}
      {tab === 'settings' && (
        <div className="space-y-8">
          {/* Meta pública */}
          <section className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-gray-900">Meta pública de inscritos</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Nº de inscritos para a meta</label>
                <input
                  type="number"
                  value={goal}
                  onChange={e => setGoal(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Recompensa ao bater a meta</label>
              <input
                type="text"
                value={reward}
                onChange={e => setReward(e.target.value)}
                placeholder="ex: sortearemos um livro de finanças entre todos os inscritos"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              <p className="text-xs text-gray-400 mt-1">Aparece assim: &quot;Faltam X — aí, <em>{reward}</em>.&quot;</p>
            </div>
          </section>

          {/* Metas de indicação */}
          <section className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Metas de indicação</h2>
              <button onClick={addMilestone} className="text-xs font-bold text-green-700 border border-green-300 px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors">
                + Adicionar meta
              </button>
            </div>
            <div className="space-y-3">
              {milestones.map((m, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="grid grid-cols-[48px_1fr_1fr] gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Emoji</label>
                      <input value={m.emoji} onChange={e => updateMilestone(i, 'emoji', e.target.value)}
                        className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-green-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Nº de indicações</label>
                      <input type="number" value={m.count} onChange={e => updateMilestone(i, 'count', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Nome da meta</label>
                      <input value={m.label} onChange={e => updateMilestone(i, 'label', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Recompensa</label>
                      <input value={m.reward} onChange={e => updateMilestone(i, 'reward', e.target.value)}
                        placeholder="Ex: Acesso ao grupo exclusivo no Telegram"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                    </div>
                    <button onClick={() => removeMilestone(i)} className="mt-5 text-xs text-red-400 hover:text-red-600 font-semibold shrink-0">
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <button
            onClick={saveSettings}
            disabled={saving}
            className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors"
          >
            {saving ? 'Salvando...' : saved ? '✓ Salvo!' : 'Salvar configurações'}
          </button>
        </div>
      )}
      {/* Fluxos tab */}
      {tab === 'fluxos' && (
        <div className="space-y-6">

          {/* Legenda */}
          <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
            <span className="flex items-center gap-1 bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1.5 rounded-full">⚙️ Automático</span>
            <span className="flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1.5 rounded-full">👆 Você age aqui</span>
            <span className="flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-2.5 py-1.5 rounded-full">✅ Saída final</span>
            <span className="flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1.5 rounded-full">🤖 Haiku (~10x mais barato)</span>
            <span className="flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1.5 rounded-full">🧠 Sonnet (mais inteligente)</span>
            <span className="flex items-center gap-1 bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-1.5 rounded-full">💡 Opcional / condicional</span>
          </div>

          {/* Pipeline: Notícias */}
          <FluxoCard
            emoji="📰" title="Notícias" badge="4× por dia" schedule="8h · 12h · 16h · 20h BRT" color="blue"
            steps={[
              { kind: 'auto', label: 'RSS — 11 fontes', desc: 'InfoMoney, G1, Exame, Valor, CNN Brasil e mais. Manchetes das últimas 48h.' },
              { kind: 'cond', label: 'Fila editorial? (opcional)', desc: 'Se você colocou um item do tipo "notícia" na fila, ele substitui o RSS. Comanda: /pauta [tema] no Telegram.' },
              { kind: 'ai',   label: '🤖 Haiku escolhe + escreve', desc: 'Seleciona a manchete mais relevante e escreve artigo educativo completo em JSON (título, slug, excerpt, corpo, legenda Instagram, título do card, slides do carrossel).' },
              { kind: 'ai',   label: '🤖 Haiku humaniza o body', desc: 'Passa o corpo do artigo pelo humanizador para remover marcas de IA e soar como texto brasileiro natural.' },
              { kind: 'auto', label: 'Cria rascunho no Sanity', desc: 'Post salvo com status "rascunho". Ainda não aparece no site.' },
              { kind: 'user', label: '📱 Telegram — você aprova', desc: 'Chega: título + excerpt + botões. Opções: ✅ Aprovar (publica no site) · ❌ Rejeitar (deleta o rascunho). Botão 👁 Preview abre o artigo completo antes de decidir.' },
              { kind: 'done', label: 'Blog atualizado', desc: 'Status vira "aprovado". Post entra no site com data/hora da aprovação.' },
            ]}
            commands={['/pauta [tema] — adiciona pauta de notícia para o próximo slot']}
          />

          {/* Pipeline: Conteúdo Próprio */}
          <FluxoCard
            emoji="📚" title="Conteúdo Próprio" badge="2× por dia" schedule="8h · 15h BRT" color="indigo"
            steps={[
              { kind: 'cond', label: 'Fila editorial? (opcional)', desc: 'Se você colocou um item do tipo "matéria" na fila, ele define o tema. Comanda: /materia [pauta] no Telegram.' },
              { kind: 'auto', label: 'Série do dia (rotação de 8)', desc: 'Número do Dia · Setor na Lupa · Dólar e Você · Emprego e Salário · Preço de Tudo · Fundo Imobiliário · Fintech · Renda Extra. Roda em sequência automaticamente.' },
              { kind: 'auto', label: 'Busca dados reais', desc: 'BACEN (taxa Selic, câmbio, inflação), IBGE ou RSS financeiros específicos por série. Os números chegam no contexto do Claude.' },
              { kind: 'ai',   label: '🧠 Sonnet gera o artigo', desc: 'Análise aprofundada com dados reais. 10-12 parágrafos. Sem humanizador (Sonnet escreve bem direto).' },
              { kind: 'auto', label: 'Cria rascunho no Sanity', desc: 'Post salvo com status "rascunho". Ainda não aparece no site.' },
              { kind: 'user', label: '📱 Telegram — você aprova', desc: 'Chega: título + excerpt + botões. Opções: ✅ Aprovar · ❌ Rejeitar. Botão 👁 Preview abre o artigo completo antes de decidir.' },
              { kind: 'done', label: 'Blog atualizado', desc: 'Status vira "aprovado". Post entra no site.' },
            ]}
            commands={['/materia [pauta] — adiciona pauta de matéria própria para 8h ou 15h']}
          />

          {/* Pipeline: Evergreen */}
          <FluxoCard
            emoji="🔥" title="Evergreen — Blog + Instagram" badge="4× por dia" schedule="9h · 12h · 15h · 18h BRT" color="orange"
            steps={[
              { kind: 'auto', label: 'Calendário editorial', desc: 'Define categoria (ganhar dinheiro / investimentos / educação financeira / cartão) e funil (TOFU / MOFU / BOFU) pelo dia da semana + hora. Ex: segunda 12h = educação financeira MOFU.' },
              { kind: 'auto', label: 'Google Suggestions via Serper', desc: 'Busca o que brasileiros estão pesquisando agora sobre o tema. Alimenta o Claude com perguntas reais.' },
              { kind: 'ai',   label: '🤖 Haiku gera artigo + carrossel', desc: 'Produz: título, slug, body (10-12 parágrafos), excerpt, legenda do Instagram (igCaption), título do card (igTitle, CAIXA ALTA ≤3 linhas), 3-4 slides de conteúdo (title + body cada) e a coverQuery para buscar foto.' },
              { kind: 'auto', label: 'Busca foto (cascata)', desc: '1º Pexels com coverQuery. 2º Serper Google Images (3 opções alternativas). 3º Unsplash como fallback. Evita fotos já usadas recentemente.' },
              { kind: 'auto', label: 'Monta slides OG', desc: 'Gera as URLs de cada slide via /api/og: Slide 1 = capa (foto de fundo + igTitle + logo). Slides 2-N = conteúdo (verde escuro + headline + texto). Slide final = CTA ("QUER O GUIA COMPLETO?"). Total: 5-7 slides.' },
              { kind: 'auto', label: 'Cria pendingPost no Sanity', desc: 'Guarda tudo: artigo, foto escolhida, URLs dos slides, legenda, opções de imagens alternativas. Status: "pending". O blog ainda NÃO tem o post.' },
              { kind: 'user', label: '📱 Telegram — preview + aprovação', desc: 'Você recebe: (1) imagem do slide capa com botões de ação. (2) 3 fotos do Google como alternativas com botão "Usar opção N". Botões: ✅ Aprovar · ❌ Rejeitar · ✏️ Editar título · 📝 Editar legenda · 🖼 Buscar mais fotos · 👁 Ver artigo completo.' },
              { kind: 'auto', label: 'Aprovação → publica no blog', desc: 'Cria o post no Sanity com status "aprovado". Aparece em portalendinheirados.com.br.' },
              { kind: 'auto', label: 'Envia carrossel no Telegram', desc: 'Pré-aquece os slides OG (fetch em paralelo para cache), depois sendMediaGroup com todos os slides. Você recebe as imagens prontas para salvar.' },
              { kind: 'auto', label: 'Envia legenda no Telegram', desc: 'Mensagem separada com "📋 LEGENDA (copie e cole):" + o texto completo do Instagram.' },
              { kind: 'user', label: '📸 Você posta no Instagram', desc: 'Salva os slides do Telegram. Abre o Instagram. Cola a legenda. Adiciona música. Posta o carrossel.', highlight: true },
            ]}
            commands={[]}
          />

          {/* Pipeline: Edição Diária */}
          <FluxoCard
            emoji="📧" title="Edição Diária — Newsletter" badge="1× por dia" schedule="4h BRT (+ backup 5h, watchdog 7h)" color="green"
            steps={[
              { kind: 'auto', label: 'Candidatas às 22h (dia anterior)', desc: 'Cron busca manchetes em 16 fontes RSS e envia lista para o Telegram.' },
              { kind: 'user', label: '📱 Telegram — curadoria (opcional)', desc: 'Você pode selecionar quais manchetes quer destacar na edição. Se não responder até as 4h, a edição usa curadoria automática.' },
              { kind: 'auto', label: 'RSS + posts publicados hoje', desc: '16 fontes de notícia + todos os artigos publicados hoje no blog. Essa é a matéria-prima da edição.' },
              { kind: 'cond', label: 'Fila editorial? (opcional)', desc: 'Se há item do tipo "curiosidade" na fila, ela substitui a curiosidade automática. Comanda: /curiosidade [tema] no Telegram.' },
              { kind: 'ai',   label: '🧠 Sonnet escreve a edição', desc: '5-7 matérias comentadas · Termômetro do dia · Curiosidade · Palavra do dia (diferente das últimas 30 edições, buscado do Sanity) · Punchline final.' },
              { kind: 'auto', label: 'Salva no Sanity como edition', desc: 'Documento permanente da edição, com data, conteúdo completo e metadados.' },
              { kind: 'auto', label: 'Dispara email via Brevo', desc: 'Campanha enviada para toda a lista de inscritos. Template renderizado com o conteúdo da edição.' },
              { kind: 'done', label: 'Resumo no Telegram', desc: 'Você recebe no Telegram uma confirmação com o resumo da edição enviada.' },
            ]}
            commands={['/curiosidade [tema] — adiciona curiosidade para a próxima edição às 4h']}
          />

          {/* Fila Editorial */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
              <h3 className="font-bold text-gray-900">📋 Fila Editorial — você manda aqui</h3>
              <p className="text-xs text-gray-500 mt-0.5">Tudo que você coloca na fila tem prioridade sobre a automação. O cron vai usar no próximo horário disponível.</p>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {([
                { kind: 'noticia',     emoji: '📰', label: 'Notícia',         when: 'próximo slot — 8h, 12h, 16h ou 20h', color: 'blue',   cmds: ['/pauta [tema]',       'Aba "Fila editorial" aqui no admin'] },
                { kind: 'materia',     emoji: '📝', label: 'Matéria própria', when: 'próximo slot — 8h ou 15h',           color: 'indigo', cmds: ['/materia [pauta]',    'Aba "Fila editorial" aqui no admin'] },
                { kind: 'curiosidade', emoji: '💡', label: 'Curiosidade',     when: 'próxima edição — às 4h do dia seguinte', color: 'green', cmds: ['/curiosidade [tema]', 'Aba "Fila editorial" aqui no admin'] },
              ] as const).map(item => (
                <div key={item.kind} className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{item.emoji} {item.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Consumido no: <span className="font-semibold text-gray-700">{item.when}</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Como adicionar</p>
                    {item.cmds.map(c => (
                      <p key={c} className="text-xs font-mono bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 mb-1">{c}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comandos Telegram */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="font-bold text-gray-900 mb-4">📱 Todos os comandos do Telegram</h3>
            <div className="space-y-2">
              {([
                { cmd: '/pauta [tema]',       desc: 'Adiciona pauta de notícia à fila. O cron usa no próximo slot (8h/12h/16h/20h).' },
                { cmd: '/materia [pauta]',    desc: 'Adiciona pauta de matéria própria à fila. O cron usa no próximo 8h ou 15h.' },
                { cmd: '/curiosidade [tema]', desc: 'Adiciona curiosidade à fila. A edição usa na próxima geração (às 4h).' },
                { cmd: '/fila',               desc: 'Lista todos os itens pendentes na fila editorial com status e prioridade.' },
                { cmd: '/ajuda',              desc: 'Mostra todos os comandos disponíveis.' },
              ] as const).map(({ cmd, desc }) => (
                <div key={cmd} className="flex gap-3 items-start p-3 bg-gray-50 rounded-xl">
                  <code className="text-xs font-mono font-bold text-indigo-700 bg-white border border-indigo-200 px-2.5 py-1.5 rounded-lg shrink-0 whitespace-nowrap">{cmd}</code>
                  <p className="text-xs text-gray-600 pt-1">{desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

// --- Componente de card de fluxo ---

type FluxoStepKind = 'auto' | 'ai' | 'user' | 'cond' | 'done'
type FluxoStep = { kind: FluxoStepKind; label: string; desc: string; highlight?: boolean }

const STEP_STYLE: Record<FluxoStepKind, { dot: string; badge: string; badgeText: string }> = {
  auto: { dot: 'bg-slate-400',  badge: 'bg-slate-100 text-slate-600 border-slate-200',   badgeText: '⚙️ Auto' },
  ai:   { dot: 'bg-purple-400', badge: 'bg-purple-50 text-purple-700 border-purple-200',  badgeText: '🤖 IA' },
  user: { dot: 'bg-amber-400',  badge: 'bg-amber-50 text-amber-700 border-amber-300',     badgeText: '👆 Você' },
  cond: { dot: 'bg-orange-300', badge: 'bg-orange-50 text-orange-700 border-orange-200',  badgeText: '💡 Opcional' },
  done: { dot: 'bg-green-500',  badge: 'bg-green-50 text-green-700 border-green-200',     badgeText: '✅ Saída' },
}

function FluxoCard({ emoji, title, badge, schedule, color, steps, commands }: {
  emoji: string
  title: string
  badge: string
  schedule: string
  color: 'blue' | 'indigo' | 'orange' | 'green'
  steps: FluxoStep[]
  commands: string[]
}) {
  const border = { blue: 'border-blue-200', indigo: 'border-indigo-200', orange: 'border-orange-200', green: 'border-green-200' }[color]
  const hdrBg  = { blue: 'bg-blue-50',      indigo: 'bg-indigo-50',      orange: 'bg-orange-50',      green: 'bg-green-50'    }[color]
  const hdrTxt = { blue: 'text-blue-800',    indigo: 'text-indigo-800',   orange: 'text-orange-800',   green: 'text-green-800' }[color]
  const bdgBg  = { blue: 'bg-blue-100 text-blue-700 border-blue-200', indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200', orange: 'bg-orange-100 text-orange-700 border-orange-200', green: 'bg-green-100 text-green-700 border-green-200' }[color]

  return (
    <div className={`bg-white border ${border} rounded-2xl overflow-hidden`}>
      {/* Header */}
      <div className={`${hdrBg} px-6 py-4 flex items-center justify-between gap-4`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{emoji}</span>
          <div>
            <h3 className={`font-bold ${hdrTxt}`}>{title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{schedule}</p>
          </div>
        </div>
        <span className={`text-[11px] font-bold border rounded-full px-2.5 py-1 shrink-0 ${bdgBg}`}>{badge}</span>
      </div>

      {/* Steps */}
      <div className="px-6 py-5">
        <div className="relative">
          {/* Linha vertical conectora */}
          <div className="absolute left-[11px] top-5 bottom-5 w-px bg-gray-200" />

          <div className="space-y-1">
            {steps.map((step, i) => {
              const s = STEP_STYLE[step.kind]
              return (
                <div key={i} className={`relative flex gap-4 rounded-xl px-3 py-2.5 transition-colors ${step.highlight ? 'bg-amber-50 border border-amber-200' : 'hover:bg-gray-50'}`}>
                  {/* Dot */}
                  <div className={`mt-1 w-[22px] h-[22px] rounded-full ${s.dot} shrink-0 flex items-center justify-center z-10`}>
                    <span className="text-white text-[10px] font-bold">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">{step.label}</span>
                      <span className={`text-[10px] font-bold border rounded-full px-2 py-0.5 ${s.badge}`}>{s.badgeText}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Commands */}
        {commands.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Comandos Telegram para este fluxo</p>
            <div className="space-y-1">
              {commands.map(c => (
                <p key={c} className="text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">{c}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
