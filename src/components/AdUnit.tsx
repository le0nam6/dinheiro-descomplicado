'use client'

import { useEffect } from 'react'

// IDs de placeholder configurados no painel Ezoic
// 101 = topo de conteúdo  102 = abaixo do título  103 = meio do artigo
// 104 = fim do artigo     105 = home/listagem      106 = sidebar

interface AdUnitProps {
  placeholderId: number
  className?: string
}

export function AdUnit({ placeholderId, className = '' }: AdUnitProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ez = (window as any).ezstandalone
    if (!ez) return
    ez.cmd = ez.cmd || []
    ez.cmd.push(function () {
      if (ez.enabled) {
        ez.define(placeholderId)
        ez.refresh(placeholderId)
      } else {
        ez.define(placeholderId)
        ez.enable()
        ez.display()
      }
    })
  }, [placeholderId])

  return (
    <div className={`my-6 ${className}`}>
      <div id={`ezoic-pub-ad-placeholder-${placeholderId}`} />
    </div>
  )
}
