import { useEffect, useState } from 'react'
import { translateWithLingva } from '../services/lingvaService'

export default function useLingva(word: string, enabled: boolean) {
  const [loading, setLoading] = useState(false)
  const [translationTa, setTranslationTa] = useState('')

  useEffect(() => {
    if (!enabled || !word) {
      setTranslationTa('')
      return
    }

    let active = true

    const run = async () => {
      setLoading(true)
      try {
        const ta = await translateWithLingva(word, 'ta')
        
        if (!active) return

        setTranslationTa(ta)
      } catch (e) {
        // ignore errors
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void run()

    return () => {
      active = false
    }
  }, [word, enabled])

  return { translationTa, loading }
}
