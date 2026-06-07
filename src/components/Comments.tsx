'use client'
import { useEffect, useRef } from 'react'
import { IconMessageCircle } from '@tabler/icons-react'

export function Comments() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current || ref.current.childElementCount) return
    const dark = document.documentElement.classList.contains('dark')
    const s = document.createElement('script')
    s.src = 'https://giscus.app/client.js'
    s.async = true
    s.crossOrigin = 'anonymous'
    const attrs: Record<string, string> = {
      'data-repo': 'le0nam6/dinheiro-descomplicado',
      'data-repo-id': 'R_kgDOSyFHrw',
      'data-category': 'General',
      'data-category-id': 'DIC_kwDOSyFHr84C-sz4',
      'data-mapping': 'pathname',
      'data-strict': '0',
      'data-reactions-enabled': '1',
      'data-emit-metadata': '0',
      'data-input-position': 'top',
      'data-theme': dark ? 'dark' : 'light',
      'data-lang': 'pt',
      'data-loading': 'lazy',
    }
    Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v))
    ref.current.appendChild(s)
  }, [])

  return (
    <section className="mt-16 border-t border-gray-200 pt-10">
      <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 mb-6">
        <IconMessageCircle size={22} stroke={1.75} className="text-green-600" /> Comentários
      </h2>
      <div ref={ref} />
    </section>
  )
}
