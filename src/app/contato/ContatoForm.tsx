'use client'

import { useState } from 'react'

export function ContatoForm() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [mensagem, setMensagem] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const assunto = encodeURIComponent(`Contato pelo site — ${nome}`)
    const corpo = encodeURIComponent(`Nome: ${nome}\nE-mail: ${email}\n\n${mensagem}`)
    window.location.href = `mailto:contato@endinheirados.online?subject=${assunto}&body=${corpo}`
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Nome</label>
        <input
          type="text" required value={nome} onChange={e => setNome(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400"
          placeholder="Seu nome"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">E-mail</label>
        <input
          type="email" required value={email} onChange={e => setEmail(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400"
          placeholder="seu@email.com"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Mensagem</label>
        <textarea
          required rows={5} value={mensagem} onChange={e => setMensagem(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
          placeholder="Como podemos ajudar?"
        />
      </div>
      <button
        type="submit"
        className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        Enviar mensagem
      </button>
    </form>
  )
}
