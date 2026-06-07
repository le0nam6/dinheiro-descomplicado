'use client'

import { useEffect, useState } from 'react'
import { IconListSearch } from '@tabler/icons-react'

interface Props {
  headings: { text: string; id: string }[]
}

export function TableOfContents({ headings }: Props) {
  const [active, setActive] = useState('')

  useEffect(() => {
    // Destaque determinístico: a última seção cujo topo passou da marca de leitura.
    const onScroll = () => {
      let current = headings[0]?.id ?? ''
      for (const h of headings) {
        const el = document.getElementById(h.id)
        if (el && el.getBoundingClientRect().top <= 160) current = h.id
      }
      setActive(prev => (prev === current ? prev : current))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [headings])

  if (headings.length < 4) return null

  return (
    <nav className="text-sm">
      <p className="font-bold text-gray-900 mb-4 flex items-center gap-2">
        <IconListSearch size={18} stroke={1.75} className="text-green-600" /> Neste guia
      </p>
      <ul className="space-y-1 border-l border-gray-100">
        {headings.map(h => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={`block pl-4 -ml-px border-l-2 py-1 leading-snug transition-all duration-300 ${
                active === h.id
                  ? 'border-green-600 text-green-700 font-semibold'
                  : 'border-transparent text-gray-500 hover:text-green-700 hover:border-gray-300'
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
