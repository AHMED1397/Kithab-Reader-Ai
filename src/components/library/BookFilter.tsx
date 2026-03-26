import { useState } from 'react'
import { FunnelIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import type { KitabCategory, KitabLevel } from '../../types/kitab'

interface BookFilterProps {
  category: '' | KitabCategory
  level: '' | KitabLevel
  sortBy: 'recent' | 'alphabetical' | 'mostRead'
  onCategoryChange: (value: '' | KitabCategory) => void
  onLevelChange: (value: '' | KitabLevel) => void
  onSortChange: (value: 'recent' | 'alphabetical' | 'mostRead') => void
}

const categories: KitabCategory[] = ['فقه', 'تفسير', 'حديث', 'نحو', 'صرف', 'أدب', 'تاريخ', 'عقيدة']
const levels: KitabLevel[] = ['مبتدئ', 'متوسط', 'متقدم']

export default function BookFilter({
  category,
  level,
  sortBy,
  onCategoryChange,
  onLevelChange,
  onSortChange,
}: BookFilterProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <aside className="rounded-2xl border border-[#1B5E20]/20 bg-[#FDF6E3] p-4 shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-[#1B5E20] lg:cursor-default"
      >
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5" />
          <h3 className="text-lg font-bold">التصفية</h3>
        </div>
        <div className="lg:hidden">
          {isOpen ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
        </div>
      </button>

      <div className={`mt-4 space-y-3 ${isOpen ? 'block' : 'hidden lg:block'}`}>
        <div>
          <label className="mb-1 block text-sm font-semibold">التصنيف</label>
          <select
            value={category}
            onChange={(event) => onCategoryChange(event.target.value as '' | KitabCategory)}
            className="w-full rounded-xl border border-[#1B5E20]/30 bg-white px-3 py-2"
          >
            <option value="">كل التصنيفات</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold">المستوى</label>
          <select
            value={level}
            onChange={(event) => onLevelChange(event.target.value as '' | KitabLevel)}
            className="w-full rounded-xl border border-[#1B5E20]/30 bg-white px-3 py-2"
          >
            <option value="">كل المستويات</option>
            {levels.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold">الترتيب</label>
          <select
            value={sortBy}
            onChange={(event) => onSortChange(event.target.value as 'recent' | 'alphabetical' | 'mostRead')}
            className="w-full rounded-xl border border-[#1B5E20]/30 bg-white px-3 py-2"
          >
            <option value="recent">الأحدث إضافة</option>
            <option value="alphabetical">أبجديًا</option>
            <option value="mostRead">الأكثر قراءة</option>
          </select>
        </div>
      </div>
    </aside>
  )
}

