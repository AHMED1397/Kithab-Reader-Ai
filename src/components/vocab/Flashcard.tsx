import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { incrementVocabularyReview } from '../../services/vocabService'
import type { VocabularyEntry } from '../../types/kitab'

interface FlashcardProps {
  uid: string
  entries: VocabularyEntry[]
  kitabNameById: Record<string, string>
}

function needsReview(entry: VocabularyEntry) {
  if (!entry.savedAt) {
    return true
  }

  const days = (Date.now() - entry.savedAt.getTime()) / (1000 * 60 * 60 * 24)
  return days >= 3 || entry.reviewCount === 0
}

export default function Flashcard({ uid, entries, kitabNameById }: FlashcardProps) {
  const candidates = useMemo(() => entries.filter(needsReview), [entries])
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)

  if (candidates.length === 0) {
    return (
      <section className="rounded-2xl border border-[#1B5E20]/20 bg-[#FDF6E3] p-4 text-[#5D4037] shadow-sm">
        لا توجد بطاقات بحاجة لمراجعة الآن.
      </section>
    )
  }

  const current = candidates[index % candidates.length]

  const next = async () => {
    try {
      await incrementVocabularyReview(uid, current.id)
      setIndex((prev) => (prev + 1) % candidates.length)
      setRevealed(false)
    } catch {
      toast.error('تعذر تحديث عدد المراجعات')
    }
  }

  return (
    <section className="rounded-2xl border border-[#1B5E20]/20 bg-[#FDF6E3] p-4 shadow-sm">
      <h3 className="mb-3 text-xl font-bold text-[#1B5E20]">مراجعة البطاقات</h3>

      <div className="rounded-2xl border border-[#1B5E20]/20 bg-white p-6 text-center">
        <p className="mb-2 text-xs text-[#6D4C41]">{kitabNameById[current.kitabId] ?? current.kitabId}</p>
        <h4 className="font-['Amiri'] text-4xl font-bold text-[#1B5E20]">{current.word}</h4>

        {revealed ? (
          <div className="mt-3 space-y-1 text-sm text-[#3E2723]">
            <p><span className="font-semibold">العربية:</span> {current.meaningAr}</p>
            <p><span className="font-semibold">Tamil:</span> {current.meaningTa}</p>
            <p><span className="font-semibold">English:</span> {current.meaningEn}</p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-[#6D4C41]">حاول تذكر المعنى أولًا ثم اكشف الإجابة.</p>
        )}

        <div className="mt-4 flex justify-center gap-2">
          <button
            type="button"
            onClick={() => setRevealed((prev) => !prev)}
            className="rounded-lg border border-[#1B5E20]/30 px-4 py-2 text-sm font-semibold text-[#1B5E20]"
          >
            {revealed ? 'إخفاء' : 'كشف المعنى'}
          </button>
          <button
            type="button"
            onClick={() => void next()}
            className="rounded-lg bg-[#1B5E20] px-4 py-2 text-sm font-semibold text-white"
          >
            التالي
          </button>
        </div>
      </div>
    </section>
  )
}
