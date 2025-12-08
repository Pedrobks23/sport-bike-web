import { createContext, useContext, useEffect, useMemo, useState } from "react"

const UIContext = createContext(undefined)

const XMAS_MODE_KEY = "xmas_mode_enabled"
const THEME_KEY = "theme"

export function UIProvider({ children }) {
  const [isXmasMode, setIsXmasMode] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const savedSnow = localStorage.getItem(XMAS_MODE_KEY)
    if (savedSnow === "true") {
      setIsXmasMode(true)
    }
  }, [])

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
    localStorage.setItem(XMAS_MODE_KEY, isXmasMode ? "true" : "false")
  }, [isXmasMode])

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
      isXmasMode,
      enableXmas: () => setIsXmasMode(true),
      disableXmas: () => setIsXmasMode(false),
      toggleXmas: () => setIsXmasMode((prev) => !prev),
      isDarkMode,
      toggleDarkMode: () => setIsDarkMode((prev) => !prev),
      prefersReducedMotion,
    }),
    [isXmasMode, isDarkMode, prefersReducedMotion]
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
