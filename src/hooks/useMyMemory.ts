import { useEffect, useState } from 'react'
import { translateWithMyMemory } from '../services/myMemoryService'

export default function useMyMemory(word: string, enabled: boolean) {
  const [loading, setLoading] = useState(false)
  const [translationEn, setTranslationEn] = useState('')
  const [translationTa, setTranslationTa] = useState('')

  useEffect(() => {
    if (!enabled || !word) {
      setTranslationEn('')
      setTranslationTa('')
      return
    }

    let active = true

    const run = async () => {
      setLoading(true)
      try {
        const [en, ta] = await Promise.all([
          translateWithMyMemory(word, 'en'),
          translateWithMyMemory(word, 'ta'),
        ])
        
        if (!active) return

        setTranslationEn(en)
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

  return { translationEn, translationTa, loading }
}
