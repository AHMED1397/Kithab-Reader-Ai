import { useState } from 'react'

interface TutorialPopupProps {
  open: boolean
  onClose: () => void
}

type Lang = 'ar' | 'en' | 'ta'

export default function TutorialPopup({ open, onClose }: TutorialPopupProps) {
  const [lang, setLang] = useState<Lang>('ar')

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="w-full max-w-sm flex flex-col rounded-3xl border border-[#1B5E20]/20 bg-[#FDF6E3] shadow-2xl overflow-hidden"
        onClick={(event) => event.stopPropagation()}
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="px-6 py-4 border-b border-[#1B5E20]/10 bg-white/30 text-center">
          <h3 className="text-xl font-bold text-[#1B5E20]">
            {lang === 'ar' && 'كيفية الاستخدام'}
            {lang === 'en' && 'How to Use'}
            {lang === 'ta' && 'எப்படி பயன்படுத்துவது'}
          </h3>
        </div>

        <div className="p-6 space-y-4 text-[#3E2723]">
          <div className="flex justify-center gap-2 mb-4">
            <button
              className={`px-3 py-1 rounded-full text-sm font-bold ${lang === 'ar' ? 'bg-[#1B5E20] text-white' : 'bg-[#1B5E20]/10 text-[#1B5E20]'}`}
              onClick={() => setLang('ar')}
            >
              العربية
            </button>
            <button
              className={`px-3 py-1 rounded-full text-sm font-bold ${lang === 'ta' ? 'bg-[#1B5E20] text-white' : 'bg-[#1B5E20]/10 text-[#1B5E20]'}`}
              onClick={() => setLang('ta')}
            >
              தமிழ்
            </button>
            <button
              className={`px-3 py-1 rounded-full text-sm font-bold ${lang === 'en' ? 'bg-[#1B5E20] text-white' : 'bg-[#1B5E20]/10 text-[#1B5E20]'}`}
              onClick={() => setLang('en')}
            >
              English
            </button>
          </div>

          <div className="text-center p-4 bg-white/50 rounded-2xl border border-[#1B5E20]/10 flex flex-col items-center gap-3">
            <div className="text-4xl">👆👆</div>
            <p className="font-medium text-lg leading-relaxed">
              {lang === 'ar' && 'اضغط على الكلمة مرتين لمعرفة معناها.'}
              {lang === 'en' && 'Double tap on any word to see its meaning.'}
              {lang === 'ta' && 'ஏதேனும் ஒரு வார்த்தையின் அர்த்தத்தை அறிய அதை இருமுறை தட்டவும்.'}
            </p>
          </div>

          <div className="text-center p-4 bg-white/50 rounded-2xl border border-[#1B5E20]/10 flex flex-col items-center gap-3">
            <div className="text-4xl">👆…👆</div>
            <p className="font-medium text-lg leading-relaxed">
              {lang === 'ar' && 'اضغط على الكلمة الأولى ثم الأخيرة لتحديد عبارة.'}
              {lang === 'en' && 'Tap on the start word and then the end word to select a phrase.'}
              {lang === 'ta' && 'ஒரு சொற்றொடரைத் தேர்ந்தெடுக்க முதல் வார்த்தையையும் பிறகு கடைசி வார்த்தையையும் தட்டவும்.'}
            </p>
          </div>
        </div>

        <div className="p-4 bg-white/30 border-t border-[#1B5E20]/10 flex justify-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full max-w-[200px] rounded-xl bg-[#1B5E20] px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-[#2E7D32] transition-colors"
          >
            {lang === 'ar' && 'حسناً، فهمت'}
            {lang === 'en' && 'Got it'}
            {lang === 'ta' && 'புரிந்தது'}
          </button>
        </div>
      </div>
    </div>
  )
}
