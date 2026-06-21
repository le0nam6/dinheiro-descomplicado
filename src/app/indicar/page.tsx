import type { Metadata } from 'next'
import Link from 'next/link'
import { getSiteSettings } from '@/lib/sanity'
import { ReferralBanner } from '@/components/ReferralBanner'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Programa de indicação — Endinheirados',
  description: 'Indique amigos para o Endinheirados e concorra a prêmios. Quanto mais você indicar, mais você ganha.',
}

export default async function IndicarPage() {
  const settings = await getSiteSettings()
  const { referralMilestones, referralPrizeName, referralPrizeImage, subscriberGoal } = settings

  return (
    <div className="max-w-xl mx-auto py-10 space-y-8">

      {/* Hero */}
      <div className="text-center space-y-2">
        <p className="text-4xl">🎁</p>
        <h1 className="text-2xl font-black text-gray-900">Indique e concorra a prêmios</h1>
        <p className="text-gray-500 text-sm max-w-sm mx-auto">
          Compartilhe o Endinheirados com amigos e ganhe recompensas a cada indicação bem-sucedida.
        </p>
      </div>

      {/* Banner do sorteio */}
      <ReferralBanner />

      {/* Como funciona */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <h2 className="font-bold text-gray-900 text-base">Como funciona</h2>
        <div className="space-y-3">
          {[
            { n: '1', text: 'Acesse seu painel com o e-mail cadastrado' },
            { n: '2', text: 'Copie seu link único de indicação' },
            { n: '3', text: 'Compartilhe com amigos, no grupo da faculdade, no trabalho...' },
            { n: '4', text: 'Cada amigo que se inscrever pelo seu link conta como uma indicação' },
          ].map(step => (
            <div key={step.n} className="flex gap-3 items-start">
              <span className="shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-black flex items-center justify-center">
                {step.n}
              </span>
              <p className="text-sm text-gray-700 leading-snug pt-0.5">{step.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Milestones */}
      <div>
        <h2 className="font-bold text-gray-900 text-base mb-3">Recompensas por indicação</h2>
        <div className="space-y-2">
          {referralMilestones.map(m => (
            <div key={m.count} className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 bg-white">
              <span className="text-2xl shrink-0">{m.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-gray-900">{m.label}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-gray-100 text-gray-500">
                    {m.count} {m.count === 1 ? 'indicação' : 'indicações'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{m.reward}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Prêmio do sorteio */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4 items-center">
        {referralPrizeImage ? (
          <img src={referralPrizeImage} alt={referralPrizeName} className="w-16 rounded-lg shadow" />
        ) : (
          <span className="text-4xl shrink-0">📖</span>
        )}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-amber-700 mb-0.5">Sorteio</p>
          <p className="font-black text-gray-900 text-base">{referralPrizeName}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Sorteado entre todos os inscritos ao bater {subscriberGoal.toLocaleString('pt-BR')} leitores.
            Qualquer inscrito pode ganhar — sem precisar indicar.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center space-y-3">
        <Link
          href="/painel"
          className="inline-block w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-2xl text-sm transition-colors"
        >
          Acessar meu painel de indicações →
        </Link>
        <p className="text-xs text-gray-400">
          Ainda não é inscrito?{' '}
          <a href="/#newsletter" className="text-green-600 hover:underline">Cadastre-se grátis</a>
        </p>
      </div>

    </div>
  )
}
