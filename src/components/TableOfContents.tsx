'use client'

import { useEffect, useState } from 'react'

interface Props {
  headings: { text: string; id: string }[]
}

export function TableOfContents({ headings }: Props) {
  const [active, setActive] = useState('')

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id) })
      },
      { rootMargin: '-80px 0px -70% 0px' }
    )
    headings.forEach(h => {
      const el = document.getElementById(h.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [headings])

  if (headings.length < 4) return null

  return (
    <nav className="text-sm">
      <p className="font-bold text-gray-900 mb-3 flex items-center gap-2">📑 Neste guia</p>
      <ul className="space-y-2 border-l-2 border-gray-100">
        {headings.map(h => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={`block pl-3 -ml-0.5 border-l-2 transition-colors leading-snug ${
                active === h.id
                  ? 'border-green-600 text-green-700 font-semibold'
                  : 'border-transparent text-gray-500 hover:text-green-700'
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
