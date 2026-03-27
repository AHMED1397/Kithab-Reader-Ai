const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || ''
const GROQ_MODEL = 'llama-3.1-8b-instant'
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions'

export const groqConfig = {
  apiKey: GROQ_API_KEY,
  model: GROQ_MODEL,
  endpoint: GROQ_BASE_URL,
}

export function assertGroqReady() {
  if (!groqConfig.apiKey) {
    throw new Error('مفتاح Groq غير موجود في ملف البيئة')
  }
}
