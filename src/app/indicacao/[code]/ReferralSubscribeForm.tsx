'use client'

import { useState, useEffect } from 'react'

function CopyLinkBox({ link }: { link: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard?.writeText(link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          readOnly
          value={link}
          className="flex-1 text-xs px-3 py-2 border border-gray-300 rounded-lg bg-white truncate"
        />
        <button
          onClick={copy}
          className="shrink-0 bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
        >
          {copied ? 'Copiado!' : 'Copiar'}
        </button>
      </div>
      <p className="text-xs text-gray-500">Indique amigos e desbloqueie recompensas exclusivas.</p>
    </div>
  )
}

export function ReferralSubscribeForm({ referralCode }: { referralCode: string }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [myCode, setMyCode] = useState<string | null>(null)
  const [alreadySubscribed, setAlreadySubscribed] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem('newsletter_subscribed') === '1') {
        setAlreadySubscribed(true)
      }
    } catch {}
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setStatus('loading')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, referredBy: referralCode }),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('success')
        setMyCode(data.referralCode ?? null)
        try { localStorage.setItem('newsletter_subscribed', '1') } catch {}
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  if (alreadySubscribed || status === 'success') {
    const myLink = status === 'success' && myCode
      ? `https://endinheirados.cc/indicacao/${myCode}`
      : `https://endinheirados.cc/indicacao/${referralCode}`
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center space-y-4">
        {status === 'success' ? (
          <>
            <p className="text-3xl">🎉</p>
            <p className="font-black text-gray-900 text-lg">Você está dentro!</p>
            <p className="text-sm text-gray-600">Próxima edição chega no seu e-mail às 6h.</p>
          </>
        ) : (
          <>
            <p className="text-3xl">👋</p>
            <p className="font-black text-gray-900 text-lg">Você já é inscrito!</p>
            <p className="text-sm text-gray-600">Compartilhe seu link e desbloqueie recompensas exclusivas.</p>
          </>
        )}
        <CopyLinkBox link={myLink} />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-3">
      <p className="font-bold text-gray-900">Inscreva-se de graça</p>
      <input
        type="email"
        required
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="seu@email.com"
        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-colors"
      >
        {status === 'loading' ? 'Inscrevendo...' : 'Quero receber toda manhã'}
      </button>
      {status === 'error' && (
        <p className="text-red-500 text-xs text-center">Algo deu errado. Tenta de novo.</p>
      )}
    </form>
  )
}
