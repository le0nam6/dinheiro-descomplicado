'use client'

import { useEffect, useState, useRef } from 'react'

const DISMISSED_KEY = 'exit_popup_dismissed_until'
const SUBSCRIBED_KEY = 'newsletter_subscribed'

export function ExitIntentPopup() {
  const [visible, setVisible] = useState(false)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const triggered = useRef(false)

  function isDismissed() {
    try {
      const until = localStorage.getItem(DISMISSED_KEY)
      return until && Date.now() < parseInt(until)
    } catch { return false }
  }

  function isSubscribed() {
    try { return localStorage.getItem(SUBSCRIBED_KEY) === '1' } catch { return false }
  }

  function dismiss() {
    try { localStorage.setItem(DISMISSED_KEY, String(Date.now() + 7 * 24 * 60 * 60 * 1000)) } catch {}
    setVisible(false)
  }

  function trigger() {
    if (triggered.current || isDismissed() || isSubscribed()) return
    triggered.current = true
    setVisible(true)
  }

  useEffect(() => {
    // Desktop: cursor sai pelo topo da janela
    const onMouseLeave = (e: MouseEvent) => { if (e.clientY <= 0) trigger() }
    document.addEventListener('mouseleave', onMouseLeave)

    // Mobile/fallback: 45s sem interação
    const timer = setTimeout(trigger, 45_000)

    return () => {
      document.removeEventListener('mouseleave', onMouseLeave)
      clearTimeout(timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
        try { localStorage.setItem(SUBSCRIBED_KEY, '1') } catch {}
        setTimeout(() => setVisible(false), 2500)
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={dismiss}>
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header verde */}
        <div className="bg-green-600 px-8 py-6 text-center">
          <p className="text-3xl mb-1">💸</p>
          <h2 className="text-xl font-black text-white leading-tight">
            Espera — você vai perder isso
          </h2>
          <p className="text-green-100 text-sm mt-1">
            A edição de hoje ainda tá quentinha
          </p>
        </div>

        {/* Body */}
        <div className="px-8 py-6">
          {status === 'success' ? (
            <div className="text-center py-4">
              <p className="text-4xl mb-2">🎉</p>
              <p className="font-bold text-gray-900">Você está dentro!</p>
              <p className="text-sm text-gray-500 mt-1">Próxima edição chega no seu e-mail.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-4 text-center">
                Todo dia às 6h você recebe as notícias de finanças que realmente importam — em menos de 5 minutos.
              </p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
                  className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white font-bold text-sm py-3 rounded-xl transition-colors"
                >
                  {status === 'loading' ? 'Inscrevendo...' : 'Quero receber de graça'}
                </button>
                {status === 'error' && (
                  <p className="text-red-500 text-xs text-center">Algo deu errado. Tenta de novo.</p>
                )}
              </form>
            </>
          )}

          <button
            onClick={dismiss}
            className="w-full mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Não, prefiro ficar por fora
          </button>
        </div>

        {/* Fechar */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 text-white/70 hover:text-white text-xl leading-none"
          aria-label="Fechar"
        >
          ×
        </button>
      </div>
    </div>
  )
}
