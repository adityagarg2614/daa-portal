'use client'

import { useEffect, useState, useRef } from 'react'

type Theme = 'light' | 'dark'

export function useTheme() {
  const themeRef = useRef<Theme>('light')
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)
  const initialized = useRef(false)

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const saved = localStorage.getItem('theme') as Theme | null
    const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    const initialTheme = saved || system

    // Set theme immediately to avoid flicker
    document.documentElement.classList.toggle('dark', initialTheme === 'dark')
    localStorage.setItem('theme', initialTheme)

    themeRef.current = initialTheme
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(initialTheme)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    const newTheme = themeRef.current === 'light' ? 'dark' : 'light'
    themeRef.current = newTheme
    setTheme(newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
    localStorage.setItem('theme', newTheme)
  }

  return { theme, toggleTheme, mounted }
}
