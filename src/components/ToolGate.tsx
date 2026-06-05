'use client'

import { useState, useCallback } from 'react'
import { validateEmail, validateName } from '@/lib/emailValidator'

interface Props {
  toolName: string
  toolDescription: string
  children: React.ReactNode
}

export function ToolGate({ toolName, toolDescription, children }: Props) {
  const [unlocked, setUnlocked] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [nameError, setNameError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [suggestion, setSuggestion] = useState('')
  const [loading, setLoading] = useState(false)

  // Check localStorage to avoid asking again
  if (typeof window !== 'undefined' && !unlocked) {
    const stored = localStorage.getItem('tool_access')
    if (stored) {
      const data = JSON.parse(stored)
      if (data.email && data.name) {
        setTimeout(() => setUnlocked(true), 0)
      }
    }
  }

  const handleNameBlur = useCallback(() => {
    const r = validateName(name)
    setNameError(r.valid ? '' : (r.error ?? ''))
  }, [name])

  const handleEmailBlur = useCallback(() => {
    const r = validateEmail(email)
    setEmailError(r.valid ? '' : (r.error ?? ''))
    setSuggestion(r.suggestion ?? '')
  }, [email])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const nameCheck = validateName(name)
    const emailCheck = validateEmail(email)
    setNameError(nameCheck.valid ? '' : (nameCheck.error ?? ''))
    setEmailError(emailCheck.valid ? '' : (emailCheck.error ?? ''))

    if (!nameCheck.valid || !emailCheck.valid) return

    setLoading(true)
    try {
      await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, source: 'ferramentas' }),
      })
      localStorage.setItem('tool_access', JSON.stringify({ email, name }))
      setUnlocked(true)
    } catch {
      setUnlocked(true) // não bloqueia por erro de rede
    } finally {
      setLoading(false)
    }
  }

  if (unlocked) return <>{children}</>

  return (
    <div className="relative">
      {/* Preview borrada da ferramenta */}
      <div className="opacity-10 blur-sm pointer-events-none select-none" aria-hidden>
        {children}
      </div>

      {/* Gate */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-7 w-full max-w-md">
          <div className="text-center mb-5">
            <span className="text-4xl">🔓</span>
            <h2 className="text-xl font-extrabold text-gray-900 mt-2">{toolName}</h2>
            <p className="text-sm text-gray-500 mt-1">{toolDescription}</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-5 text-sm text-green-800">
            <strong>100% gratuito.</strong> Acesse essa e todas as outras ferramentas com um único cadastro.
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nome completo</label>
              <input
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); setNameError('') }}
                onBlur={handleNameBlur}
                placeholder="Seu nome e sobrenome"
                className={`w-full px-4 py-2.5 border rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${nameError ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
              />
              {nameError && <p className="text-xs text-red-600 mt-1">{nameError}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setEmailError(''); setSuggestion('') }}
                onBlur={handleEmailBlur}
                placeholder="seu@email.com"
                className={`w-full px-4 py-2.5 border rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${emailError ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
              />
              {emailError && <p className="text-xs text-red-600 mt-1">{emailError}</p>}
              {suggestion && !emailError && (
                <p className="text-xs text-amber-600 mt-1">
                  Quis dizer <button type="button" className="underline font-semibold" onClick={() => { setEmail(suggestion); setSuggestion('') }}>{suggestion}</button>?
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors text-sm"
            >
              {loading ? 'Liberando acesso...' : 'Acessar ferramenta gratuitamente →'}
            </button>

            <p className="text-[11px] text-gray-400 text-center">
              Sem spam. Você receberá nossas dicas de finanças. Cancele quando quiser.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
