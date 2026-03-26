import { useEffect, useMemo, useState } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../config/firebase'

export interface ReaderPreferences {
  fontSize: number
  theme: 'light' | 'sepia' | 'dark'
  fontFamily: 'Amiri' | 'Noto Naskh Arabic' | 'Scheherazade New'
  lineHeight: number
}

const defaultPreferences: ReaderPreferences = {
  fontSize: 24,
  theme: 'sepia',
  fontFamily: 'Amiri',
  lineHeight: 1.8,
}

export default function useReaderPreferences(uid?: string, profilePrefs?: Partial<ReaderPreferences>) {
  const [preferences, setPreferences] = useState<ReaderPreferences>(defaultPreferences)

  useEffect(() => {
    const fromCache = localStorage.getItem('reader-preferences')

    if (fromCache) {
      try {
        setPreferences(JSON.parse(fromCache) as ReaderPreferences)
        return
      } catch {
        localStorage.removeItem('reader-preferences')
      }
    }

    if (profilePrefs) {
      setPreferences({
        ...defaultPreferences,
        ...profilePrefs,
      })
    }
  }, [profilePrefs])

  const updatePreference = async <K extends keyof ReaderPreferences>(
    key: K,
    value: ReaderPreferences[K],
  ) => {
    const next = {
      ...preferences,
      [key]: value,
    }

    setPreferences(next)
    localStorage.setItem('reader-preferences', JSON.stringify(next))

    if (uid) {
      await setDoc(
        doc(db, 'users', uid),
        {
          preferences: next,
        },
        { merge: true },
      )
    }
  }

  const themeStyles = useMemo(() => {
    if (preferences.theme === 'dark') {
      return {
        background: '#1A1410',
        color: '#F5F0E8',
      }
    }

    if (preferences.theme === 'light') {
      return {
        background: '#FFFFFF',
        color: '#3E2723',
      }
    }

    return {
      background: '#FDF6E3',
      color: '#3E2723',
    }
  }, [preferences.theme])

  return {
    preferences,
    updatePreference,
    themeStyles,
  }
}
