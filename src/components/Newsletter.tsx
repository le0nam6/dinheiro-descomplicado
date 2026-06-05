'use client'

import { useState } from 'react'

export function Newsletter() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setStatus('loading')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setStatus('success')
        setEmail('')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="max-w-md mx-auto bg-green-100 border border-green-300 rounded-xl px-4 py-3 text-green-800 text-sm font-medium">
        ✅ Inscrição confirmada! Em breve você recebe nossas dicas.
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
