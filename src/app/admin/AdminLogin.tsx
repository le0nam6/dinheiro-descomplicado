'use client'
import { useState } from 'react'

export function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await fetch('/api/admin/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) window.location.reload()
    else { setError('Senha incorreta'); setLoading(false) }
  }

  return (
    <div className="max-w-sm mx-auto mt-16">
      <div className="text-center mb-6">
        <img src="/logo-endinheirados.png" alt="Endinheirados" className="h-16 w-auto object-contain mx-auto mb-2" />
        <h1 className="text-xl font-extrabold text-gray-900">Painel de Controle</h1>
        <p className="text-sm text-gray-500">Acesso restrito</p>
      </div>
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Senha</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400" autoFocus />
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
        <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors">
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
