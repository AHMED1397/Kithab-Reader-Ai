import { useState } from 'react'
import { saveSentenceExplanation, saveVocabularyEntry } from '../services/vocabService'
import type { SentenceExplanation, WordAnalysis } from '../types/gemini'

export default function useVocabulary(uid?: string) {
  const [saving, setSaving] = useState(false)

  const saveWord = async (
    word: string,
    analysis: WordAnalysis,
    context: string,
    kitabId: string,
    chapterId: string,
  ) => {
    if (!uid) {
      throw new Error('يجب تسجيل الدخول أولًا')
    }

    setSaving(true)
    try {
      await saveVocabularyEntry({ uid, word, analysis, context, kitabId, chapterId })
    } finally {
      setSaving(false)
    }
  }

  const saveExplanation = async (
    sentence: string,
    explanation: SentenceExplanation,
    kitabId: string,
    chapterId: string,
  ) => {
    if (!uid) {
      throw new Error('يجب تسجيل الدخول أولًا')
    }

    setSaving(true)
    try {
      await saveSentenceExplanation({ uid, sentence, explanation, kitabId, chapterId })
    } finally {
      setSaving(false)
    }
  }

  return {
    saving,
    saveWord,
    saveExplanation,
  }
}
