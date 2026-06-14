'use client'

import { useEffect, useState } from 'react'
import type { SiteSettings } from '@/lib/sanity'

type Data = { count: number; settings: SiteSettings }

export function SubscriberMilestone() {
  const [data, setData] = useState<Data | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/subscribers/count').then(r => r.json()),
      fetch('/api/settings').then(r => r.json()),
    ]).then(([countData, settings]) => {
      setData({ count: countData.count ?? 0, settings })
    }).catch(() => {})
  }, [])

  if (!data) return null

  const { count, settings } = data
  const { subscriberGoal: goal, subscriberGoalReward: reward } = settings
  const pct = Math.min(100, Math.round((count / goal) * 100))
  const reached = count >= goal

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5 text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-green-700 mb-1">Meta pública</p>
      <p className="text-2xl font-black text-gray-900 mb-0.5">
        {count.toLocaleString('pt-BR')}
        <span className="text-green-600">/{goal.toLocaleString('pt-BR')}</span>
        {' '}
        <span className="text-base font-semibold text-gray-600">inscritos</span>
      </p>

      <div className="w-full bg-green-100 rounded-full h-2.5 my-3 overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>

      {reached ? (
        <p className="text-sm font-semibold text-green-700">🎉 Meta batida! {reward}.</p>
      ) : (
        <p className="text-sm text-gray-600">
          Faltam <strong>{(goal - count).toLocaleString('pt-BR')}</strong> para {goal.toLocaleString('pt-BR')} inscritos — aí, {reward}.
        </p>
      )}
    </div>
  )
}
