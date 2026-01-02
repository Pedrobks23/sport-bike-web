import { createContext, useContext, useEffect, useMemo, useState } from "react"

const UIContext = createContext(undefined)

const THEME_KEY = "theme"

export function UIProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY)
    if (savedTheme === "dark") {
      setIsDarkMode(true)
      document.documentElement.classList.add("dark")
    }
  }, [])

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(media.matches)
    const handler = (event) => setPrefersReducedMotion(event.matches)
    media.addEventListener("change", handler)
    return () => media.removeEventListener("change", handler)
  }, [])

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark")
      localStorage.setItem(THEME_KEY, "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem(THEME_KEY, "light")
    }
  }, [isDarkMode])

  const value = useMemo(
    () => ({
      isDarkMode,
      toggleDarkMode: () => setIsDarkMode((prev) => !prev),
      prefersReducedMotion,
    }),
    [isDarkMode, prefersReducedMotion]
  )

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

export function useUI() {
  const ctx = useContext(UIContext)
  if (!ctx) {
    throw new Error("useUI must be used within UIProvider")
  }
  return ctx
}
