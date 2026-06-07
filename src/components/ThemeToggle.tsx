'use client'
import { useEffect, useState } from 'react'
import { IconSun, IconMoon } from '@tabler/icons-react'

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
      className="p-2 rounded-lg text-gray-500 hover:text-green-700 hover:bg-green-50 transition-colors"
      title={dark ? 'Modo claro' : 'Modo escuro'}
    >
      {dark ? <IconSun size={18} stroke={1.75} /> : <IconMoon size={18} stroke={1.75} />}
    </button>
  )
}
