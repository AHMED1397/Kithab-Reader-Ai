import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import useGemini from '../../hooks/useGemini'
import useVocabulary from '../../hooks/useVocabulary'
import { explainSentenceWithGemini } from '../../services/geminiService'
import { enqueueSentenceExplanation } from '../../services/offlineQueueService'

interface SentenceExplainerProps {
  open: boolean
  uid?: string
  sentence: string
  kitabId: string
  kitabTitle: string
  chapterId: string
  chapterTitle: string
  onClose: () => void
}

function readableError(message: string) {
  if (message === 'OFFLINE_GEMINI') {
    return 'لا يوجد اتصال بالإنترنت حاليًا.'
  }
  if (message === 'GEMINI_RATE_LIMIT') {
    return 'تم الوصول لحد الطلبات. حاول بعد قليل.'
  }
  if (message === 'GEMINI_UNAVAILABLE' || message === 'GEMINI_HTTP_503') {
    return 'خدمة Gemini غير متاحة مؤقتًا. حاول بعد قليل أو أضف الطلب للطابور.'
  }
  if (message === 'GEMINI_NOT_FOUND') {
    return 'تعذر الوصول إلى نموذج Gemini الحالي. تحقق من الإعدادات أو حاول لاحقًا.'
  }
  if (message === 'GEMINI_AUTH_ERROR') {
    return 'مفتاح Gemini غير صالح أو لا يملك صلاحية كافية.'
  }
  if (message === 'GEMINI_NETWORK') {
    return 'حدثت مشكلة اتصال مؤقتة أثناء التواصل مع Gemini.'
  }
  return message
}

export default function SentenceExplainer({
  open,
  uid,
  sentence,
  kitabId,
  kitabTitle,
  chapterId,
  chapterTitle,
  onClose,
}: SentenceExplainerProps) {
  const [saved, setSaved] = useState(false)
  const [showTranslation, setShowTranslation] = useState(false)
  const runner = useCallback(
    () => explainSentenceWithGemini(sentence, kitabTitle, chapterTitle),
    [sentence, kitabTitle, chapterTitle],
  )
  const { data, loading, error } = useGemini(runner, open)
  const { saving, saveExplanation } = useVocabulary(uid)

  useEffect(() => {
    setSaved(false)
    setShowTranslation(false)
  }, [sentence, open])

  const canQueue = useMemo(
    () => ['OFFLINE_GEMINI', 'GEMINI_RATE_LIMIT', 'GEMINI_UNAVAILABLE', 'GEMINI_NETWORK'].includes(error),
    [error],
  )

  const save = async () => {
    if (!data) {
      return
    }

    try {
      await saveExplanation(sentence, data, kitabId, chapterId)
      setSaved(true)
      toast.success('تم حفظ الشرح')
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'تعذر حفظ الشرح'
      toast.error(message)
    }
  }

  const queue = () => {
    enqueueSentenceExplanation({
      uid,
      sentence,
      kitabTitle,
      chapterTitle,
      kitabId,
      chapterId,
    })
    toast.success('تمت إضافة الطلب للطابور وسيتم تنفيذه عند عودة الاتصال أو استقرار الخدمة')
    onClose()
  }

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div
        className="w-full max-w-3xl rounded-2xl border border-[#1B5E20]/20 bg-[#FDF6E3] p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="mb-2 text-2xl font-bold text-[#1B5E20]">شرح الجملة</h3>
        <p className="mb-3 rounded-lg bg-white p-3 text-[#3E2723]">{sentence}</p>

        {loading ? <p className="text-[#6D4C41]">جاري التحليل عبر Gemini...</p> : null}
        {error ? <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{readableError(error)}</p> : null}

        {data ? (
          <div className="space-y-2 text-sm text-[#3E2723]">
            <p><span className="font-bold">١. المعنى الإجمالي:</span> {data.summary}</p>
            <p><span className="font-bold">٢. الإعراب:</span> {data.grammar}</p>
            <p><span className="font-bold">٣. المصطلحات الصعبة:</span> {data.difficultTerms}</p>
            <p><span className="font-bold">٤. الفائدة:</span> {data.benefit}</p>

            {showTranslation ? (
              <div className="mt-2 rounded-lg border border-[#1B5E20]/20 bg-white p-3">
                <p><span className="font-bold">المعنى بالعربية:</span> {data.meaningAr}</p>
                <p><span className="font-bold">Tamil:</span> {data.meaningTa}</p>
                <p><span className="font-bold">English:</span> {data.meaningEn}</p>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {data ? (
            <button
              type="button"
              onClick={() => setShowTranslation((prev) => !prev)}
              className="rounded-lg border border-[#1B5E20]/40 px-4 py-2 text-sm font-semibold text-[#1B5E20]"
            >
              {showTranslation ? 'إخفاء المعنى والترجمة' : 'عرض المعنى والترجمة'}
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => void save()}
            disabled={!data || saving || saved}
            className="rounded-lg bg-[#1B5E20] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saved ? 'تم الحفظ' : saving ? 'جاري الحفظ...' : 'حفظ الشرح'}
          </button>

          {canQueue ? (
            <button
              type="button"
              onClick={queue}
              className="rounded-lg border border-[#1B5E20]/40 px-4 py-2 text-sm font-semibold text-[#1B5E20]"
            >
              إضافة للطابور
            </button>
          ) : null}

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#1B5E20]/30 px-4 py-2 text-sm font-semibold text-[#1B5E20]"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  )
}
