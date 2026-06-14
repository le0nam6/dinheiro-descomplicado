'use client'

import { useState } from 'react'

export function PainelForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    await fetch('/api/auth/send-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).catch(() => {})
    setStatus('sent')
  }

  if (status === 'sent') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center space-y-2">
        <p className="text-3xl">📬</p>
        <p className="font-bold text-gray-900">Link enviado!</p>
        <p className="text-sm text-gray-600">
          Se esse e-mail estiver cadastrado, você vai receber o link de acesso em instantes. Confira a caixa de spam também.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
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
        {status === 'loading' ? 'Enviando...' : 'Receber meu link'}
      </button>
      <p className="text-xs text-center text-gray-400">
        Não está inscrito ainda?{' '}
        <a href="#newsletter" className="text-green-600 underline">Inscreva-se de graça</a>
      </p>
    </form>
  )
}
