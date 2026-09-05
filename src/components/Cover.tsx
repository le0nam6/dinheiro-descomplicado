'use client'

import { useState } from 'react'
import { urlDeExibicao } from '@/lib/images'

/**
 * Capa de post à prova de imagem quebrada.
 *
 * Antes o <img> apontava direto para o host de terceiro e não tratava erro:
 * quando a origem tirava a imagem do ar, bloqueava hotlink ou devolvia HTML
 * (caso do YouTube e do Facebook), o leitor via o ícone de imagem quebrada no
 * meio do card. Agora a falha vira um placeholder da marca, que ocupa o mesmo
 * espaço e não denuncia o defeito.
 */
export function Cover({
  url,
  alt = '',
  className = '',
  priority = false,
}: {
  url?: string | null
  alt?: string
  className?: string
  priority?: boolean
}) {
  const src = urlDeExibicao(url)
  const [falhou, setFalhou] = useState(false)

  if (!src || falhou) return <CoverVazia className={className} />

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFalhou(true)}
    />
  )
}

/** Placeholder da marca. Sem emoji: some em sistema que não tem a fonte. */
export function CoverVazia({ className = '' }: { className?: string }) {
  return (
    <div
      className={`${className} bg-green-50 flex items-center justify-center overflow-hidden`}
      aria-hidden
    >
      <svg viewBox="0 0 64 64" className="w-1/3 max-w-[72px] h-auto text-green-600/35" fill="none">
        <rect x="8" y="14" width="48" height="36" rx="5" stroke="currentColor" strokeWidth="3" />
        <circle cx="23" cy="27" r="4.5" fill="currentColor" />
        <path d="M12 44l13-13 9 9 7-6 11 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}
