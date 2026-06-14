import type { Metadata } from 'next'
import { ReferralSubscribeForm } from './ReferralSubscribeForm'
import { createClient } from 'next-sanity'
import { getSiteSettings } from '@/lib/sanity'
import { notFound } from 'next/navigation'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Um amigo te convidou — Endinheirados',
  description: 'Alguém que te quer bem mandou esse link. Inscreva-se e receba a edição diária de finanças.',
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
})

export default async function ReferralPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params

  const [sub, settings] = await Promise.all([
    client.fetch<{ referralCount: number; email: string } | null>(
      `*[_type == "subscriber" && referralCode == $c][0]{ referralCount, email }`,
      { c: code }
    ),
    getSiteSettings(),
  ])

  if (!sub) notFound()

  const milestones = settings.referralMilestones
  const count = sub.referralCount ?? 0
  const current = [...milestones].reverse().find(m => m.count <= count)

  return (
    <div className="max-w-lg mx-auto py-8 space-y-6">
      {/* Hero */}
      <div className="text-center space-y-2">
        <p className="text-4xl">💸</p>
        <h1 className="text-2xl font-black text-gray-900">Alguém que te quer bem<br />mandou esse link</h1>
        <p className="text-gray-500 text-sm">Receba as notícias de finanças que importam todo dia às 6h — de graça, sem enrolação.</p>
      </div>

      {/* Formulário de inscrição */}
      <ReferralSubscribeForm referralCode={code} />

      {/* Stats do referente — só aparece se tiver indicações */}
      {count > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-green-700 mb-3">Quem indicou já ajudou</p>
          <p className="text-3xl font-black text-green-700 mb-0.5">{count}</p>
          <p className="text-sm text-gray-600">pessoa{count !== 1 ? 's' : ''} inscrita{count !== 1 ? 's' : ''} por esse link</p>
          {current && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xl">{current.emoji}</span>
              <div>
                <p className="text-sm font-bold text-gray-900">{current.label}</p>
                <p className="text-xs text-gray-500">{current.reward}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Metas de indicação */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Metas de indicação</p>
        <div className="space-y-2">
          {milestones.map(m => {
            const done = count >= m.count
            return (
              <div key={m.count} className={`flex items-center gap-3 p-3 rounded-xl border ${done ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <span className="text-xl">{m.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-bold ${done ? 'text-green-800' : 'text-gray-700'}`}>{m.label}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${done ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-500'}`}>
                      {m.count} {m.count === 1 ? 'indicação' : 'indicações'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{m.reward}</p>
                </div>
                {done && <span className="text-green-600 font-bold text-lg shrink-0">✓</span>}
              </div>
            )
          })}
        </div>
      </div>

      {(() => {
        const next = milestones.find(m => m.count > count)
        return next ? (
          <p className="text-center text-sm text-gray-500">
            Mais <strong>{next.count - count}</strong> indicação{next.count - count !== 1 ? 'ões' : ''} para desbloquear <strong>{next.label}</strong>.
          </p>
        ) : null
      })()}
    </div>
  )
}
