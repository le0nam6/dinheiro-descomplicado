'use client'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const isDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', isDark)
    setDark(isDark)
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  return (
    <button
      onClick={toggle}
      aria-label="Alternar tema"
      className="px-2.5 py-1.5 text-sm rounded-lg hover:bg-green-50 hover:dark:bg-gray-800 transition-colors"
      title={dark ? 'Modo claro' : 'Modo escuro'}
    >
      {dark ? '☀️' : '🌙'}
    </button>
  )
}
