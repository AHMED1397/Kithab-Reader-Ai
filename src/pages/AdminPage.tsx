import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AddKitab from '../components/admin/AddKitab'
import ManageKitabs from '../components/admin/ManageKitabs'
import { subscribeToKitabs } from '../services/kitabService'
import type { KitabDoc } from '../types/kitab'

export default function AdminPage() {
  const [kitabs, setKitabs] = useState<KitabDoc[]>([])

  useEffect(() => {
    const unsubscribe = subscribeToKitabs(setKitabs)
    return () => unsubscribe()
  }, [])

  return (
    <section className="space-y-4">
      <header className="rounded-2xl border border-[#1B5E20]/20 bg-[#FDF6E3] p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="font-['Amiri'] text-4xl font-bold text-[#1B5E20]">لوحة إدارة الكتب</h1>
            <p className="text-[#6D4C41]">إضافة الكتب، تعديل بياناتها، والتحكم في هيكلها.</p>
          </div>

          <Link
            to="/admin/builder"
            className="inline-flex items-center justify-center rounded-2xl bg-[#1B5E20] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#154a19]"
          >
            فتح المنشئ الموجَّه
          </Link>
        </div>
      </header>

      <AddKitab />
      <ManageKitabs kitabs={kitabs} />
    </section>
  )
}
