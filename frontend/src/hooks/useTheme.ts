import { useState, useEffect } from 'react'

export type Theme = 'dark' | 'light'

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : '')
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme')
    return stored === 'light' ? 'light' : 'dark'
  })

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return { theme, toggle }
}
