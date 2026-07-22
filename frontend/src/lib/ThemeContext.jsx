import { createContext, useContext, useState, useEffect } from 'react'
import { flushSync } from 'react-dom'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('gz-theme') || 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('gz-theme', theme)
  }, [theme])

  // originX/originY (click coordinates) drive a circular reveal via the View
  // Transitions API — the new theme expands outward from the toggle button
  // instead of a flat cross-fade. Falls back to an instant switch on browsers
  // without support (Firefox/Safari at time of writing) or reduced-motion.
  const toggle = (originX, originY) => {
    const next = theme === 'dark' ? 'light' : 'dark'
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!document.startViewTransition || reduceMotion) {
      setTheme(next)
      return
    }

    const x = originX ?? window.innerWidth / 2
    const y = originY ?? window.innerHeight / 2

    const transition = document.startViewTransition(() => {
      flushSync(() => setTheme(next))
    })

    transition.ready.then(() => {
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      )
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`] },
        { duration: 550, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' }
      )
    })
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
