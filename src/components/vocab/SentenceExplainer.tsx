import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import useGemini from '../../hooks/useGemini'
import useVocabulary from '../../hooks/useVocabulary'
import { explainSentenceWithGemini } from '../../services/geminiService'
import { explainSentenceWithGroq } from '../../services/groqService'
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
  if (message === 'OFFLINE_GEMINI' || message === 'OFFLINE_GROQ') {
    return 'لا يوجد اتصال بالإنترنت حاليًا.'
  }
  if (message === 'GEMINI_RATE_LIMIT') {
    return 'تم الوصول لحد الطلبات في Gemini. حاول بعد قليل.'
  }
  if (message.includes('GROQ_HTTP_429')) {
    return 'تم الوصول لحد الطلبات في Groq. حاول بعد قليل.'
  }
  if (message === 'GEMINI_UNAVAILABLE' || message === 'GEMINI_HTTP_503') {
    return 'خدمة Gemini غير متاحة مؤقتًا. حاول بعد قليل أو استخدم Groq.'
  }
  if (message === 'GEMINI_NOT_FOUND') {
    return 'تعذر الوصول إلى نموذج Gemini الحالي. تحقق من الإعدادات أو حاول لاحقًا.'
  }
  if (message === 'GROQ_HTTP_401') {
    return 'مفتاح Groq غير صالح. تحقق من الإعدادات.'
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

  const [runGemini, setRunGemini] = useState(false)
  const [runGroq, setRunGroq] = useState(false)

  const geminiRunner = useCallback(
    () => explainSentenceWithGemini(sentence, kitabTitle, chapterTitle),
    [sentence, kitabTitle, chapterTitle],
  )
  const { data: geminiData, loading: geminiLoading, error: geminiError } = useGemini(geminiRunner, open && runGemini)

  const groqRunner = useCallback(
    () => explainSentenceWithGroq(sentence, kitabTitle, chapterTitle),
    [sentence, kitabTitle, chapterTitle],
  )
  const { data: groqData, loading: groqLoading, error: groqError } = useGemini(groqRunner, open && runGroq)

  const { saving, saveExplanation } = useVocabulary(uid)

  useEffect(() => {
    setSaved(false)
    setRunGemini(false)
    setRunGroq(false)
  }, [sentence, open])

  const data = geminiData || groqData
  const loading = geminiLoading || groqLoading
  const error = (runGemini ? geminiError : '') || (runGroq ? groqError : '')

  const canQueue = useMemo(
    () => ['OFFLINE_GEMINI', 'GEMINI_RATE_LIMIT', 'GEMINI_UNAVAILABLE', 'GEMINI_NETWORK'].includes(geminiError),
    [geminiError],
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
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border border-[#1B5E20]/20 bg-[#FDF6E3] shadow-2xl overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1B5E20]/10 flex items-center justify-between bg-white/30 text-right" dir="rtl">
          <div>
            <h3 className="text-2xl font-bold text-[#1B5E20]">شرح الجملة</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#1B5E20]/5 rounded-full transition-colors text-[#1B5E20]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar text-right" dir="rtl">
          <div className="rounded-xl bg-white p-4 text-[#3E2723] border border-[#1B5E20]/10 shadow-sm font-['Amiri'] text-xl leading-relaxed">
            {sentence}
          </div>

          <div className="rounded-2xl border border-[#1B5E20]/20 bg-[#1B5E20]/5 p-5 shadow-inner space-y-4">
            <div className="flex items-center justify-between flex-row-reverse">
               <h4 className="text-xs font-bold text-[#1B5E20] uppercase tracking-wider opacity-60">تحليل الذكاء الاصطناعي</h4>
               <div className="flex gap-2">
                  <span className={`w-2 h-2 rounded-full ${geminiData ? 'bg-blue-500' : 'bg-gray-300'}`} title="Gemini" />
                  <span className={`w-2 h-2 rounded-full ${groqData ? 'bg-orange-500' : 'bg-gray-300'}`} title="Groq" />
               </div>
            </div>

            {!data && !loading ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRunGemini(true)}
                  className="rounded-xl bg-white/70 py-3 text-sm font-semibold text-[#1B5E20] border border-[#1B5E20]/20 hover:bg-[#1B5E20]/5 transition-colors flex flex-col items-center gap-1"
                >
                  <span>Gemini</span>
                  <span className="text-[10px] opacity-60">Flash 2.0</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRunGroq(true)}
                  className="rounded-xl bg-white/70 py-3 text-sm font-semibold text-[#1B5E20] border border-[#1B5E20]/20 hover:bg-[#1B5E20]/5 transition-colors flex flex-col items-center gap-1"
                >
                  <span>Groq</span>
                  <span className="text-[10px] opacity-60">Llama 3.1</span>
                </button>
              </div>
            ) : null}

            {loading ? (
              <div className="space-y-3">
                <div className="h-4 bg-[#1B5E20]/10 rounded-full animate-pulse w-3/4" />
                <div className="h-4 bg-[#1B5E20]/10 rounded-full animate-pulse w-full" />
                <div className="h-4 bg-[#1B5E20]/10 rounded-full animate-pulse w-2/3" />
              </div>
            ) : null}

            {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 border border-red-100">{readableError(error)}</p> : null}

            {data ? (
              <div className="space-y-4 text-sm text-[#3E2723] animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="mt-4 space-y-3 rounded-xl border border-[#1B5E20]/10 bg-white/50 p-4 animate-in zoom-in-95 duration-200">
                  <div>
                    <span className="block text-[10px] font-bold text-[#1B5E20] mb-1 opacity-70 uppercase">المعنى (العربية)</span>
                    <p className="font-medium text-lg leading-snug">{data.meaningAr}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <span className="block text-[10px] font-bold text-[#1B5E20] mb-1 opacity-70 uppercase">அர்த்தம் (Tamil)</span>
                      <p className="font-medium">{data.meaningTa}</p>
                    </div>
                    <div className="text-left font-sans">
                      <span className="block text-[10px] font-bold text-[#1B5E20] mb-1 opacity-70 uppercase text-right">Meaning (English)</span>
                      <p className="font-medium">{data.meaningEn}</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-[#1B5E20]/10 flex justify-between items-center text-[10px] opacity-40 italic">
                   <span>مصدر التحليل: {geminiData ? 'Gemini 2.0' : 'Groq Llama 3.1'}</span>
                   <button onClick={() => { setRunGemini(false); setRunGroq(false); }} className="hover:text-[#1B5E20] underline">تغيير النموذج</button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-white/30 border-t border-[#1B5E20]/10 flex flex-wrap gap-3 flex-row-reverse" dir="rtl">

          <button
            type="button"
            onClick={() => void save()}
            disabled={!data || saving || saved}
            className="flex-1 min-w-[120px] rounded-xl bg-[#1B5E20] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#1B5E20]/20 hover:bg-[#2E7D32] disabled:opacity-50 transition-all active:scale-95"
          >
            {saved ? '✓ تم الحفظ' : saving ? 'جاري الحفظ...' : 'حفظ الشرح'}
          </button>

          {canQueue ? (
            <button
              type="button"
              onClick={queue}
              className="rounded-xl border border-[#1B5E20]/30 bg-white/50 px-6 py-3 text-sm font-bold text-[#1B5E20] hover:bg-[#1B5E20]/5 transition-all"
            >
              إضافة للطابور
            </button>
          ) : null}

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#1B5E20]/20 bg-[#FDF6E3] px-6 py-3 text-sm font-bold text-[#1B5E20]/70 hover:bg-[#1B5E20]/5 transition-all"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  )
}
