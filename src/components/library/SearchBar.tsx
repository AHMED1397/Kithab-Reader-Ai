interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="rounded-2xl border border-[#1B5E20]/20 bg-white/70 p-3">
      <label className="mb-1 block text-sm font-semibold text-[#3E2723]">البحث في الكتب</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-[#1B5E20]/30 bg-white px-3 py-2 outline-none focus:border-[#1B5E20]"
        placeholder="ابحث بالعنوان أو المؤلف أو التصنيف"
      />
    </div>
  )
}
