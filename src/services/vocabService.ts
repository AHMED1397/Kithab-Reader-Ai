import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import type { SentenceExplanation, WordAnalysis } from '../types/gemini'
import type { VocabularyEntry } from '../types/kitab'

interface SaveVocabPayload {
  uid: string
  word: string
  analysis: WordAnalysis
  context: string
  kitabId: string
  chapterId: string
}

interface SaveExplanationPayload {
  uid: string
  sentence: string
  explanation: SentenceExplanation
  kitabId: string
  chapterId: string
}

function toDate(value: unknown) {
  if (value instanceof Timestamp) {
    return value.toDate()
  }
  return undefined
}

export function subscribeToUserVocabulary(
  uid: string,
  onChange: (entries: VocabularyEntry[]) => void,
): Unsubscribe {
  const vocabQuery = query(collection(db, 'users', uid, 'vocabulary'), orderBy('savedAt', 'desc'))

  return onSnapshot(vocabQuery, (snapshot) => {
    const entries = snapshot.docs.map((docItem) => {
      const data = docItem.data()
      return {
        id: docItem.id,
        word: String(data.word ?? ''),
        meaningAr: String(data.meaningAr ?? data.meaning ?? ''),
        meaningTa: String(data.meaningTa ?? ''),
        meaningEn: String(data.meaningEn ?? ''),
        context: String(data.context ?? ''),
        kitabId: String(data.kitabId ?? ''),
        chapterId: String(data.chapterId ?? ''),
        savedAt: toDate(data.savedAt),
        reviewCount: Number(data.reviewCount ?? 0),
      } as VocabularyEntry
    })

    onChange(entries)
  })
}

export async function removeVocabularyEntry(uid: string, vocabId: string) {
  await deleteDoc(doc(db, 'users', uid, 'vocabulary', vocabId))
  await setDoc(
    doc(db, 'users', uid),
    {
      stats: {
        totalVocabSaved: increment(-1),
      },
    },
    { merge: true },
  )
}

export async function incrementVocabularyReview(uid: string, vocabId: string) {
  await updateDoc(doc(db, 'users', uid, 'vocabulary', vocabId), {
    reviewCount: increment(1),
  })
}

export async function saveVocabularyEntry(payload: SaveVocabPayload) {
  await addDoc(collection(db, 'users', payload.uid, 'vocabulary'), {
    word: payload.word,
    meaningAr: payload.analysis.meaningAr,
    meaningTa: payload.analysis.meaningTa,
    meaningEn: payload.analysis.meaningEn,
    context: payload.context,
    kitabId: payload.kitabId,
    chapterId: payload.chapterId,
    savedAt: serverTimestamp(),
    reviewCount: 0,
  })

  await setDoc(
    doc(db, 'users', payload.uid),
    {
      stats: {
        totalVocabSaved: increment(1),
      },
    },
    { merge: true },
  )
}

export async function saveSentenceExplanation(payload: SaveExplanationPayload) {
  await addDoc(collection(db, 'users', payload.uid, 'explanations'), {
    sentence: payload.sentence,
    explanation: payload.explanation.fullText,
    kitabId: payload.kitabId,
    chapterId: payload.chapterId,
    savedAt: serverTimestamp(),
    bookmarked: false,
  })
}
