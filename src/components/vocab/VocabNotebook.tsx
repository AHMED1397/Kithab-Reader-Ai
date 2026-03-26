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
    <section className="space-y-3 rounded-2xl border border-[#1B5E20]/20 bg-[#FDF6E3] p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xl font-bold text-[#1B5E20]">مفكرة المفردات</h3>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => exportVocabularyAsJson(filtered)}
            className="rounded-lg border border-[#1B5E20]/30 px-3 py-2 text-xs font-semibold text-[#1B5E20]"
          >
            تصدير JSON
          </button>
          <button
            type="button"
            onClick={() => exportVocabularyAsCsv(filtered)}
            className="rounded-lg border border-[#1B5E20]/30 px-3 py-2 text-xs font-semibold text-[#1B5E20]"
          >
            تصدير CSV
          </button>
          <button
            type="button"
            onClick={() => exportVocabularyAsPdf(filtered)}
            className="rounded-lg border border-[#1B5E20]/30 px-3 py-2 text-xs font-semibold text-[#1B5E20]"
          >
            تصدير PDF
          </button>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_220px]">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="ابحث عن كلمة أو معنى أو كتاب"
          className="rounded-xl border border-[#1B5E20]/30 bg-white px-3 py-2 outline-none focus:border-[#1B5E20]"
        />

        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value as SortBy)}
          className="rounded-xl border border-[#1B5E20]/30 bg-white px-3 py-2"
        >
          <option value="date">الترتيب حسب التاريخ</option>
          <option value="alphabetical">الترتيب الأبجدي</option>
          <option value="book">الترتيب حسب الكتاب</option>
        </select>
      </div>

      <div className="overflow-auto rounded-xl border border-[#1B5E20]/20">
        <table className="min-w-full bg-white text-sm">
          <thead className="bg-[#F5F0E8] text-[#3E2723]">
            <tr>
              <th className="px-3 py-2 text-right">الكلمة</th>
              <th className="px-3 py-2 text-right">العربية</th>
              <th className="px-3 py-2 text-right">Tamil</th>
              <th className="px-3 py-2 text-right">English</th>
              <th className="px-3 py-2 text-right">الكتاب</th>
              <th className="px-3 py-2 text-right">التاريخ</th>
              <th className="px-3 py-2 text-right">إجراء</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry) => (
              <tr key={entry.id} className="border-t border-[#1B5E20]/10">
                <td className="px-3 py-2 font-semibold text-[#1B5E20]">{entry.word}</td>
                <td className="px-3 py-2">{entry.meaningAr}</td>
                <td className="px-3 py-2">{entry.meaningTa}</td>
                <td className="px-3 py-2">{entry.meaningEn}</td>
                <td className="px-3 py-2">{kitabNameById[entry.kitabId] ?? entry.kitabId}</td>
                <td className="px-3 py-2">{formatDate(entry.savedAt)}</td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => void remove(entry.id)}
                    className="rounded-lg border border-red-400 px-2 py-1 text-xs font-semibold text-red-600"
                  >
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
