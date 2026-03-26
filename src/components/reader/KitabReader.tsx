import { useEffect, useMemo, useRef, useState } from 'react'
import useAuth from '../../hooks/useAuth'
import useReaderPreferences from '../../hooks/useReaderPreferences'
import useReadingProgress from '../../hooks/useReadingProgress'
import type { KitabChapter, KitabDoc } from '../../types/kitab'
import SentenceExplainer from '../vocab/SentenceExplainer'
import VocabPopup from '../vocab/VocabPopup'
import ChapterNav from './ChapterNav'
import ClickableWord from './ClickableWord'
import ProgressBar from './ProgressBar'
import ReadingSettings from './ReadingSettings'

interface KitabReaderProps {
  kitab: KitabDoc
  chapters: KitabChapter[]
}

interface SelectionState {
  text: string
  x: number
  y: number
}

interface WordSelection {
  word: string
  context: string
}

function surroundingContext(words: string[], index: number) {
  const start = Math.max(0, index - 8)
  const end = Math.min(words.length, index + 9)
  return words.slice(start, end).join(' ')
}

export default function KitabReader({ kitab, chapters }: KitabReaderProps) {
  const { user, profile } = useAuth()
  const [collapsedNav, setCollapsedNav] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [wordSelection, setWordSelection] = useState<WordSelection | null>(null)
  const [selection, setSelection] = useState<SelectionState | null>(null)
  const [explainModalOpen, setExplainModalOpen] = useState(false)
  const [activeSentence, setActiveSentence] = useState('')
  const contentRef = useRef<HTMLDivElement | null>(null)
  const restoredChapterRef = useRef('')
  const isProgrammaticScrollRef = useRef(false)
  const persistTimerRef = useRef<number | null>(null)

  const { preferences, themeStyles, updatePreference } = useReaderPreferences(
    user?.uid,
    profile?.preferences,
  )

  const { progress, resolvedChapterId, persist } = useReadingProgress({
    uid: user?.uid,
    kitabId: kitab.id,
    initialChapterId: chapters[0]?.id,
  })

  const [currentChapterId, setCurrentChapterId] = useState(chapters[0]?.id ?? '')

  useEffect(() => {
    if (resolvedChapterId) {
      setCurrentChapterId(resolvedChapterId)
    }
  }, [resolvedChapterId])

  const currentIndex = useMemo(
    () => Math.max(0, chapters.findIndex((chapter) => chapter.id === currentChapterId)),
    [chapters, currentChapterId],
  )

  const currentChapter = chapters[currentIndex] ?? chapters[0]

  useEffect(() => {
    if (!contentRef.current || !currentChapter) {
      return
    }

    if (restoredChapterRef.current === currentChapter.id) {
      return
    }

    const container = contentRef.current
    const shouldRestoreFromSaved = progress?.currentChapter === currentChapter.id

    isProgrammaticScrollRef.current = true

    requestAnimationFrame(() => {
      if (shouldRestoreFromSaved) {
        const target = (container.scrollHeight - container.clientHeight) * (progress?.scrollPosition ?? 0)
        container.scrollTop = Number.isFinite(target) ? target : 0
      } else {
        container.scrollTop = 0
      }

      restoredChapterRef.current = currentChapter.id

      setTimeout(() => {
        isProgrammaticScrollRef.current = false
      }, 60)
    })
  }, [currentChapter, progress?.currentChapter, progress?.scrollPosition])

  useEffect(() => {
    setSelection(null)
    setExplainModalOpen(false)
    setWordSelection(null)
    setActiveSentence('')
    restoredChapterRef.current = ''
  }, [currentChapterId])

  useEffect(() => {
    return () => {
      if (persistTimerRef.current) {
        window.clearTimeout(persistTimerRef.current)
      }
    }
  }, [])

  const progressPercent = ((currentIndex + 1) / Math.max(1, chapters.length)) * 100

  const onScroll = () => {
    if (!contentRef.current || !currentChapter || isProgrammaticScrollRef.current) {
      return
    }

    const container = contentRef.current
    const maxScroll = Math.max(1, container.scrollHeight - container.clientHeight)
    const scrollPosition = container.scrollTop / maxScroll

    if (persistTimerRef.current) {
      window.clearTimeout(persistTimerRef.current)
    }

    persistTimerRef.current = window.setTimeout(() => {
      persist(currentChapter.id, scrollPosition, currentIndex === chapters.length - 1 && scrollPosition > 0.98)
    }, 180)
  }

  const onTextMouseUp = () => {
    const nativeSelection = window.getSelection()
    const selectedText = nativeSelection?.toString().trim() ?? ''

    if (!selectedText || selectedText.length < 3) {
      setSelection(null)
      return
    }

    const range = nativeSelection?.rangeCount ? nativeSelection.getRangeAt(0) : null
    if (!range) {
      return
    }

    const rect = range.getBoundingClientRect()
    setSelection({
      text: selectedText,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    })
  }

  const openSentenceExplainer = (sentence: string) => {
    const cleaned = sentence.trim()
    if (!cleaned) {
      return
    }

    setActiveSentence(cleaned)
    setExplainModalOpen(true)
  }

  const nextChapter = () => {
    if (currentIndex >= chapters.length - 1) {
      return
    }

    setCurrentChapterId(chapters[currentIndex + 1].id)
  }

  const previousChapter = () => {
    if (currentIndex <= 0) {
      return
    }

    setCurrentChapterId(chapters[currentIndex - 1].id)
  }

  if (!currentChapter) {
    return <p className="rounded-xl bg-white p-4">لا توجد فصول متاحة.</p>
  }

  const words = currentChapter.content.split(/\s+/).filter(Boolean)

  return (
    <section className="space-y-3">
      <ProgressBar value={progressPercent} />

      <header className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#1B5E20]/20 bg-[#FDF6E3] p-4 shadow-sm">
        <div>
          <h1 className="font-['Amiri'] text-4xl font-bold text-[#1B5E20]">{kitab.title}</h1>
          <p className="text-[#6D4C41]">{kitab.author}</p>
        </div>

        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="rounded-lg border border-[#1B5E20]/30 px-3 py-2 text-sm font-semibold text-[#1B5E20]"
        >
          إعدادات القراءة
        </button>
      </header>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <ChapterNav
          chapters={chapters}
          currentChapterId={currentChapter.id}
          collapsed={collapsedNav}
          onToggle={() => setCollapsedNav((prev) => !prev)}
          onSelect={setCurrentChapterId}
        />

        <article className="space-y-3 rounded-2xl border border-[#1B5E20]/20 bg-[#FDF6E3] p-4 shadow-sm">
          <h2 className="font-['Amiri'] text-3xl font-bold text-[#1B5E20]">{currentChapter.title}</h2>

          <div
            ref={contentRef}
            onScroll={onScroll}
            onMouseUp={onTextMouseUp}
            className="max-h-[70vh] overflow-auto rounded-xl border border-[#1B5E20]/10 p-5"
            style={{
              background: themeStyles.background,
              color: themeStyles.color,
              fontSize: `${preferences.fontSize}px`,
              lineHeight: preferences.lineHeight,
              fontFamily: preferences.fontFamily,
            }}
          >
            <p className="text-right leading-[inherit]">
              {words.map((word, index) => (
                <span key={`${word}-${index}`} className="inline-block">
                  <ClickableWord
                    word={word}
                    onClick={(value) =>
                      setWordSelection({
                        word: value,
                        context: surroundingContext(words, index),
                      })
                    }
                  />{' '}
                </span>
              ))}
            </p>
          </div>

          <div className="flex flex-wrap justify-between gap-2">
            <button
              type="button"
              onClick={previousChapter}
              disabled={currentIndex === 0}
              className="rounded-lg border border-[#1B5E20]/30 px-3 py-2 text-sm font-semibold text-[#1B5E20] disabled:opacity-50"
            >
              الفصل السابق
            </button>

            <button
              type="button"
              onClick={nextChapter}
              disabled={currentIndex >= chapters.length - 1}
              className="rounded-lg border border-[#1B5E20]/30 px-3 py-2 text-sm font-semibold text-[#1B5E20] disabled:opacity-50"
            >
              الفصل التالي
            </button>
          </div>
        </article>
      </div>

      {selection ? (
        <button
          type="button"
          onClick={() => openSentenceExplainer(selection.text)}
          className="fixed z-20 -translate-x-1/2 rounded-full bg-[#1B5E20] px-3 py-2 text-sm font-semibold text-white shadow"
          style={{ left: selection.x, top: selection.y }}
        >
          اشرح هذه الجملة
        </button>
      ) : null}

      <VocabPopup
        open={Boolean(wordSelection)}
        uid={user?.uid}
        word={wordSelection?.word ?? ''}
        context={wordSelection?.context ?? ''}
        kitabId={kitab.id}
        chapterId={currentChapter.id}
        onClose={() => setWordSelection(null)}
      />

      <SentenceExplainer
        open={Boolean(explainModalOpen && activeSentence)}
        uid={user?.uid}
        sentence={activeSentence}
        kitabId={kitab.id}
        kitabTitle={kitab.title}
        chapterId={currentChapter.id}
        chapterTitle={currentChapter.title}
        onClose={() => {
          setExplainModalOpen(false)
          setSelection(null)
          setActiveSentence('')
        }}
      />

      <ReadingSettings
        open={settingsOpen}
        preferences={preferences}
        onClose={() => setSettingsOpen(false)}
        onUpdate={updatePreference}
      />
    </section>
  )
}
