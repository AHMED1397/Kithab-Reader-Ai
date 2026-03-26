import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import useAuth from '../../hooks/useAuth'
import useReaderPreferences from '../../hooks/useReaderPreferences'
import useReadingProgress from '../../hooks/useReadingProgress'
import { updateChapterContent } from '../../services/kitabService'
import type { KitabChapter, KitabDoc } from '../../types/kitab'
import SentenceExplainer from '../vocab/SentenceExplainer'
import VocabPopup from '../vocab/VocabPopup'
import ChapterNav from './ChapterNav'
import ClickableWord from './ClickableWord'
import ReadingSettings from './ReadingSettings'
import TutorialPopup from './TutorialPopup'

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
  const [pendingSelectionIndex, setPendingSelectionIndex] = useState<number | null>(null)
  const [tutorialOpen, setTutorialOpen] = useState(true)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const restoredChapterRef = useRef('')
  const isProgrammaticScrollRef = useRef(false)
  const persistTimerRef = useRef<number | null>(null)

  const [tocOpen, setTocOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)

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
    setPendingSelectionIndex(null)
    restoredChapterRef.current = ''
    setTocOpen(false) // Close TOC on mobile when chapter changes
    setIsEditing(false)
  }, [currentChapterId])

  useEffect(() => {
    return () => {
      if (persistTimerRef.current) {
        window.clearTimeout(persistTimerRef.current)
      }
    }
  }, [])


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
    if (isEditing) return
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

  const handleEditToggle = () => {
    if (!isEditing) {
      setEditContent(currentChapter.content)
    }
    setIsEditing(!isEditing)
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await updateChapterContent(kitab.id, currentChapter.id, editContent)
      toast.success('تم حفظ التعديلات بنجاح')
      setIsEditing(false)
      // We don't need to manually update chapters state because it's usually managed by the parent
      // but if the parent doesn't re-fetch, we might need a way to refresh it.
      // Since getKitabWithChapters caches, we cleared it in the service.
      // To force a refresh in the UI, we might need to tell the user to refresh or use a reload.
      window.location.reload()
    } catch {
      toast.error('تعذر حفظ التعديلات')
    } finally {
      setIsSaving(false)
    }
  }

  if (!currentChapter) {
    return <p className="rounded-xl bg-white p-4">لا توجد فصول متاحة.</p>
  }

  const parsedData = useMemo(() => {
    if (!currentChapter) return { words: [], paragraphs: [] }
    const paragraphs = currentChapter.content.split(/\n\n+|\n/).filter((b: string) => Boolean(b))
    const allWords: string[] = []
    const paraData = paragraphs.map((para: string) => {
      const paraWords = para.split(/\s+/).filter((b: string) => Boolean(b))
      const data = paraWords.map((w: string) => {
        const item = { word: w, globalIndex: allWords.length }
        allWords.push(w)
        return item
      })
      return data
    })
    return { words: allWords, paragraphs: paraData }
  }, [currentChapter])

  const handleWordClick = (index: number) => {
    if (isEditing) return
    if (pendingSelectionIndex === null) {
      setPendingSelectionIndex(index)
    } else if (pendingSelectionIndex === index) {
      setWordSelection({
        word: parsedData.words[index],
        context: surroundingContext(parsedData.words, index),
      })
      setPendingSelectionIndex(null)
    } else {
      const start = Math.min(pendingSelectionIndex, index)
      const end = Math.max(pendingSelectionIndex, index)
      
      if (end - start < 20) {
        setWordSelection({
          word: parsedData.words.slice(start, end + 1).join(' '),
          context: surroundingContext(parsedData.words, start),
        })
      }
      setPendingSelectionIndex(null)
    }
  }

  const isAdmin = profile?.role === 'admin'

  return (
    <section className="space-y-3">

      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#1B5E20]/20 bg-[#FDF6E3] p-4 shadow-sm">
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-['Amiri'] text-2xl font-bold text-[#1B5E20] sm:text-4xl">{kitab.title}</h1>
          <p className="truncate text-sm text-[#6D4C41] sm:text-base">{kitab.author}</p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              type="button"
              onClick={handleEditToggle}
              className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                isEditing
                  ? 'border-red-400 bg-red-50 text-red-600'
                  : 'border-[#1B5E20]/30 text-[#1B5E20] hover:bg-[#1B5E20]/5'
              }`}
            >
              {isEditing ? 'إلغاء التعديل' : 'تعديل النص'}
            </button>
          )}
          <button
            type="button"
            onClick={() => setTocOpen(true)}
            className="rounded-lg border border-[#1B5E20]/30 px-3 py-2 text-sm font-semibold text-[#1B5E20] lg:hidden"
          >
            الفهرس
          </button>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="rounded-lg border border-[#1B5E20]/30 px-3 py-2 text-sm font-semibold text-[#1B5E20]"
          >
            الإعدادات
          </button>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* TOC for Desktop */}
        <div className="hidden lg:block">
          <ChapterNav
            chapters={chapters}
            currentChapterId={currentChapter.id}
            collapsed={collapsedNav}
            onToggle={() => setCollapsedNav((prev) => !prev)}
            onSelect={setCurrentChapterId}
          />
        </div>

        {/* TOC for Mobile (Drawer) */}
        {tocOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setTocOpen(false)}
            />
            <div className="relative flex w-80 max-w-[85vw] flex-col bg-[#FDF6E3] p-4 shadow-xl">
              <div className="mb-4 flex items-center justify-between border-b border-[#1B5E20]/10 pb-2">
                <h3 className="text-xl font-bold text-[#1B5E20]">الفهرس</h3>
                <button
                  onClick={() => setTocOpen(false)}
                  className="rounded-lg p-2 text-[#6D4C41] hover:bg-[#F9A825]/10"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-auto">
                <ChapterNav
                  chapters={chapters}
                  currentChapterId={currentChapter.id}
                  collapsed={false}
                  onToggle={() => {}}
                  onSelect={setCurrentChapterId}
                />
              </div>
            </div>
          </div>
        )}

        <article className="space-y-3 rounded-2xl border border-[#1B5E20]/20 bg-[#FDF6E3] p-4 shadow-sm md:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-['Amiri'] text-2xl font-bold text-[#1B5E20] sm:text-3xl">{currentChapter.title}</h2>
            {isEditing && (
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-lg bg-[#1B5E20] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#174E1B] disabled:opacity-50"
              >
                {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </button>
            )}
          </div>

          <div
            ref={contentRef}
            onScroll={onScroll}
            onMouseUp={onTextMouseUp}
            onTouchEnd={onTextMouseUp}
            className="max-h-[60vh] overflow-auto rounded-xl border border-[#1B5E20]/10 p-4 sm:max-h-[70vh] sm:p-6"
            style={{
              background: themeStyles.background,
              color: themeStyles.color,
              fontSize: `${preferences.fontSize}px`,
              lineHeight: preferences.lineHeight,
              fontFamily: preferences.fontFamily,
            }}
          >
            {isEditing ? (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[500px] w-full bg-transparent p-2 outline-none"
                style={{
                  direction: 'rtl',
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                  lineHeight: 'inherit',
                }}
                spellCheck={false}
                placeholder="أدخل النص هنا... استخدم **كلمة** لجعل الكلمة عريضة"
              />
            ) : (
              parsedData.paragraphs.map((paraWords, pIndex) => (
                <p key={`p-${pIndex}`} className="mb-4 text-right leading-[inherit]">
                  {paraWords.map(({ word, globalIndex }) => (
                    <span key={`${word}-${globalIndex}`} className="inline-block">
                      <ClickableWord
                        word={word}
                        isPending={pendingSelectionIndex === globalIndex}
                        onClick={() => handleWordClick(globalIndex)}
                      />{' '}
                    </span>
                  ))}
                </p>
              ))
            )}
          </div>

          {!isEditing && (
            <div className="flex justify-between gap-4">
              <button
                type="button"
                onClick={previousChapter}
                disabled={currentIndex === 0}
                className="flex-1 rounded-lg border border-[#1B5E20]/30 py-3 text-sm font-semibold text-[#1B5E20] transition hover:bg-[#1B5E20]/5 disabled:opacity-50 sm:flex-none sm:px-6"
              >
                الفصل السابق
              </button>

              <button
                type="button"
                onClick={nextChapter}
                disabled={currentIndex >= chapters.length - 1}
                className="flex-1 rounded-lg border border-[#1B5E20]/30 py-3 text-sm font-semibold text-[#1B5E20] transition hover:bg-[#1B5E20]/5 disabled:opacity-50 sm:flex-none sm:px-6"
              >
                الفصل التالي
              </button>
            </div>
          )}
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

      <TutorialPopup open={tutorialOpen} onClose={() => setTutorialOpen(false)} />
    </section>
  )
}
