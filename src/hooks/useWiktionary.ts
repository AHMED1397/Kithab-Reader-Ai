import { useEffect, useState } from 'react'
import { fetchWiktionaryDefinition, type WiktionaryResult } from '../services/wiktionaryService'

export default function useWiktionary(word: string, enabled: boolean) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<WiktionaryResult | null>(null)

  useEffect(() => {
    if (!enabled || !word) {
      setData(null)
      return
    }

    let active = true

    const run = async () => {
      setLoading(true)
      try {
        const result = await fetchWiktionaryDefinition(word)
        if (!active) return
        setData(result)
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

  return { data, loading }
}
