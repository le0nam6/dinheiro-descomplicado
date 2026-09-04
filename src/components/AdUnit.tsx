'use client'

import { useEffect } from 'react'

// Pontos de anuncio do layout. Os numeros vieram do Ezoic e ficaram como
// identificadores dos lugares: 101 topo de listagem, 102 abaixo do titulo,
// 103 meio do artigo, 104 fim do artigo, 105 home, 106 sidebar.
//
// Cada ponto so renderiza quando existe um slot correspondente criado no painel
// do AdSense e exposto por env. Sem slot, o componente nao renderiza nada — uma
// <div> vazia no meio do artigo atrapalha o layout e nao vira anuncio.
const SLOTS: Record<number, string | undefined> = {
  101: process.env.NEXT_PUBLIC_ADSENSE_SLOT_LISTAGEM,
  102: process.env.NEXT_PUBLIC_ADSENSE_SLOT_POS_TITULO,
  103: process.env.NEXT_PUBLIC_ADSENSE_SLOT_MEIO_ARTIGO,
  104: process.env.NEXT_PUBLIC_ADSENSE_SLOT_FIM_ARTIGO,
  105: process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME,
  106: process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR,
}

interface AdUnitProps {
  placeholderId: number
  className?: string
}

export function AdUnit({ placeholderId, className = '' }: AdUnitProps) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_ID
  const slot = SLOTS[placeholderId]

  useEffect(() => {
    if (!client || !slot) return
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ads = ((window as any).adsbygoogle = (window as any).adsbygoogle || [])
      ads.push({})
    } catch {
      // adblock ou script bloqueado: nao quebra a pagina
    }
  }, [client, slot])

  if (!client || !slot) return null

  return (
    <div className={`my-6 ${className}`}>
      {/* rotulo exigido pela politica: o anuncio precisa ser distinguivel do conteudo */}
      <span className="block text-[11px] uppercase tracking-wide text-neutral-400 mb-1">Publicidade</span>
      <ins
        className="adsbygoogle block"
        style={{ display: 'block' }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  )
}
