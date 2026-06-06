'use client'

import { useEffect } from 'react'

interface AdUnitProps {
  slot: string
  format?: 'auto' | 'rectangle' | 'horizontal'
  className?: string
}

const ADSENSE_ID = process.env.NEXT_PUBLIC_ADSENSE_ID
// Só ativa se houver um Publisher ID real (não o placeholder)
const isAdsenseActive = !!ADSENSE_ID && ADSENSE_ID.startsWith('ca-pub-') && !ADSENSE_ID.includes('SEU_ID')

export function AdUnit({ slot, format = 'auto', className = '' }: AdUnitProps) {
  useEffect(() => {
    if (!isAdsenseActive) return
    try {
      // @ts-expect-error adsbygoogle global
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {}
  }, [])

  // Sem AdSense configurado: não renderiza nada (evita espaço em branco)
  if (!isAdsenseActive) return null

  return (
    <div className={`my-6 text-center ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  )
}
