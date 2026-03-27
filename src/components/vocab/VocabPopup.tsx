import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import useGemini from '../../hooks/useGemini'
import useMyMemory from '../../hooks/useMyMemory'
import useLingva from '../../hooks/useLingva'
import usePons from '../../hooks/usePons'
import useVocabulary from '../../hooks/useVocabulary'
import useWiktionary from '../../hooks/useWiktionary'
import { analyzeWordWithGemini } from '../../services/geminiService'
import { analyzeWordWithGroq } from '../../services/groqService'
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
  if (message === 'GROQ_HTTP_401') {
    return 'مفتاح Groq غير صالح. تحقق من الإعدادات.'
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
  const [runGemini, setRunGemini] = useState(false)
  const [runGroq, setRunGroq] = useState(false)
  
  const isPhrase = word.trim().includes(' ')
  
  const geminiRunner = useCallback(() => analyzeWordWithGemini(word, context), [word, context])
  const { data: geminiData, loading: geminiLoading, error: geminiError } = useGemini(geminiRunner, open && runGemini)

  const groqRunner = useCallback(() => analyzeWordWithGroq(word, context), [word, context])
  const { data: groqData, loading: groqLoading, error: groqError } = useGemini(groqRunner, open && runGroq)

  const { saving, saveWord } = useVocabulary(uid)
  const { translationEn, translationTa, loading: myMemoryLoading } = useMyMemory(word, open)
  const { translationTa: lingvaTa, loading: lingvaLoading } = useLingva(word, open)
  const { translation: ponsTranslation, loading: ponsLoading } = usePons(word, open && !isPhrase)
  const { data: wiktionaryData, loading: wiktionaryLoading } = useWiktionary(word, open && !isPhrase)

  useEffect(() => {
    setSaved(false)
    setRunGemini(false)
    setRunGroq(false)
  }, [word, open])

  const currentData = geminiData || groqData

  const canQueue = useMemo(
    () => ['OFFLINE_GEMINI', 'GEMINI_RATE_LIMIT', 'GEMINI_UNAVAILABLE', 'GEMINI_NETWORK'].includes(geminiError),
    [geminiError],
  )

  const save = async () => {
    if (!currentData) return

    try {
      await saveWord(word, currentData, context, kitabId, chapterId)
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
          
          {/* AI Analysis Section (Gemini or Groq) */}
          <div className="rounded-2xl border border-[#1B5E20]/20 bg-[#1B5E20]/5 p-5 shadow-inner space-y-4">
            <div className="flex items-center justify-between flex-row-reverse">
               <h4 className="text-xs font-bold text-[#1B5E20] uppercase tracking-wider opacity-60">تحليل الذكاء الاصطناعي</h4>
               <div className="flex gap-2">
                  <span className={`w-2 h-2 rounded-full ${geminiData ? 'bg-blue-500' : 'bg-gray-300'}`} title="Gemini" />
                  <span className={`w-2 h-2 rounded-full ${groqData ? 'bg-orange-500' : 'bg-gray-300'}`} title="Groq" />
               </div>
            </div>
            
            {!currentData && !geminiLoading && !groqLoading ? (
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

            {(geminiLoading || groqLoading) ? (
              <div className="flex flex-col gap-2">
                <div className="h-4 bg-[#1B5E20]/10 rounded-full animate-pulse w-3/4" />
                <div className="h-4 bg-[#1B5E20]/10 rounded-full animate-pulse w-full" />
                <div className="h-4 bg-[#1B5E20]/10 rounded-full animate-pulse w-2/3" />
              </div>
            ) : null}

            {geminiError && !runGroq && <p className="mb-2 rounded-xl bg-red-50 p-3 text-sm text-red-700 border border-red-100">{readableError(geminiError)}</p>}
            {groqError && !runGemini && <p className="mb-2 rounded-xl bg-red-50 p-3 text-sm text-red-700 border border-red-100">{readableError(groqError)}</p>}

            {currentData ? (
              <div className="space-y-4 text-sm text-[#3E2723] animate-in fade-in slide-in-from-top-2 duration-300">
                <div>
                  <span className="block text-[10px] font-bold text-[#1B5E20] mb-1 opacity-70 uppercase">المعنى (العربية)</span>
                  <p className="font-medium text-lg leading-snug">{currentData.meaningAr}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="text-right">
                    <span className="block text-[10px] font-bold text-[#1B5E20] mb-1 opacity-70 uppercase">அர்த்தம் (Tamil)</span>
                    <p className="font-medium">{currentData.meaningTa}</p>
                  </div>
                  <div className="text-left font-sans">
                    <span className="block text-[10px] font-bold text-[#1B5E20] mb-1 opacity-70 uppercase text-right">Meaning (English)</span>
                    <p className="font-medium">{currentData.meaningEn}</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-[#1B5E20]/10 flex justify-between items-center text-[10px] opacity-40 italic">
                   <span>مصدر التحليل: {geminiData ? 'Gemini 2.0' : 'Groq Llama 3.1'}</span>
                   <button onClick={() => { setRunGemini(false); setRunGroq(false); }} className="hover:text-[#1B5E20] underline">تغيير النموذج</button>
                </div>
              </div>
            ) : null}
          </div>

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
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-white/30 border-t border-[#1B5E20]/10 flex flex-wrap gap-3 flex-row-reverse" dir="rtl">
          <button
            type="button"
            onClick={() => void save()}
            disabled={!currentData || saving || saved}
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
