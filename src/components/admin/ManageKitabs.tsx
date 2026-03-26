import { Link } from 'react-router-dom'
import type { KitabDoc } from '../../types/kitab'

interface Props {
  kitabs: KitabDoc[]
}

export default function ManageKitabs({ kitabs }: Props) {
  return (
    <section className="rounded-2xl border border-[#1B5E20]/15 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1B5E20]">إدارة الكتب</h2>
          <p className="text-sm text-[#6D4C41]">تعديل البيانات أو بنية الكتاب.</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-[#3E2723]">
          <thead>
            <tr className="bg-[#F5F0E8] text-right">
              <th className="px-3 py-2">العنوان</th>
              <th className="px-3 py-2">المؤلف</th>
              <th className="px-3 py-2">التصنيف</th>
              <th className="px-3 py-2">المستوى</th>
              <th className="px-3 py-2">الشكل</th>
              <th className="px-3 py-2 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {kitabs.map((kitab) => (
              <tr key={kitab.id} className="border-b border-[#E8E0D2]">
                <td className="px-3 py-2 font-semibold">{kitab.title}</td>
                <td className="px-3 py-2">{kitab.author}</td>
                <td className="px-3 py-2">{kitab.category}</td>
                <td className="px-3 py-2">{kitab.level}</td>
                <td className="px-3 py-2">{kitab.sourceFormat === 'hierarchical' ? 'هرمي' : 'فصول'}</td>
                <td className="px-3 py-2 text-center space-x-2 rtl:space-x-reverse">
                  <Link
                    to={`/admin/builder?kitabId=${encodeURIComponent(kitab.id)}`}
                    className="rounded-xl bg-[#1B5E20] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#154a19]"
                  >
                    تعديل الهيكل
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
