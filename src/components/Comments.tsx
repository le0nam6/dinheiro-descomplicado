'use client'
import { useEffect, useRef } from 'react'

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
    <section className="mt-12 border-t border-gray-200 pt-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">💬 Comentários</h2>
      <div ref={ref} />
    </section>
  )
}
