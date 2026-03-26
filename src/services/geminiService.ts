import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { assertGeminiReady, geminiConfig } from '../config/gemini'
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

function sharedWordCacheRef(word: string) {
  return doc(db, 'sharedWordCache', normalizeArabic(word))
}

async function getSharedWordAnalysis(word: string) {
  const snapshot = await getDoc(sharedWordCacheRef(word))
  if (!snapshot.exists()) {
    return null
  }

  const data = snapshot.data()
  return {
    meaningAr: String(data.meaningAr ?? 'غير متوفر'),
    meaningTa: String(data.meaningTa ?? 'கிடைக்கவில்லை'),
    meaningEn: String(data.meaningEn ?? 'Not available'),
  } as WordAnalysis
}

async function saveSharedWordAnalysis(word: string, analysis: WordAnalysis) {
  await setDoc(
    sharedWordCacheRef(word),
    {
      word,
      normalizedWord: normalizeArabic(word),
      meaningAr: analysis.meaningAr,
      meaningTa: analysis.meaningTa,
      meaningEn: analysis.meaningEn,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function readGeminiError(response: Response) {
  try {
    const payload = (await response.json()) as {
      error?: { code?: number; status?: string; message?: string }
    }
    return payload.error ?? null
  } catch {
    return null
  }
}

async function callGemini(prompt: string) {
  assertGeminiReady()

  if (!navigator.onLine) {
    throw new Error('OFFLINE_GEMINI')
  }

  const retriableStatuses = new Set([429, 500, 502, 503, 504])
  const maxAttemptsPerKey = 2
  const maxKeysToTry = Math.min(geminiConfig.apiKeys.length, 5)
  let lastError = 'GEMINI_UNAVAILABLE'

  for (let keyAttempt = 0; keyAttempt < maxKeysToTry; keyAttempt++) {
    const currentApiKey = geminiConfig.getCurrentApiKey()
    
    for (const endpoint of geminiConfig.endpoints) {
      for (let attempt = 1; attempt <= maxAttemptsPerKey; attempt += 1) {
        let response: Response

        try {
          response = await fetch(`${endpoint}?key=${currentApiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [{ text: prompt }],
                },
              ],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 900,
              },
            }),
          })
        } catch {
          lastError = navigator.onLine ? 'GEMINI_NETWORK' : 'OFFLINE_GEMINI'
          if (attempt < maxAttemptsPerKey) {
            await sleep(500 * attempt)
            continue
          }
          break
        }

        if (!response.ok) {
          const errorPayload = await readGeminiError(response)

          if (response.status === 404 || errorPayload?.status === 'NOT_FOUND') {
            lastError = 'GEMINI_NOT_FOUND'
            break
          }

          if (retriableStatuses.has(response.status)) {
            lastError = response.status === 429 ? 'GEMINI_RATE_LIMIT' : 'GEMINI_UNAVAILABLE'
            
            if (response.status === 429) {
               // If we hit a rate limit, rotate to the next key and break to the outer loop
               geminiConfig.rotateKey()
               break
            }

            if (attempt < maxAttemptsPerKey) {
              await sleep(600 * attempt)
              continue
            }
            break
          }

          if (response.status === 401 || response.status === 403) {
            // Invalid key, rotate and try another
            geminiConfig.rotateKey()
            break
          }

          throw new Error(`GEMINI_HTTP_${response.status}`)
        }

        const payload = (await response.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
        }

        const output = payload.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

        if (!output) {
          if (attempt < maxAttemptsPerKey) {
            await sleep(400 * attempt)
            continue
          }
          throw new Error('GEMINI_EMPTY')
        }

        return output
      }
      
      // If we've hit a break because of a 429 or auth error, skip other endpoints for this key
      if (lastError === 'GEMINI_RATE_LIMIT') break
    }
  }

  throw new Error(lastError)
}

function parseLine(source: string, labels: string[]) {
  for (const label of labels) {
    const regex = new RegExp(`${label}\\s*:\\s*(.+)`, 'i')
    const match = source.match(regex)
    if (match?.[1]?.trim()) {
      return match[1].trim()
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

function parseWordAnalysis(rawText: string): WordAnalysis {
  const json = extractJsonBlock(rawText)

  if (json) {
    return {
      meaningAr: String(json.meaningAr ?? json.ar ?? json.arabic ?? 'غير متوفر'),
      meaningTa: String(json.meaningTa ?? json.ta ?? json.tamil ?? 'கிடைக்கவில்லை'),
      meaningEn: String(json.meaningEn ?? json.en ?? json.english ?? 'Not available'),
    }
  }

  return {
    meaningAr: parseLine(rawText, ['المعنى بالعربية', 'Arabic Meaning', 'المعنى']) || 'غير متوفر',
    meaningTa: parseLine(rawText, ['المعنى بالتاميلية', 'Tamil Meaning']) || 'கிடைக்கவில்லை',
    meaningEn: parseLine(rawText, ['Meaning (English)', 'English Meaning']) || 'Not available',
  }
}

function parseSentenceExplanation(rawText: string): SentenceExplanation {
  const json = extractJsonBlock(rawText)

  if (json) {
    return {
      summary: String(json.summary ?? 'غير متوفر'),
      grammar: String(json.grammar ?? 'غير متوفر'),
      difficultTerms: String(json.difficultTerms ?? 'غير متوفر'),
      benefit: String(json.benefit ?? 'غير متوفر'),
      meaningAr: String(json.meaningAr ?? 'غير متوفر'),
      meaningTa: String(json.meaningTa ?? 'கிடைக்கவில்லை'),
      meaningEn: String(json.meaningEn ?? 'Not available'),
      fullText: rawText,
    }
  }

  return {
    summary:
      parseLine(rawText, ['١\\. المعنى الإجمالي للجملة', '1\\. المعنى الإجمالي للجملة']) ||
      'غير متوفر',
    grammar:
      parseLine(rawText, ['٢\\. إعراب الكلمات الرئيسية', '2\\. إعراب الكلمات الرئيسية']) ||
      'غير متوفر',
    difficultTerms:
      parseLine(rawText, ['٣\\. شرح أي مصطلحات صعبة', '3\\. شرح أي مصطلحات صعبة']) ||
      'غير متوفر',
    benefit:
      parseLine(rawText, ['٤\\. الفائدة أو القاعدة المستخرجة إن وُجدت', '4\\. الفائدة أو القاعدة المستخرجة إن وُجدت']) ||
      'غير متوفر',
    meaningAr: parseLine(rawText, ['المعنى بالعربية', 'معنى الجملة بالعربية']) || 'غير متوفر',
    meaningTa: parseLine(rawText, ['المعنى بالتاميلية', 'Tamil Translation']) || 'கிடைக்கவில்லை',
    meaningEn: parseLine(rawText, ['Meaning (English)', 'English Translation']) || 'Not available',
    fullText: rawText,
  }
}

export async function analyzeWordWithGemini(clickedWord: string, surroundingText: string) {
  const normalizedWord = normalizeArabic(clickedWord)
  const cacheKey = `gemini:word:${normalizedWord}`
  const cached = localStorage.getItem(cacheKey)

  if (cached) {
    return JSON.parse(cached) as WordAnalysis
  }

  const sharedCached = await getSharedWordAnalysis(clickedWord)
  if (sharedCached) {
    localStorage.setItem(cacheKey, JSON.stringify(sharedCached))
    return sharedCached
  }

  const prompt = `أنت معجم عربي ذكي. أعد فقط JSON دون أي نص إضافي بالهيئة التالية:\n{ "meaningAr": "...", "meaningTa": "...", "meaningEn": "..." }\n\nالكلمة: "${clickedWord}"\nالسياق: "${surroundingText}"`

  const raw = await callGemini(prompt)
  const parsed = parseWordAnalysis(raw)

  await saveSharedWordAnalysis(clickedWord, parsed)
  localStorage.setItem(cacheKey, JSON.stringify(parsed))
  return parsed
}

export async function explainSentenceWithGemini(
  sentence: string,
  kitabTitle: string,
  chapterTitle: string,
) {
  const cacheKey = `gemini:sentence:${keyHash(normalizeArabic(`${sentence}|${kitabTitle}|${chapterTitle}`))}`
  const cached = localStorage.getItem(cacheKey)

  if (cached) {
    return JSON.parse(cached) as SentenceExplanation
  }

  const prompt = `أنت أستاذ لغة عربية متخصص. أعد فقط JSON دون أي نص إضافي بالهيئة التالية:\n{ "summary": "...", "grammar": "...", "difficultTerms": "...", "benefit": "...", "meaningAr": "...", "meaningTa": "...", "meaningEn": "..." }\n\nالجملة: "${sentence}"\nالمصدر: كتاب "${kitabTitle}" - ${chapterTitle}`

  const raw = await callGemini(prompt)
  const parsed = parseSentenceExplanation(raw)

  localStorage.setItem(cacheKey, JSON.stringify(parsed))
  return parsed
}
