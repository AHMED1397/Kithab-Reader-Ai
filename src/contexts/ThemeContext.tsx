import { createContext, useMemo, type ReactNode } from 'react'

interface ThemeContextValue {
  direction: 'rtl'
  locale: 'ar'
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const value = useMemo(
    () => ({
      direction: 'rtl' as const,
      locale: 'ar' as const,
    }),
    [],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
