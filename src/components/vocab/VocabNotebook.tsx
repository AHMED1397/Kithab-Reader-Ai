import { useState } from 'react'
import toast from 'react-hot-toast'
import { removeVocabularyEntry } from '../../services/vocabService'
import { exportVocabularyAsCsv, exportVocabularyAsJson, exportVocabularyAsPdf } from '../../utils/vocabExport'
import type { VocabularyEntry } from '../../types/kitab'

interface VocabNotebookProps {
  uid: string
  entries: VocabularyEntry[]
  kitabNameById: Record<string, string>
}

type SortBy = 'date' | 'alphabetical' | 'book'

function formatDate(date: Date | undefined) {
  if (!date) {
    return 'غير معروف'
  }

  return date.toLocaleDateString('ar')
}

export default function VocabNotebook({ uid, entries, kitabNameById }: VocabNotebookProps) {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('date')

  const filtered = entries
    .filter((entry) => {
      const query = search.trim().toLowerCase()
      if (!query) {
        return true
      }

      const bookName = (kitabNameById[entry.kitabId] ?? entry.kitabId).toLowerCase()
      return (
        entry.word.toLowerCase().includes(query) ||
        entry.meaningAr.toLowerCase().includes(query) ||
        entry.meaningTa.toLowerCase().includes(query) ||
        entry.meaningEn.toLowerCase().includes(query) ||
        bookName.includes(query)
      )
    })
    .sort((a, b) => {
      if (sortBy === 'alphabetical') {
        return a.word.localeCompare(b.word, 'ar')
      }

      if (sortBy === 'book') {
        const bookA = kitabNameById[a.kitabId] ?? a.kitabId
        const bookB = kitabNameById[b.kitabId] ?? b.kitabId
        return bookA.localeCompare(bookB, 'ar')
      }

      return (b.savedAt?.getTime() ?? 0) - (a.savedAt?.getTime() ?? 0)
    })

  const remove = async (id: string) => {
    try {
      await removeVocabularyEntry(uid, id)
      toast.success('تم حذف المفردة')
    } catch {
      toast.error('تعذر حذف المفردة')
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-[#1B5E20]/20 bg-[#FDF6E3] p-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-xl font-bold text-[#1B5E20]">مفكرة المفردات</h3>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => exportVocabularyAsJson(filtered)}
            className="flex-1 rounded-lg border border-[#1B5E20]/30 bg-white px-3 py-2 text-xs font-semibold text-[#1B5E20] hover:bg-[#1B5E20]/5 sm:flex-none"
          >
            JSON
          </button>
          <button
            type="button"
            onClick={() => exportVocabularyAsCsv(filtered)}
            className="flex-1 rounded-lg border border-[#1B5E20]/30 bg-white px-3 py-2 text-xs font-semibold text-[#1B5E20] hover:bg-[#1B5E20]/5 sm:flex-none"
          >
            CSV
          </button>
          <button
            type="button"
            onClick={() => exportVocabularyAsPdf(filtered)}
            className="flex-1 rounded-lg border border-[#1B5E20]/30 bg-white px-3 py-2 text-xs font-semibold text-[#1B5E20] hover:bg-[#1B5E20]/5 sm:flex-none"
          >
            PDF
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_240px]">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="ابحث عن كلمة أو معنى أو كتاب"
          className="w-full rounded-xl border border-[#1B5E20]/30 bg-white px-4 py-2 outline-none focus:border-[#1B5E20] focus:ring-1 focus:ring-[#1B5E20]"
        />

        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value as SortBy)}
          className="w-full rounded-xl border border-[#1B5E20]/30 bg-white px-3 py-2"
        >
          <option value="date">الأحدث أولاً</option>
          <option value="alphabetical">أبجديًا</option>
          <option value="book">حسب الكتاب</option>
        </select>
      </div>

      {/* Table view for Desktop */}
      <div className="hidden overflow-hidden rounded-xl border border-[#1B5E20]/20 md:block">
        <table className="min-w-full bg-white text-sm">
          <thead className="bg-[#F5F0E8] text-[#3E2723]">
            <tr>
              <th className="px-4 py-3 text-right">الكلمة</th>
              <th className="px-4 py-3 text-right">العربية</th>
              <th className="px-4 py-3 text-right">Tamil</th>
              <th className="px-4 py-3 text-right">English</th>
              <th className="px-4 py-3 text-right">الكتاب</th>
              <th className="px-4 py-3 text-right">التاريخ</th>
              <th className="px-4 py-3 text-center">إجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1B5E20]/10">
            {filtered.map((entry) => (
              <tr key={entry.id} className="transition hover:bg-[#F9A825]/5">
                <td className="px-4 py-3 font-bold text-[#1B5E20]">{entry.word}</td>
                <td className="px-4 py-3">{entry.meaningAr}</td>
                <td className="px-4 py-3">{entry.meaningTa}</td>
                <td className="px-4 py-3">{entry.meaningEn}</td>
                <td className="px-4 py-3 text-[#6D4C41]">{kitabNameById[entry.kitabId] || 'غير معروف'}</td>
                <td className="px-4 py-3 text-xs text-[#8D6E63]">{formatDate(entry.savedAt)}</td>
                <td className="px-4 py-3 text-center">
                  <button
                    type="button"
                    onClick={() => void remove(entry.id)}
                    className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Card view for Mobile */}
      <div className="space-y-3 md:hidden">
        {filtered.map((entry) => (
          <div key={entry.id} className="rounded-xl border border-[#1B5E20]/15 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-lg font-bold text-[#1B5E20]">{entry.word}</span>
              <button
                type="button"
                onClick={() => void remove(entry.id)}
                className="text-xs font-semibold text-red-600 underline"
              >
                حذف
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex gap-2">
                <span className="w-16 flex-shrink-0 text-xs font-bold text-[#8D6E63]">العربية:</span>
                <span>{entry.meaningAr}</span>
              </div>
              <div className="flex gap-2">
                <span className="w-16 flex-shrink-0 text-xs font-bold text-[#8D6E63]">Tamil:</span>
                <span>{entry.meaningTa}</span>
              </div>
              <div className="flex gap-2">
                <span className="w-16 flex-shrink-0 text-xs font-bold text-[#8D6E63]">English:</span>
                <span>{entry.meaningEn}</span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-dashed border-[#1B5E20]/10 pt-2 text-[10px] text-[#6D4C41]">
                <span>{kitabNameById[entry.kitabId] || 'غير معروف'}</span>
                <span>{formatDate(entry.savedAt)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-10 text-center text-[#6D4C41]">لا توجد مفردات مطابقة للبحث.</p>
      )}
    </section>
  )
}
