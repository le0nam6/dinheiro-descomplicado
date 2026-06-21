'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Data = { count: number; goal: number; prizeName: string; prizeImage: string }

export function ReferralBanner() {
  const [data, setData] = useState<Data | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/subscribers/count').then(r => r.json()),
      fetch('/api/settings').then(r => r.json()),
    ]).then(([countData, settings]) => {
      setData({
        count: countData.count ?? 0,
        goal: settings.subscriberGoal ?? 100,
        prizeName: settings.referralPrizeName ?? 'Psicologia Financeira',
        prizeImage: settings.referralPrizeImage ?? '',
      })
    }).catch(() => {})
  }, [])

  if (!data) return null

  const { count, goal, prizeName, prizeImage } = data
  const pct = Math.min(100, Math.round((count / goal) * 100))
  const remaining = Math.max(0, goal - count)

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl overflow-hidden">
      <div className="flex gap-5 p-5 sm:p-6 items-center">

        {/* Imagem do livro */}
        <div className="shrink-0">
          {prizeImage ? (
            <img
              src={prizeImage}
              alt={prizeName}
              className="w-20 sm:w-24 rounded-xl shadow-lg ring-2 ring-amber-200"
            />
          ) : (
            <div className="w-20 sm:w-24 h-28 sm:h-32 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg ring-2 ring-amber-200 flex flex-col items-center justify-center gap-1 p-2">
              <span className="text-3xl">📖</span>
              <span className="text-white text-[10px] font-bold text-center leading-tight">{prizeName}</span>
            </div>
          )}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-widest text-amber-700 mb-1">Sorteio · {goal} inscritos</p>
          <h3 className="font-black text-gray-900 text-base sm:text-lg leading-snug mb-0.5">
            {prizeName}
          </h3>
          <p className="text-xs text-gray-500 mb-3 leading-relaxed">
            1 exemplar sorteado entre todos os inscritos quando a gente bater {goal.toLocaleString('pt-BR')} leitores. Indique amigos para chegar lá mais rápido.
          </p>

          {/* Barra de progresso */}
          <div className="mb-3 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-gray-700">{count.toLocaleString('pt-BR')} inscritos</span>
              <span className="text-amber-600 font-semibold">{pct}%</span>
            </div>
            <div className="w-full bg-amber-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
            {remaining > 0 && (
              <p className="text-xs text-gray-400">
                Faltam <strong className="text-gray-600">{remaining.toLocaleString('pt-BR')}</strong> para o sorteio
              </p>
            )}
          </div>

          <Link
            href="/painel"
            className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors"
          >
            Convidar amigos e concorrer →
          </Link>
        </div>
      </div>
    </div>
  )
}
