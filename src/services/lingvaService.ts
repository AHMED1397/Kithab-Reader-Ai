export async function translateWithLingva(word: string, toLang: 'en' | 'ta'): Promise<string> {
  if (!word) return ''

  const cacheKey = `lingva-cache-${toLang}-${word}`
  const cached = localStorage.getItem(cacheKey)
  if (cached) {
    return cached
  }

  const url = `https://lingva.ml/api/v1/ar/${toLang}/${encodeURIComponent(word)}`
  try {
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`Lingva API error: ${res.statusText}`)
    }
    const data = await res.json()
    
    if (data && data.translation) {
      localStorage.setItem(cacheKey, data.translation)
      return data.translation
    }
    return ''
  } catch (error) {
    console.error('Lingva API fetch error:', error)
    return ''
  }
}
