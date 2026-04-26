'use client'
import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'girly'

const ThemeContext = createContext<{
  theme: Theme
  setTheme: (t: Theme) => void
}>({ theme: 'dark', setTheme: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark')

  useEffect(() => {
    const saved = localStorage.getItem('cinehome-theme') as Theme | null
    if (saved === 'girly') apply('girly')
  }, [])

  function apply(t: Theme) {
    setThemeState(t)
    if (t === 'girly') {
      document.documentElement.setAttribute('data-theme', 'girly')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
    localStorage.setItem('cinehome-theme', t)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: apply }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
