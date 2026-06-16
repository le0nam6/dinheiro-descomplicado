'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type Post = { _id: string; title: string; slug: { current: string }; category: string; funnel: string; publishedAt: string; excerpt: string }
type Milestone = { count: number; emoji: string; label: string; reward: string }

export function AdminDashboard() {
  const [tab, setTab] = useState<'posts' | 'settings' | 'email'>('posts')
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

  useEffect(() => {
    fetch('/api/admin/posts').then(r => r.json()).then(d => { setPosts(d.posts || []); setLoading(false) })
    fetch('/api/admin/settings').then(r => r.json()).then(d => {
      if (d.subscriberGoal) setGoal(d.subscriberGoal)
      if (d.subscriberGoalReward) setReward(d.subscriberGoalReward)
      if (d.referralMilestones?.length) setMilestones(d.referralMilestones)
    })
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
        <button onClick={() => setTab('settings')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${tab === 'settings' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          Metas e Recompensas
        </button>
        <button onClick={() => setTab('email')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${tab === 'email' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          E-mail
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
    </div>
  )
}
