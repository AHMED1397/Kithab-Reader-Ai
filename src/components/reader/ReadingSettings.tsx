import type { ReaderPreferences } from '../../hooks/useReaderPreferences'

interface ReadingSettingsProps {
  open: boolean
  preferences: ReaderPreferences
  onClose: () => void
  onUpdate: <K extends keyof ReaderPreferences>(
    key: K,
    value: ReaderPreferences[K],
  ) => Promise<void>
}

export default function ReadingSettings({ open, preferences, onClose, onUpdate }: ReadingSettingsProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-30 bg-black/25 p-4" onClick={onClose}>
      <div
        className="mr-auto w-full max-w-md rounded-2xl border border-[#1B5E20]/20 bg-[#FDF6E3] p-4 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="mb-3 text-xl font-bold text-[#1B5E20]">إعدادات القراءة</h3>

        <div className="space-y-3 text-sm">
          <label className="block">
            حجم الخط: {preferences.fontSize}px
            <input
              type="range"
              min={16}
              max={40}
              value={preferences.fontSize}
              onChange={(event) => void onUpdate('fontSize', Number(event.target.value))}
              className="mt-1 w-full"
            />
          </label>

          <label className="block">
            تباعد الأسطر: {preferences.lineHeight.toFixed(1)}
            <input
              type="range"
              min={1.4}
              max={2.4}
              step={0.1}
              value={preferences.lineHeight}
              onChange={(event) => void onUpdate('lineHeight', Number(event.target.value))}
              className="mt-1 w-full"
            />
          </label>

          <label className="block">
            نوع الخط
            <select
              value={preferences.fontFamily}
              onChange={(event) =>
                void onUpdate('fontFamily', event.target.value as ReaderPreferences['fontFamily'])
              }
              className="mt-1 w-full rounded-lg border border-[#1B5E20]/30 bg-white px-2 py-2"
            >
              <option value="Amiri">Amiri</option>
              <option value="Noto Naskh Arabic">Noto Naskh Arabic</option>
              <option value="Scheherazade New">Scheherazade New</option>
            </select>
          </label>

          <label className="block">
            الخلفية
            <select
              value={preferences.theme}
              onChange={(event) =>
                void onUpdate('theme', event.target.value as ReaderPreferences['theme'])
              }
              className="mt-1 w-full rounded-lg border border-[#1B5E20]/30 bg-white px-2 py-2"
            >
              <option value="light">أبيض</option>
              <option value="sepia">كريمي</option>
              <option value="dark">داكن</option>
            </select>
          </label>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 rounded-lg bg-[#1B5E20] px-4 py-2 text-sm font-semibold text-white"
        >
          إغلاق
        </button>
      </div>
    </div>
  )
}
