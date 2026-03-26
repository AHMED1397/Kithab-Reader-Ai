import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReadingProgress } from '../types/kitab'
import { getReadingProgress, saveReadingProgress } from '../services/progressService'

interface UseReadingProgressArgs {
  uid?: string
  kitabId: string
  initialChapterId?: string
}

export default function useReadingProgress({ uid, kitabId, initialChapterId }: UseReadingProgressArgs) {
  const [progress, setProgress] = useState<ReadingProgress | null>(null)
  const [loadingProgress, setLoadingProgress] = useState(true)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    let active = true

    const run = async () => {
      if (!uid) {
        setLoadingProgress(false)
        return
      }

      const existing = await getReadingProgress(uid, kitabId)
      if (!active) {
        return
      }

      setProgress(existing)
      setLoadingProgress(false)
    }

    void run()

    return () => {
      active = false
    }
  }, [uid, kitabId])

  const persist = useCallback(
    (chapterId: string, scrollPosition: number, completed: boolean) => {
      if (!uid) {
        return
      }

      const next: ReadingProgress = {
        kitabId,
        currentChapter: chapterId,
        scrollPosition,
        completed,
      }

      setProgress(next)

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = window.setTimeout(() => {
        void saveReadingProgress(uid, kitabId, {
          currentChapter: chapterId,
          scrollPosition,
          completed,
        })
      }, 500)
    },
    [kitabId, uid],
  )

  const resolvedChapterId = progress?.currentChapter || initialChapterId || ''

  return {
    progress,
    resolvedChapterId,
    loadingProgress,
    persist,
  }
}
