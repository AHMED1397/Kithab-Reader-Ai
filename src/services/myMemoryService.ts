interface MyMemoryMatch {
  id: string
  segment: string
  translation: string
  source: string
  target: string
  quality: string | number
  reference: string | null
  'usage-count': number
  subject: string
  'created-by': string
  'last-updated-by': string
  'create-date': string
  'last-update-date': string
  match: number
  penalty: number
}

interface MyMemoryResponse {
  responseData: {
    translatedText: string
    match: number
  }
  quotaFinished: boolean
  mtLangSupported: string | null
  responseDetails: string
  responseStatus: number
  responderId: string | null
  exception_code: string | null
  matches: MyMemoryMatch[]
}

export async function translateWithMyMemory(word: string, toLang: 'en' | 'ta'): Promise<string> {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=ar|${toLang}`
  try {
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`MyMemory API error: ${res.statusText}`)
    }
    const data = (await res.json()) as MyMemoryResponse
    
    if (data.responseStatus === 200 && data.responseData.translatedText) {
      return data.responseData.translatedText
    }
    return ''
  } catch (error) {
    console.error('MyMemory API fetch error:', error)
    return ''
  }
}
