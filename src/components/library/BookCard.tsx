import { Link } from 'react-router-dom'
import type { KitabDoc } from '../../types/kitab'

interface BookCardProps {
  kitab: KitabDoc
}

export default function BookCard({ kitab }: BookCardProps) {
  return (
    <Link
      to={`/reader/${kitab.id}`}
      className="group relative block min-h-[240px] rounded-t-xl border border-[#3E2723]/20 bg-[#F5F0E8] p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
      style={{ borderTop: `10px solid ${kitab.coverColor}` }}
    >
      <div className="mb-3 flex items-center justify-between text-xs">
        <span className="rounded-full bg-[#1B5E20]/10 px-2 py-1 font-semibold text-[#1B5E20]">{kitab.category}</span>
        <span className="rounded-full bg-[#F9A825]/20 px-2 py-1 font-semibold text-[#6D4C41]">{kitab.level}</span>
      </div>

      <h4 className="line-clamp-2 font-['Amiri'] text-2xl font-bold text-[#1B5E20]">{kitab.title}</h4>
      <p className="mt-1 text-sm text-[#5D4037]">{kitab.author}</p>
      <p className="mt-2 text-xs text-[#6D4C41]">عدد الفصول: {kitab.chapterCount}</p>


      <div className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-transparent transition group-hover:ring-[#F9A825]/50" />
    </Link>
  )
}
