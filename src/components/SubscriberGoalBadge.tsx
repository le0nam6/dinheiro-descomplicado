'use client'

import { useEffect, useState } from 'react'

export function SubscriberGoalBadge() {
  const [count, setCount] = useState<number | null>(null)
  const [goal, setGoal] = useState(100)

  useEffect(() => {
    fetch('/api/subscribers/count').then(r => r.json()).then(d => setCount(d.count ?? 0)).catch(() => {})
    fetch('/api/settings').then(r => r.json()).then(d => setGoal(d.subscriberGoal ?? 100)).catch(() => {})
  }, [])

  if (count === null) return null

  const left = goal - count
  const pct = Math.min(100, Math.round((count / goal) * 100))
  const reached = count >= goal

  return (
    <a
      href="#newsletter"
      className="flex flex-col items-end gap-0.5 group select-none"
      title="Clique para se inscrever"
    >
      {/* Texto acima */}
      <span className="text-[10px] leading-tight text-gray-500 group-hover:text-green-700 transition-colors whitespace-nowrap">
        {reached ? '🎉 Meta batida!' : `Faltam ${left.toLocaleString('pt-BR')} para a meta de ${goal.toLocaleString('pt-BR')}`}
      </span>

      {/* Barra + contagem */}
      <div className="flex items-center gap-1.5">
        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs font-bold text-green-800 whitespace-nowrap">
          {count.toLocaleString('pt-BR')}
          <span className="font-normal text-green-600">/{goal.toLocaleString('pt-BR')}</span>
        </span>
      </div>
    </a>
  )
}
