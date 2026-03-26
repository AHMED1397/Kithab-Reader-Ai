import { useEffect, useState } from 'react'
import { translateWithPons } from '../services/ponsService'

export default function usePons(word: string, enabled: boolean) {
  const [loading, setLoading] = useState(false)
  const [translation, setTranslation] = useState('')

  useEffect(() => {
    if (!enabled || !word) {
      setTranslation('')
      return
    }

    let active = true

    const run = async () => {
      setLoading(true)
      try {
        const result = await translateWithPons(word)
        if (!active) return
        setTranslation(result)
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

  return { translation, loading }
}
