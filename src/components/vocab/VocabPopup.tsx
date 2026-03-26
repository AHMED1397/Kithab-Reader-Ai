import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import useGemini from '../../hooks/useGemini'
import useMyMemory from '../../hooks/useMyMemory'
import useLingva from '../../hooks/useLingva'
import usePons from '../../hooks/usePons'
import useVocabulary from '../../hooks/useVocabulary'
import useWiktionary from '../../hooks/useWiktionary'
import { analyzeWordWithGemini } from '../../services/geminiService'
import { enqueueWordLookup } from '../../services/offlineQueueService'

interface VocabPopupProps {
  open: boolean
  uid?: string
  word: string
  context: string
  kitabId: string
  chapterId: string
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

export default function VocabPopup({
  open,
  uid,
  word,
  context,
  kitabId,
  chapterId,
  onClose,
}: VocabPopupProps) {
  const [saved, setSaved] = useState(false)
  const runner = useCallback(() => analyzeWordWithGemini(word, context), [word, context])
  const { data, loading, error } = useGemini(runner, open)
  const { saving, saveWord } = useVocabulary(uid)
  const { translationEn, translationTa, loading: myMemoryLoading } = useMyMemory(word, open)
  const { translationTa: lingvaTa, loading: lingvaLoading } = useLingva(word, open)
  const { translation: ponsTranslation, loading: ponsLoading } = usePons(word, open)
  const { data: wiktionaryData, loading: wiktionaryLoading } = useWiktionary(word, open)

  useEffect(() => {
    setSaved(false)
  }, [word, open])

  const canQueue = useMemo(
    () => ['OFFLINE_GEMINI', 'GEMINI_RATE_LIMIT', 'GEMINI_UNAVAILABLE', 'GEMINI_NETWORK'].includes(error),
    [error],
  )

  const save = async () => {
    if (!data) return

    try {
      await saveWord(word, data, context, kitabId, chapterId)
      setSaved(true)
      toast.success('تم حفظ المفردة')
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'تعذر حفظ المفردة'
      toast.error(message)
    }
  }

  const queue = () => {
    enqueueWordLookup({
      uid,
      word,
      context,
      kitabId,
      chapterId,
    })
    toast.success('تمت إضافة الطلب للطابور وسيتم تنفيذه عند عودة الاتصال أو استقرار الخدمة')
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border border-[#1B5E20]/20 bg-[#FDF6E3] shadow-2xl overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1B5E20]/10 flex items-center justify-between bg-white/30 text-right" dir="rtl">
          <div>
            <h3 className="text-3xl font-bold text-[#1B5E20] leading-none mb-1">{word}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#1B5E20]/5 rounded-full transition-colors text-[#1B5E20]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Area (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar text-right" dir="rtl">
          
          {/* Quick Translation (MyMemory) */}
          {(translationEn || translationTa || myMemoryLoading) && (
            <div className="group rounded-2xl border border-[#1B5E20]/10 bg-white/70 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3 flex-row-reverse">
                <h4 className="text-xs font-bold text-[#1B5E20] uppercase tracking-wider opacity-60">ترجمة سريعة (MyMemory)</h4>
                <div className="h-1 w-12 bg-[#1B5E20]/10 rounded-full" />
              </div>
              {myMemoryLoading ? (
                <div className="flex items-center gap-2 text-sm text-[#6D4C41] flex-row-reverse">
                  <div className="w-4 h-4 border-2 border-[#1B5E20]/30 border-t-[#1B5E20] rounded-full animate-spin" />
                  جاري جلب الترجمة...
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-[#3E2723]">
                  {translationTa && (
                    <div className="bg-[#1B5E20]/5 p-2 rounded-xl border border-[#1B5E20]/5 text-right">
                      <span className="block text-[10px] font-bold text-[#1B5E20] mb-1 opacity-70">அர்த்தம் (Tamil)</span>
                      <p className="font-medium">{translationTa}</p>
                    </div>
                  )}
                  {translationEn && (
                    <div className="bg-[#1B5E20]/5 p-2 rounded-xl border border-[#1B5E20]/5 text-left font-sans">
                      <span className="block text-[10px] font-bold text-[#1B5E20] mb-1 opacity-70 text-right">Meaning (English)</span>
                      <p className="font-medium">{translationEn}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Lingva API Translation */}
          {(lingvaTa || lingvaLoading) && (
            <div className="group rounded-2xl border border-[#1B5E20]/10 bg-white/70 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3 flex-row-reverse">
                <h4 className="text-xs font-bold text-[#1B5E20] uppercase tracking-wider opacity-60">ترجمة سريعة (Lingva)</h4>
                <div className="h-1 w-12 bg-[#1B5E20]/10 rounded-full" />
              </div>
              {lingvaLoading ? (
                <div className="flex items-center gap-2 text-sm text-[#6D4C41] flex-row-reverse">
                  <div className="w-4 h-4 border-2 border-[#1B5E20]/30 border-t-[#1B5E20] rounded-full animate-spin" />
                  جاري جلب الترجمة...
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 text-sm text-[#3E2723]">
                  {lingvaTa && (
                    <div className="bg-[#1B5E20]/5 p-2 rounded-xl border border-[#1B5E20]/5 text-right">
                      <span className="block text-[10px] font-bold text-[#1B5E20] mb-1 opacity-70">அர்த்தம் (Tamil)</span>
                      <p className="font-medium">{lingvaTa}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Wiktionary Section */}
          {(wiktionaryData || wiktionaryLoading) && (
            <div className="rounded-2xl border border-[#1B5E20]/10 bg-white/70 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3 border-b border-[#1B5E20]/5 pb-2 flex-row-reverse">
                <h4 className="text-xs font-bold text-[#1B5E20] uppercase tracking-wider opacity-60">ويكاموس (Wiktionary)</h4>
                {wiktionaryData?.root && (
                   <span className="text-xs font-bold px-2 py-0.5 bg-[#1B5E20]/10 text-[#1B5E20] rounded-lg">الجذر: {wiktionaryData.root}</span>
                )}
              </div>
              {wiktionaryLoading ? (
                <div className="flex items-center gap-2 text-sm text-[#6D4C41] flex-row-reverse">
                  <div className="w-4 h-4 border-2 border-[#1B5E20]/30 border-t-[#1B5E20] rounded-full animate-spin" />
                  جاري جلب معاني الكلمة...
                </div>
              ) : wiktionaryData ? (
                <div className="text-sm text-[#3E2723] space-y-2">
                  <ul className="space-y-2 p-0 m-0">
                    {wiktionaryData.meanings.slice(0, 4).map((meaning, idx) => {
                      const text = meaning.replace(/^\d+\.\s*/, '');
                      if (!text) return null;
                      return (
                        <li key={idx} className="leading-relaxed relative pr-5">
                          <span className="absolute right-0 top-2.5 w-1.5 h-1.5 bg-[#1B5E20]/40 rounded-full" />
                          {text}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </div>
          )}

          {/* PONS Section */}
          {(ponsTranslation || ponsLoading) && (
            <div className="rounded-2xl border border-[#1B5E20]/10 bg-white/70 p-4 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between mb-3 flex-row-reverse">
                <h4 className="text-xs font-bold text-[#1B5E20] uppercase tracking-wider opacity-60">قاموس معتمد (PONS)</h4>
                <a href="https://pons.com" target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#1B5E20] hover:bg-[#1B5E20]/5 px-2 py-0.5 rounded-full transition-colors border border-[#1B5E20]/10 font-sans" dir="ltr">
                  Powered by PONS
                </a>
              </div>
              {ponsLoading ? (
                <div className="flex items-center gap-2 text-sm text-[#6D4C41] flex-row-reverse">
                  <div className="w-4 h-4 border-2 border-[#1B5E20]/30 border-t-[#1B5E20] rounded-full animate-spin" />
                  جاري البحث في القاموس...
                </div>
              ) : (
                <div 
                  className="text-sm text-[#3E2723] leading-relaxed pons-content [&>strong]:text-[#1B5E20] [&>strong]:font-bold [&>i]:italic [&>span.wordclass]:text-[#6D4C41] [&>span.wordclass]:text-xs [&>span.wordclass]:italic text-left font-sans" 
                  dir="ltr"
                  dangerouslySetInnerHTML={{ __html: ponsTranslation }} 
                />
              )}
            </div>
          )}

          {/* Gemini Analysis Section */}
          <div className="rounded-2xl border border-[#1B5E20]/20 bg-[#1B5E20]/5 p-5 shadow-inner">
            <h4 className="mb-3 text-xs font-bold text-[#1B5E20] uppercase tracking-wider opacity-60">تحليل مفصل (Gemini AI)</h4>
            {loading ? (
              <div className="flex flex-col gap-2">
                <div className="h-4 bg-[#1B5E20]/10 rounded-full animate-pulse w-3/4" />
                <div className="h-4 bg-[#1B5E20]/10 rounded-full animate-pulse w-full" />
                <div className="h-4 bg-[#1B5E20]/10 rounded-full animate-pulse w-2/3" />
              </div>
            ) : null}
            {error ? <p className="mb-2 rounded-xl bg-red-50 p-3 text-sm text-red-700 border border-red-100">{readableError(error)}</p> : null}

            {data ? (
              <div className="space-y-4 text-sm text-[#3E2723]">
                <div>
                  <span className="block text-[10px] font-bold text-[#1B5E20] mb-1 opacity-70 uppercase">المعنى (العربية)</span>
                  <p className="font-medium text-lg leading-snug">{data.meaningAr}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="text-right">
                    <span className="block text-[10px] font-bold text-[#1B5E20] mb-1 opacity-70 uppercase">அர்த்தம் (Tamil)</span>
                    <p className="font-medium">{data.meaningTa}</p>
                  </div>
                  <div className="text-left font-sans">
                    <span className="block text-[10px] font-bold text-[#1B5E20] mb-1 opacity-70 uppercase text-right">Meaning (English)</span>
                    <p className="font-medium">{data.meaningEn}</p>
                  </div>
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
            {saved ? '✓ تم الحفظ' : saving ? 'جاري الحفظ...' : 'حفظ في المفردات'}
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
