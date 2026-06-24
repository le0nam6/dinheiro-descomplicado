'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Milestone = { count: number; emoji: string; label: string; reward: string }
type Data = { milestones: Milestone[]; top: Milestone }

export function ReferralBanner() {
  const [data, setData] = useState<Data | null>(null)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then((settings) => {
        const milestones: Milestone[] = settings.referralMilestones ?? []
        if (!milestones.length) return
        const top = milestones.reduce((a, b) => (b.count > a.count ? b : a))
        setData({ milestones: [...milestones].sort((a, b) => a.count - b.count), top })
      })
      .catch(() => {})
  }, [])

  if (!data) return null

  const { milestones, top } = data

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-800 via-emerald-900 to-gray-950 text-left text-white shadow-xl ring-1 ring-emerald-400/30">
      {/* brilho dourado de fundo */}
      <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-amber-400/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl" />

      <div className="relative p-5 sm:p-6">
        {/* selo */}
        <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-950 shadow-sm">
          <span className="text-sm leading-none">👑</span> Maior prêmio da campanha
        </div>

        {/* prêmio */}
        <h3 className="mt-3 text-xl font-black leading-tight text-amber-300 sm:text-2xl">
          {top.reward}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-emerald-100/90">
          É só indicar <strong className="font-black text-white">{top.count} amigos</strong> pelo seu link. Esse é o maior prêmio da campanha.
        </p>

        {/* trilha de níveis até a coroa */}
        <div className="mt-4 flex items-stretch gap-1.5">
          {milestones.map((m) => {
            const isTop = m.count === top.count
            return (
              <div
                key={m.count}
                className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 transition-colors ${
                  isTop
                    ? 'bg-amber-400 text-emerald-950 ring-2 ring-amber-200'
                    : 'bg-white/10 text-emerald-50'
                }`}
              >
                <span className="text-base leading-none">{m.emoji}</span>
                <span className="text-[10px] font-bold leading-none">{m.count}</span>
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <Link
          href="/painel"
          className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-400 px-4 py-3 text-sm font-black text-emerald-950 shadow-lg shadow-amber-500/20 transition-colors hover:bg-amber-300 active:bg-amber-500"
        >
          Quero meu link de indicação →
        </Link>
        <p className="mt-2 text-center text-[11px] text-emerald-200/70">
          Cada amigo que assinar pelo seu link conta. Quanto mais, melhor o prêmio.
        </p>
      </div>
    </div>
  )
}
