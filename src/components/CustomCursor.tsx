'use client'

import { useEffect, useRef, useState } from 'react'

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)
  const [isHovering, setIsHovering] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const pos = useRef({ x: 0, y: 0 })
  const cursor = useRef({ x: 0, y: 0 })

  useEffect(() => {
    // Não mostrar em touch devices
    if ('ontouchstart' in window) return

    const move = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY }
      if (!isVisible) setIsVisible(true)

      // Dot segue instantaneamente
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${e.clientX - 4}px, ${e.clientY - 4}px)`
      }
    }

    const handleEnter = (e: Event) => {
      const target = e.target as HTMLElement
      if (target.matches('a, button, [role="button"], input, select, textarea, label')) {
        setIsHovering(true)
      }
    }

    const handleLeave = (e: Event) => {
      const target = e.target as HTMLElement
      if (target.matches('a, button, [role="button"], input, select, textarea, label')) {
        setIsHovering(false)
      }
    }

    window.addEventListener('mousemove', move)
    document.addEventListener('mouseover', handleEnter)
    document.addEventListener('mouseout', handleLeave)

    // Cursor grande com lag
    let raf: number
    const animate = () => {
      cursor.current.x += (pos.current.x - cursor.current.x) * 0.12
      cursor.current.y += (pos.current.y - cursor.current.y) * 0.12

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${cursor.current.x - 20}px, ${cursor.current.y - 20}px)`
      }
      raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', move)
      document.removeEventListener('mouseover', handleEnter)
      document.removeEventListener('mouseout', handleLeave)
      cancelAnimationFrame(raf)
    }
  }, [])

  if (typeof window !== 'undefined' && 'ontouchstart' in window) return null

  return (
    <>
      {/* Cursor grande com lag — emoji de dinheiro */}
      <div
        ref={cursorRef}
        className="pointer-events-none fixed top-0 left-0 z-[9999] select-none transition-all duration-150 will-change-transform"
        style={{ opacity: isVisible ? 1 : 0 }}
      >
        <div
          className="flex items-center justify-center rounded-full transition-all duration-200"
          style={{
            width: isHovering ? 52 : 40,
            height: isHovering ? 52 : 40,
            background: isHovering
              ? 'rgba(22, 163, 74, 0.15)'
              : 'rgba(22, 163, 74, 0.08)',
            border: isHovering
              ? '2px solid rgba(22, 163, 74, 0.6)'
              : '1.5px solid rgba(22, 163, 74, 0.3)',
            boxShadow: isHovering ? '0 0 16px rgba(22,163,74,0.3)' : 'none',
            fontSize: isHovering ? 22 : 18,
          }}
        >
          💰
        </div>
      </div>

      {/* Dot pequeno que segue instantaneamente */}
      <div
        ref={dotRef}
        className="pointer-events-none fixed top-0 left-0 z-[10000] select-none will-change-transform"
        style={{ opacity: isVisible ? 1 : 0 }}
      >
        <div
          className="rounded-full transition-all duration-150"
          style={{
            width: isHovering ? 6 : 8,
            height: isHovering ? 6 : 8,
            background: '#16a34a',
            boxShadow: '0 0 4px rgba(22,163,74,0.8)',
          }}
        />
      </div>

      {/* Cursor nativo escondido */}
      <style>{`
        *, *::before, *::after { cursor: none !important; }
      `}</style>
    </>
  )
}
