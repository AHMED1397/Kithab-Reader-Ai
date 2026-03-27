import { assertGroqReady, groqConfig } from '../config/groq'
import { translateWithMyMemory } from './myMemoryService'
import type { SentenceExplanation, WordAnalysis } from '../types/gemini'

function normalizeArabic(text: string) {
  return text
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[\u0640]/g, '')
    .trim()
    .toLowerCase()
}

function keyHash(value: string) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index)
    hash |= 0
  }
  return String(Math.abs(hash))
}

function parseLine(source: string, labels: string[]) {
  for (const label of labels) {
    const regex = new RegExp(`(?:${label})\\s*[:=؛-]?\\s*(.+)`, 'i')
    const match = source.match(regex)
    if (match?.[1]?.trim()) {
      return match[1].trim().replace(/^["'](.*)["']$/, '$1')
    }
  }

  return ''
}

function extractJsonBlock(rawText: string) {
  const start = rawText.indexOf('{')
  const end = rawText.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    return null
  }

  const jsonText = rawText.slice(start, end + 1)
  try {
    return JSON.parse(jsonText) as Record<string, string>
  } catch {
    return null
  }
}

function extractFieldFromRawJsonLike(rawText: string, fieldName: string) {
  const escapedField = fieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const stringValueRegex = new RegExp(`"${escapedField}"\\s*:\\s*"([\\s\\S]*?)(?:"\\s*,|"$)`, 'i')
  const stringValueMatch = rawText.match(stringValueRegex)
  if (stringValueMatch?.[1]) {
    return stringValueMatch[1].replace(/\\"/g, '"').trim()
  }

  const bareValueRegex = new RegExp(`"${escapedField}"\\s*:\\s*([^,}\\n]+)`, 'i')
  const bareValueMatch = rawText.match(bareValueRegex)
  if (bareValueMatch?.[1]) {
    return bareValueMatch[1].replace(/^["']|["']$/g, '').trim()
  }

  return ''
}

function isUnavailableValue(value: string) {
  const normalized = value.trim().toLowerCase()
  return (
    !normalized ||
    normalized === 'غير متوفر' ||
    normalized === 'not available' ||
    normalized === 'கிடைக்கவில்லை'
  )
}

function hasTamilScript(value: string) {
  return /[\u0B80-\u0BFF]/.test(value)
}

function looksLikeEnglish(value: string) {
  return /[A-Za-z]/.test(value)
}

function hasUsefulAnalysis(value: WordAnalysis) {
  return (
    !isUnavailableValue(value.meaningAr) ||
    !isUnavailableValue(value.meaningTa) ||
    !isUnavailableValue(value.meaningEn)
  )
}

function needsTranslationBackfill(value: WordAnalysis) {
  const taMissingOrWrong = isUnavailableValue(value.meaningTa) || (!hasTamilScript(value.meaningTa) && looksLikeEnglish(value.meaningTa))
  return !isUnavailableValue(value.meaningAr) && (taMissingOrWrong || isUnavailableValue(value.meaningEn))
}

async function fillMissingTranslations(analysis: WordAnalysis, sourceOverride?: string): Promise<WordAnalysis> {
  const next = { ...analysis }
  const sourceText = sourceOverride?.trim() || (!isUnavailableValue(next.meaningAr) ? next.meaningAr : '')
  if (!sourceText) {
    return next
  }

  if (isUnavailableValue(next.meaningTa) || (!hasTamilScript(next.meaningTa) && looksLikeEnglish(next.meaningTa))) {
    const ta = await translateWithMyMemory(sourceText, 'ta')
    if (ta && ta.toLowerCase() !== sourceText.toLowerCase()) {
      next.meaningTa = ta
    }
  }

  if (isUnavailableValue(next.meaningEn)) {
    const en = await translateWithMyMemory(sourceText, 'en')
    if (en && en.toLowerCase() !== sourceText.toLowerCase()) {
      next.meaningEn = en
    }
  }

  return next
}

async function applyLiteralSentenceTranslations(
  analysis: WordAnalysis,
  sentence: string,
): Promise<WordAnalysis> {
  const next = { ...analysis }
  const sourceSentence = sentence.trim()
  if (!sourceSentence) {
    return next
  }

  const [ta, en] = await Promise.all([
    translateWithMyMemory(sourceSentence, 'ta'),
    translateWithMyMemory(sourceSentence, 'en'),
  ])

  if (ta && ta.toLowerCase() !== sourceSentence.toLowerCase()) {
    next.meaningTa = ta
  }
  if (en && en.toLowerCase() !== sourceSentence.toLowerCase()) {
    next.meaningEn = en
  }

  return next
}

async function callGroq(prompt: string) {
  assertGroqReady()

  if (!navigator.onLine) {
    throw new Error('OFFLINE_GROQ')
  }

  const response = await fetch(groqConfig.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${groqConfig.apiKey}`,
    },
    body: JSON.stringify({
      model: groqConfig.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    throw new Error(`GROQ_HTTP_${response.status}`)
  }

  const payload = await response.json()
  const content = payload.choices?.[0]?.message?.content?.trim()

  if (!content) {
    throw new Error('GROQ_EMPTY')
  }

  console.log('Groq raw output:', content)
  return content
}

function parseWordAnalysis(rawText: string): WordAnalysis {
  const json = extractJsonBlock(rawText)

  let ar = ''
  let ta = ''
  let en = ''

  if (json) {
    ar = String(json.meaningAr ?? json.ar ?? json.arabic ?? json.Arabic ?? json['المعنى'] ?? json['المعنى بالعربية'] ?? '')
    ta = String(json.meaningTa ?? json.ta ?? json.tamil ?? json.Tamil ?? json['المعنى بالتاميلية'] ?? json['அர்த்தம்'] ?? '')
    en = String(json.meaningEn ?? json.en ?? json.english ?? json.English ?? json['Meaning (English)'] ?? json.Meaning ?? '')
  }

  if (!ar) ar = extractFieldFromRawJsonLike(rawText, 'meaningAr')
  if (!ta) ta = extractFieldFromRawJsonLike(rawText, 'meaningTa')
  if (!en) en = extractFieldFromRawJsonLike(rawText, 'meaningEn')

  if (!ar) ar = parseLine(rawText, ['meaningAr', 'ar', 'arabic', 'المعنى بالعربية', 'Arabic Meaning', 'المعنى', 'عربي'])
  if (!ta) ta = parseLine(rawText, ['meaningTa', 'ta', 'tamil', 'المعنى بالتاميلية', 'Tamil Meaning', 'அர்த்தம்', 'تاميل'])
  if (!en) en = parseLine(rawText, ['meaningEn', 'en', 'english', 'Meaning \\(English\\)', 'English Meaning', 'Meaning', 'إنجليزي'])

  return {
    meaningAr: ar || 'غير متوفر',
    meaningTa: ta || 'கிடைக்கவில்லை',
    meaningEn: en || 'Not available',
  }
}

export async function analyzeWordWithGroq(clickedWord: string, surroundingText: string): Promise<WordAnalysis> {
  const normalizedWord = normalizeArabic(clickedWord)
  const cacheKey = `groq:word:${normalizedWord}`
  const cached = localStorage.getItem(cacheKey)

  if (cached) {
    const parsed = JSON.parse(cached) as WordAnalysis
    if (needsTranslationBackfill(parsed)) {
      const fixed = await fillMissingTranslations(parsed)
      localStorage.setItem(cacheKey, JSON.stringify(fixed))
      return fixed
    }
    if (hasUsefulAnalysis(parsed)) {
      return parsed
    }
  }

  const prompt = `أنت معجم عربي ذكي. أعد فقط JSON دون أي نص إضافي بالهيئة التالية:\n{ "meaningAr": "...", "meaningTa": "...", "meaningEn": "..." }\n\nالكلمة: "${clickedWord}"\nالسياق: "${surroundingText}"`

  const raw = await callGroq(prompt)
  const result = await fillMissingTranslations(parseWordAnalysis(raw))

  localStorage.setItem(cacheKey, JSON.stringify(result))
  return result
}

export async function explainSentenceWithGroq(
  sentence: string,
  kitabTitle: string,
  chapterTitle: string,
): Promise<SentenceExplanation> {
  const cacheKey = `groq:sentence:${keyHash(normalizeArabic(`${sentence}|${kitabTitle}|${chapterTitle}`))}`
  const cached = localStorage.getItem(cacheKey)

  if (cached) {
    const parsed = JSON.parse(cached) as SentenceExplanation
    if (needsTranslationBackfill(parsed)) {
      const filled = await fillMissingTranslations(parsed, sentence)
      const fixed = (await applyLiteralSentenceTranslations(filled, sentence)) as SentenceExplanation
      localStorage.setItem(cacheKey, JSON.stringify(fixed))
      return fixed
    }
    if (hasUsefulAnalysis(parsed)) {
      return parsed
    }
  }

  const prompt = `أنت مترجم عربي دقيق. أعد فقط JSON دون أي نص إضافي بالهيئة التالية:\n{ "meaningAr": "...", "meaningTa": "...", "meaningEn": "..." }\n\nالمطلوب:\n1) meaningAr: إعادة صياغة عربية قصيرة للجملة نفسها دون شرح مطوّل.\n2) meaningTa: ترجمة تاميلية مباشرة للجملة نفسها.\n3) meaningEn: ترجمة إنجليزية مباشرة للجملة نفسها.\n\nالجملة: "${sentence}"\nالمصدر: كتاب "${kitabTitle}" - ${chapterTitle}`

  const raw = await callGroq(prompt)
  const filled = await fillMissingTranslations(parseWordAnalysis(raw), sentence)
  const result = (await applyLiteralSentenceTranslations(filled, sentence)) as SentenceExplanation

  localStorage.setItem(cacheKey, JSON.stringify(result))
  return result
}
