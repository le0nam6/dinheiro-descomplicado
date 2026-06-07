'use client'
import { useEffect, useState } from 'react'
import { IconSun, IconMoon } from '@tabler/icons-react'

export function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    // Claro é o padrão; dark só quando o usuário escolhe explicitamente
    const isDark = localStorage.getItem('theme') === 'dark'
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
