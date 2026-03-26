import type { KitabInput } from '../../types/kitab'

interface KitabPreviewProps {
  kitabs: KitabInput[]
}

export default function KitabPreview({ kitabs }: KitabPreviewProps) {
  if (kitabs.length === 0) {
    return (
      <div className="rounded-xl border border-[#1B5E20]/20 bg-white p-4 text-sm text-[#6D4C41]">
        لا يوجد معاينة بعد.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {kitabs.map((kitab) => (
        <article key={kitab.id} className="rounded-xl border border-[#1B5E20]/20 bg-white p-4">
          <h4 className="font-['Amiri'] text-2xl font-bold text-[#1B5E20]">{kitab.title}</h4>
          <p className="text-sm text-[#5D4037]">{kitab.author}</p>
          <p className="text-sm text-[#6D4C41]">
            {kitab.category} - {kitab.level}
          </p>
          <p className="mt-2 text-sm text-[#6D4C41]">
            نوع البنية: {kitab.sourceFormat === 'hierarchical' ? 'هرمية متقدمة' : 'فصول مباشرة'}
          </p>
          <p className="text-sm text-[#6D4C41]">التسميات: {(kitab.structureLabels ?? []).join(' / ') || 'افتراضي'}</p>
          <p className="text-sm text-[#6D4C41]">عدد الوحدات القابلة للقراءة: {kitab.chapters.length}</p>

          <div className="mt-3 rounded-lg bg-[#F8F5EF] p-3 text-sm text-[#6D4C41]">
            <p className="font-semibold text-[#1B5E20]">أول وحدة ستظهر في القارئ</p>
            <p>العنوان: {kitab.chapters[0]?.title}</p>
            <p>المسار: {(kitab.chapters[0]?.path ?? []).join(' / ') || 'غير محدد'}</p>
            <p>التصنيف البنيوي: {kitab.chapters[0]?.nodeType ?? 'فصل'}</p>
            <p className="mt-1 line-clamp-3">{kitab.chapters[0]?.content}</p>
          </div>
        </article>
      ))}
    </div>
  )
}
