import type { VocabularyEntry } from '../../types/kitab'

interface VocabStatsProps {
  entries: VocabularyEntry[]
  kitabNameById: Record<string, string>
}

function dateKey(value: Date | undefined) {
  if (!value) {
    return 'غير معروف'
  }

  return value.toISOString().slice(0, 10)
}

export default function VocabStats({ entries, kitabNameById }: VocabStatsProps) {
  const wordsPerBook = entries.reduce<Record<string, number>>((acc, item) => {
    const key = kitabNameById[item.kitabId] ?? item.kitabId
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})

  const wordsPerDay = entries.reduce<Record<string, number>>((acc, item) => {
    const key = dateKey(item.savedAt)
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})

  const maxDaily = Math.max(1, ...Object.values(wordsPerDay))

  return (
    <section className="space-y-4 rounded-2xl border border-[#1B5E20]/20 bg-[#FDF6E3] p-4 shadow-sm">
      <h3 className="text-xl font-bold text-[#1B5E20]">الإحصائيات</h3>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-3">إجمالي الكلمات: {entries.length}</div>
        <div className="rounded-xl bg-white p-3">عدد الكتب: {Object.keys(wordsPerBook).length}</div>
        <div className="rounded-xl bg-white p-3">إجمالي المراجعات: {entries.reduce((acc, item) => acc + item.reviewCount, 0)}</div>
        <div className="rounded-xl bg-white p-3">آخر 7 أيام نشطة: {Object.keys(wordsPerDay).slice(-7).length}</div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-3">
          <h4 className="mb-2 font-semibold text-[#1B5E20]">الكلمات لكل كتاب</h4>
          <div className="space-y-1 text-sm">
            {Object.entries(wordsPerBook).map(([book, count]) => (
              <p key={book}>{book}: {count}</p>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-white p-3">
          <h4 className="mb-2 font-semibold text-[#1B5E20]">الكلمات لكل يوم</h4>
          <div className="space-y-2">
            {Object.entries(wordsPerDay)
              .sort(([a], [b]) => a.localeCompare(b))
              .slice(-7)
              .map(([day, count]) => (
                <div key={day}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span>{day}</span>
                    <span>{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#1B5E20]/10">
                    <div
                      className="h-2 rounded-full bg-[#F9A825]"
                      style={{ width: `${(count / maxDaily) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </section>
  )
}
