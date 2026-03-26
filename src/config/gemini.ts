const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_BASE_URLS = [
  'https://generativelanguage.googleapis.com/v1beta',
  'https://generativelanguage.googleapis.com/v1',
]

export const geminiConfig = {
  apiKey: GEMINI_API_KEY,
  model: GEMINI_MODEL,
  endpoints: GEMINI_BASE_URLS.map((baseUrl) => `${baseUrl}/models/${GEMINI_MODEL}:generateContent`),
}

export function assertGeminiReady() {
  if (!geminiConfig.apiKey) {
    throw new Error('مفتاح Gemini غير موجود في ملف البيئة')
  }
}
