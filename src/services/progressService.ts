import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import type { ReadingProgress } from '../types/kitab'

export async function getReadingProgress(uid: string, kitabId: string) {
  const snapshot = await getDoc(doc(db, 'users', uid, 'readingProgress', kitabId))

  if (!snapshot.exists()) {
    return null
  }

  const data = snapshot.data()
  return {
    kitabId,
    currentChapter: String(data.currentChapter ?? ''),
    scrollPosition: Number(data.scrollPosition ?? 0),
    completed: Boolean(data.completed),
    lastReadAt: data.lastReadAt,
  } as ReadingProgress
}

export async function saveReadingProgress(
  uid: string,
  kitabId: string,
  payload: Pick<ReadingProgress, 'currentChapter' | 'scrollPosition' | 'completed'>,
) {
  await setDoc(
    doc(db, 'users', uid, 'readingProgress', kitabId),
    {
      ...payload,
      lastReadAt: serverTimestamp(),
    },
    { merge: true },
  )
}
