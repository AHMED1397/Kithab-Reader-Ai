import { analyzeWordWithGemini, explainSentenceWithGemini } from './geminiService'
import { saveSentenceExplanation, saveVocabularyEntry } from './vocabService'

const QUEUE_KEY = 'offline-ai-queue'

type OfflineTask =
  | {
      id: string
      type: 'word'
      uid?: string
      createdAt: number
      payload: {
        word: string
        context: string
        kitabId: string
        chapterId: string
      }
    }
  | {
      id: string
      type: 'sentence'
      uid?: string
      createdAt: number
      payload: {
        sentence: string
        kitabTitle: string
        chapterTitle: string
        kitabId: string
        chapterId: string
      }
    }

function loadQueue(): OfflineTask[] {
  const raw = localStorage.getItem(QUEUE_KEY)
  if (!raw) {
    return []
  }

  try {
    return JSON.parse(raw) as OfflineTask[]
  } catch {
    localStorage.removeItem(QUEUE_KEY)
    return []
  }
}

function saveQueue(queue: OfflineTask[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

function createTaskId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function getOfflineQueueCount() {
  return loadQueue().length
}

export function enqueueWordLookup(task: {
  uid?: string
  word: string
  context: string
  kitabId: string
  chapterId: string
}) {
  const queue = loadQueue()
  queue.push({
    id: createTaskId(),
    type: 'word',
    uid: task.uid,
    createdAt: Date.now(),
    payload: {
      word: task.word,
      context: task.context,
      kitabId: task.kitabId,
      chapterId: task.chapterId,
    },
  })
  saveQueue(queue)
}

export function enqueueSentenceExplanation(task: {
  uid?: string
  sentence: string
  kitabTitle: string
  chapterTitle: string
  kitabId: string
  chapterId: string
}) {
  const queue = loadQueue()
  queue.push({
    id: createTaskId(),
    type: 'sentence',
    uid: task.uid,
    createdAt: Date.now(),
    payload: {
      sentence: task.sentence,
      kitabTitle: task.kitabTitle,
      chapterTitle: task.chapterTitle,
      kitabId: task.kitabId,
      chapterId: task.chapterId,
    },
  })
  saveQueue(queue)
}

export async function processOfflineAiQueue() {
  if (!navigator.onLine) {
    return { processed: 0, failed: 0 }
  }

  const queue = loadQueue()
  if (queue.length === 0) {
    return { processed: 0, failed: 0 }
  }

  const remaining: OfflineTask[] = []
  let processed = 0
  let failed = 0

  for (const task of queue) {
    try {
      if (task.type === 'word') {
        const analysis = await analyzeWordWithGemini(task.payload.word, task.payload.context)

        if (task.uid) {
          await saveVocabularyEntry({
            uid: task.uid,
            word: task.payload.word,
            analysis,
            context: task.payload.context,
            kitabId: task.payload.kitabId,
            chapterId: task.payload.chapterId,
          })
        }

        processed += 1
        continue
      }

      const explanation = await explainSentenceWithGemini(
        task.payload.sentence,
        task.payload.kitabTitle,
        task.payload.chapterTitle,
      )

      if (task.uid) {
        await saveSentenceExplanation({
          uid: task.uid,
          sentence: task.payload.sentence,
          explanation,
          kitabId: task.payload.kitabId,
          chapterId: task.payload.chapterId,
        })
      }

      processed += 1
    } catch {
      failed += 1
      remaining.push(task)
    }
  }

  saveQueue(remaining)
  return { processed, failed }
}
