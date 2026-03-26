import BookCard from './BookCard'
import type { KitabDoc, ReadingProgress } from '../../types/kitab'

interface BookshelfProps {
  kitabs: KitabDoc[]
  progressMap: Record<string, ReadingProgress>
}

function progressFromReading(item: ReadingProgress | undefined) {
  if (!item) {
    return 0
  }

  if (item.completed) {
    return 100
  }

  return Math.min(95, Math.max(0, item.scrollPosition * 100))
}

export default function Bookshelf({ kitabs, progressMap }: BookshelfProps) {
  if (kitabs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#1B5E20]/40 bg-[#FDF6E3] p-10 text-center text-[#5D4037]">
        لا توجد كتب مطابقة للفلترة الحالية.
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-[#8D6E63]/20 bg-gradient-to-b from-[#d6b88b] via-[#b58d63] to-[#8d6e63] p-4 shadow-inner">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kitabs.map((kitab) => (
          <BookCard key={kitab.id} kitab={kitab} progress={progressFromReading(progressMap[kitab.id])} />
        ))}
      </div>
    </div>
  )
}
