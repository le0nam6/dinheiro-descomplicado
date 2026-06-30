'use client'

import { useState } from 'react'

export function Newsletter({ referredBy }: { referredBy?: string } = {}) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [referralCode, setReferralCode] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setStatus('loading')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, ...(referredBy ? { referredBy } : {}) }),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('success')
        setReferralCode(data.referralCode ?? null)
        try { localStorage.setItem('newsletter_subscribed', '1') } catch {}
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    const link = referralCode ? `https://portalendinheirados.com.br/indicacao/${referralCode}` : null
    return (
      <div className="max-w-md mx-auto space-y-3">
        <div className="bg-green-100 border border-green-300 rounded-xl px-4 py-3 text-green-800 text-sm font-medium">
          ✅ Inscrição confirmada! Em breve você recebe nossas dicas.
        </div>
        {link && (
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-left space-y-1.5">
            <p className="text-xs font-bold text-gray-700">Seu link de indicação:</p>
            <div className="flex gap-2">
              <input
                readOnly
                value={link}
                className="flex-1 text-xs px-3 py-1.5 border border-gray-300 rounded-lg bg-gray-50 truncate"
              />
              <button
                onClick={() => navigator.clipboard?.writeText(link)}
                className="shrink-0 bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
              >
                Copiar
              </button>
            </div>
            <p className="text-xs text-gray-500">Indique amigos e desbloqueie recompensas.</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto flex gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="seu@email.com"
        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap"
      >
        {status === 'loading' ? '...' : 'Quero receber'}
      </button>
    </form>
  )
}
