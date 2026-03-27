const GEMINI_API_KEY_RAW = import.meta.env.VITE_GEMINI_API_KEY || ''
const GEMINI_API_KEYS: string[] = GEMINI_API_KEY_RAW.split(',').map((k: string): string => k.trim()).filter(Boolean)
const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_BASE_URLS: string[] = [
  'https://generativelanguage.googleapis.com/v1beta',
  'https://generativelanguage.googleapis.com/v1',
]

let currentKeyIndex = 0

export const geminiConfig = {
  apiKeys: GEMINI_API_KEYS,
  model: GEMINI_MODEL,
  endpoints: GEMINI_BASE_URLS.map((baseUrl: string): string => `${baseUrl}/models/${GEMINI_MODEL}:generateContent`),

  getNextApiKey() {
    if (this.apiKeys.length === 0) return null
    const key = this.apiKeys[currentKeyIndex]
    currentKeyIndex = (currentKeyIndex + 1) % this.apiKeys.length
    return key
  },

  getCurrentApiKey() {
    if (this.apiKeys.length === 0) return null
    return this.apiKeys[currentKeyIndex]
  },

  rotateKey() {
    if (this.apiKeys.length === 0) return
    currentKeyIndex = (currentKeyIndex + 1) % this.apiKeys.length
  }
}

export function assertGeminiReady() {
  if (geminiConfig.apiKeys.length === 0) {
    throw new Error('مفاتيح Gemini غير موجودة في ملف البيئة')
  }
}
