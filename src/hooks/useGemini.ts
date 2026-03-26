import { useEffect, useState } from 'react'

export default function useGemini<T>(runner: () => Promise<T>, enabled: boolean) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      setError('')
      setData(null)
      return
    }

    let active = true

    const run = async () => {
      setLoading(true)
      setError('')
      setData(null)

      try {
        const output = await runner()
        if (!active) {
          return
        }

        setData(output)
      } catch (reason) {
        if (!active) {
          return
        }

        const message = reason instanceof Error ? reason.message : 'فشل الاتصال مع Gemini'
        setError(message)
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
  }, [enabled, runner])

  return {
    data,
    loading,
    error,
    setData,
  }
}
