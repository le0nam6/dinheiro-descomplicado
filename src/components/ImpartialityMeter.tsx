'use client'
import { useEffect, useState } from 'react'
import { IconScale, IconMoodNeutral, IconAlertTriangle, IconGauge } from '@tabler/icons-react'

type Totals = { imparcial: number; tendencioso: number; neutro: number }
const LABELS: Record<keyof Totals, { txt: string; Icon: typeof IconScale; color: string }> = {
  imparcial:   { txt: 'Imparcial', Icon: IconScale, color: 'bg-green-500' },
  neutro:      { txt: 'Neutro',    Icon: IconMoodNeutral, color: 'bg-gray-400' },
  tendencioso: { txt: 'Tendencioso', Icon: IconAlertTriangle, color: 'bg-red-500' },
}

export function ImpartialityMeter({ slug }: { slug: string }) {
  const [totals, setTotals] = useState<Totals | null>(null)
  const [voted, setVoted] = useState<string | null>(null)

  useEffect(() => {
    setVoted(localStorage.getItem(`vote-${slug}`))
    fetch(`/api/vote?slug=${encodeURIComponent(slug)}`).then(r => r.json()).then(d => { if (d.ok) setTotals(d) }).catch(() => {})
  }, [slug])

  async function vote(opt: keyof Totals) {
    if (voted) return
    setVoted(opt)
    localStorage.setItem(`vote-${slug}`, opt)
    const r = await fetch('/api/vote', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, vote: opt }),
    }).then(r => r.json()).catch(() => null)
    if (r?.ok) setTotals(r)
  }

  const total = totals ? totals.imparcial + totals.tendencioso + totals.neutro : 0

  return (
    <div className="my-12 border border-gray-200 rounded-2xl p-8 bg-gradient-to-br from-gray-50 to-white">
      <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-1.5">
        <IconGauge size={22} stroke={1.75} className="text-green-600" /> Termômetro de imparcialidade
      </h3>
      <p className="text-sm text-gray-500 mb-6">
        Compromisso editorial: notícia sem viés. Como você avalia a cobertura desta matéria?
      </p>

      {!voted ? (
        <div className="flex flex-wrap gap-3">
          {(Object.keys(LABELS) as (keyof Totals)[]).map(opt => {
            const { Icon, txt } = LABELS[opt]
            return (
              <button
                key={opt}
                onClick={() => vote(opt)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-300 hover:border-green-500 hover:bg-green-50 text-sm font-medium text-gray-700 transition-colors"
              >
                <Icon size={18} stroke={1.75} /> {txt}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {(Object.keys(LABELS) as (keyof Totals)[]).map(opt => {
            const { Icon, txt, color } = LABELS[opt]
            const v = totals?.[opt] ?? 0
            const pct = total ? Math.round((v / total) * 100) : 0
            return (
              <div key={opt}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="flex items-center gap-1.5 font-medium text-gray-700">
                    <Icon size={16} stroke={1.75} /> {txt} {voted === opt && <span className="text-green-600">(seu voto)</span>}
                  </span>
                  <span className="text-gray-500 tabular-nums">{pct}% · {v}</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
          <p className="text-xs text-gray-400 pt-1">{total} {total === 1 ? 'voto' : 'votos'} · resultado ao vivo</p>
        </div>
      )}
    </div>
  )
}
