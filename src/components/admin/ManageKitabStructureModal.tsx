import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import type { KitabDoc } from '../../types/kitab'

interface Props {
  open: boolean
  kitab: KitabDoc
  onClose: () => void
  onUpdated: (fields: Partial<Pick<KitabDoc, 'sourceFormat' | 'structureLabels'>>) => Promise<void>
}

export default function ManageKitabStructureModal({ open, kitab, onClose, onUpdated }: Props) {
  const [sourceFormat, setSourceFormat] = useState<'chapters' | 'hierarchical'>(kitab.sourceFormat ?? 'chapters')
  const [labels, setLabels] = useState<string>((kitab.structureLabels ?? []).join(', '))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setSourceFormat(kitab.sourceFormat ?? 'chapters')
    setLabels((kitab.structureLabels ?? []).join(', '))
  }, [kitab])

  if (!open) return null

  async function handleSave() {
    setSaving(true)
    try {
      await onUpdated({
        sourceFormat,
        structureLabels: labels
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      })
      toast.success('تم تحديث هيكل الكتاب')
      onClose()
    } catch (error) {
      console.error(error)
      toast.error('تعذر التحديث')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#6D4C41]">تعديل الهيكل</p>
            <h3 className="text-lg font-bold text-[#1B5E20]">{kitab.title}</h3>
          </div>
          <button onClick={onClose} className="text-sm text-[#6D4C41] hover:text-[#1B5E20]">إغلاق</button>
        </div>

        <div className="space-y-4 text-sm text-[#3E2723]">
          <label className="block space-y-2">
            <span className="font-semibold">نوع الهيكل</span>
            <select
              value={sourceFormat}
              onChange={(event) => setSourceFormat(event.target.value as 'chapters' | 'hierarchical')}
              className="w-full rounded-2xl border border-[#D7CCC8] bg-[#FFFDF8] px-4 py-3 outline-none focus:border-[#1B5E20]"
            >
              <option value="chapters">فصول مسطحة (بدون شجرة)</option>
              <option value="hierarchical">هرمي (مع مستويات متعددة)</option>
            </select>
            <p className="text-xs text-[#8D6E63]">هذا يغيّر وسم الكتاب وطريقة عرضه، لا يعيد ترتيب المحتوى تلقائيًا.</p>
          </label>

          <label className="block space-y-2">
            <span className="font-semibold">أسماء المستويات (اختياري)</span>
            <input
              value={labels}
              onChange={(event) => setLabels(event.target.value)}
              className="w-full rounded-2xl border border-[#D7CCC8] bg-[#FFFDF8] px-4 py-3 outline-none focus:border-[#1B5E20]"
              placeholder="مثال: كتاب, باب, فصل, فقرة"
            />
            <p className="text-xs text-[#8D6E63]">افصل المستويات بفاصلة.</p>
          </label>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button onClick={onClose} className="rounded-2xl border border-[#D7CCC8] px-4 py-2 text-sm font-semibold text-[#6D4C41] transition hover:bg-[#FFF7EE]">إلغاء</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-2xl bg-[#1B5E20] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#154a19] disabled:cursor-not-allowed disabled:bg-[#A5B8A6]"
          >
            {saving ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
          </button>
        </div>
      </div>
    </div>
  )
}
