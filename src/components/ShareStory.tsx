'use client'
import { useState } from 'react'
import { IconBrandWhatsapp, IconLink, IconCheck } from '@tabler/icons-react'

/** Compartilhar uma matéria da edição no WhatsApp + copiar link direto. */
export function ShareStory({ headline, summary, url }: { headline: string; summary: string; url: string }) {
  const [copied, setCopied] = useState(false)

  const text = `📰 ${headline}\n\n${summary}\n\nLeia no Endinheirados:\n${url}`
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(text)}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* noop */ }
  }

  return (
    <div className="flex items-center gap-2">
      <a
        href={whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors"
      >
        <IconBrandWhatsapp size={15} stroke={2} /> Compartilhar
      </a>
      <button
        onClick={copy}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
      >
        {copied ? <><IconCheck size={15} stroke={2} /> Copiado</> : <><IconLink size={15} stroke={2} /> Link</>}
      </button>
    </div>
  )
}
