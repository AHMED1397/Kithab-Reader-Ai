import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import type { KitabChapter, KitabDoc, KitabInput, ReadingProgress } from '../types/kitab'

function mapKitabDoc(id: string, data: Record<string, unknown>): KitabDoc {
  return {
    id,
    title: String(data.title ?? ''),
    author: String(data.author ?? ''),
    category: data.category as KitabDoc['category'],
    level: data.level as KitabDoc['level'],
    coverColor: String(data.coverColor ?? '#1B5E20'),
    description: String(data.description ?? ''),
    chapterCount: Number(data.chapterCount ?? 0),
    sourceFormat:
      data.sourceFormat === 'hierarchical' || data.sourceFormat === 'chapters'
        ? data.sourceFormat
        : undefined,
    structureLabels: Array.isArray(data.structureLabels)
      ? data.structureLabels.filter((item: unknown): item is string => typeof item === 'string')
      : undefined,
    createdAt: data.createdAt,
    addedBy: typeof data.addedBy === 'string' ? data.addedBy : undefined,
  }
}

export function subscribeToKitabs(onChange: (kitabs: KitabDoc[]) => void): Unsubscribe {
  const kitabsQuery = query(collection(db, 'kitabs'), orderBy('createdAt', 'desc'))

  return onSnapshot(kitabsQuery, (snapshot) => {
    const kitabs = snapshot.docs.map((docItem) => mapKitabDoc(docItem.id, docItem.data()))
    onChange(kitabs)
  })
}

export async function getKitabWithChapters(kitabId: string) {
  const cached = localStorage.getItem(`kitab-cache:${kitabId}`)
  if (cached) {
    try {
      return JSON.parse(cached) as { kitab: KitabDoc; chapters: KitabChapter[] }
    } catch {
      localStorage.removeItem(`kitab-cache:${kitabId}`)
    }
  }

  const kitabSnap = await getDoc(doc(db, 'kitabs', kitabId))
  if (!kitabSnap.exists()) {
    throw new Error('الكتاب غير موجود')
  }

  const chaptersSnap = await getDocs(query(collection(db, 'kitabs', kitabId, 'chapters'), orderBy('order')))

  const payload = {
    kitab: mapKitabDoc(kitabSnap.id, kitabSnap.data()),
    chapters: chaptersSnap.docs.map((chapter) => ({
      id: chapter.id,
      title: String(chapter.data().title ?? ''),
      content: String(chapter.data().content ?? ''),
      order: Number(chapter.data().order ?? 0),
      nodeType: typeof chapter.data().nodeType === 'string' ? chapter.data().nodeType : undefined,
      depth: Number(chapter.data().depth ?? 0),
      path: Array.isArray(chapter.data().path)
        ? chapter.data().path.filter((item: unknown): item is string => typeof item === 'string')
        : undefined,
    })),
  }

  localStorage.setItem(`kitab-cache:${kitabId}`, JSON.stringify(payload))
  return payload
}

export function subscribeToReadingProgress(
  uid: string,
  onChange: (progressMap: Record<string, ReadingProgress>) => void,
): Unsubscribe {
  const progressQuery = collection(db, 'users', uid, 'readingProgress')

  return onSnapshot(progressQuery, (snapshot) => {
    const nextMap: Record<string, ReadingProgress> = {}

    for (const docItem of snapshot.docs) {
      const data = docItem.data()
      nextMap[docItem.id] = {
        kitabId: docItem.id,
        currentChapter: String(data.currentChapter ?? ''),
        scrollPosition: Number(data.scrollPosition ?? 0),
        completed: Boolean(data.completed),
        lastReadAt: data.lastReadAt,
      }
    }

    onChange(nextMap)
  })
}

export async function upsertKitab(kitab: KitabInput, uid: string) {
  const kitabRef = doc(db, 'kitabs', kitab.id)
  const chapterCollectionRef = collection(db, 'kitabs', kitab.id, 'chapters')
  const existingChapters = await getDocs(chapterCollectionRef)

  const batch = writeBatch(db)

  for (const oldChapter of existingChapters.docs) {
    batch.delete(oldChapter.ref)
  }

  batch.set(
    kitabRef,
    {
      title: kitab.title,
      author: kitab.author,
      category: kitab.category,
      level: kitab.level,
      coverColor: kitab.coverColor ?? '#1B5E20',
      description: kitab.description ?? '',
      chapterCount: kitab.chapters.length,
      sourceFormat: kitab.sourceFormat ?? 'chapters',
      structureLabels: kitab.structureLabels ?? [],
      createdAt: serverTimestamp(),
      addedBy: uid,
    },
    { merge: true },
  )

  for (const [index, chapter] of kitab.chapters.entries()) {
    const chapterRef = doc(db, 'kitabs', kitab.id, 'chapters', chapter.chapterId)
    batch.set(chapterRef, {
      title: chapter.title,
      content: chapter.content,
      order: chapter.order ?? index + 1,
      nodeType: chapter.nodeType ?? null,
      depth: chapter.depth ?? 0,
      path: chapter.path ?? [chapter.title],
    })
  }

  await batch.commit()
  localStorage.removeItem(`kitab-cache:${kitab.id}`)
}

export async function bulkImportKitabs(kitabs: KitabInput[], uid: string) {
  for (const kitab of kitabs) {
    await upsertKitab(kitab, uid)
  }
}

type UpdatableKitabFields = Pick<
  KitabDoc,
  'title' | 'author' | 'category' | 'level' | 'coverColor' | 'description' | 'sourceFormat' | 'structureLabels'
>

export async function updateKitabMetadata(kitabId: string, payload: Partial<UpdatableKitabFields>) {
  await updateDoc(doc(db, 'kitabs', kitabId), payload)
  localStorage.removeItem(`kitab-cache:${kitabId}`)
}

export async function updateChapterContent(kitabId: string, chapterId: string, content: string) {
  const chapterRef = doc(db, 'kitabs', kitabId, 'chapters', chapterId)
  await updateDoc(chapterRef, { content })
  localStorage.removeItem(`kitab-cache:${kitabId}`)
}

export async function deleteKitab(kitabId: string) {
  const chaptersRef = collection(db, 'kitabs', kitabId, 'chapters')
  const chapterSnapshot = await getDocs(chaptersRef)
  const batch = writeBatch(db)

  for (const chapter of chapterSnapshot.docs) {
    batch.delete(chapter.ref)
  }

  batch.delete(doc(db, 'kitabs', kitabId))
  await batch.commit()
  localStorage.removeItem(`kitab-cache:${kitabId}`)
}

export async function deleteUserVocabularyEntry(uid: string, vocabId: string) {
  await deleteDoc(doc(db, 'users', uid, 'vocabulary', vocabId))
}
