import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import KitabReader from '../components/reader/KitabReader'
import { getKitabWithChapters } from '../services/kitabService'
import type { KitabChapter, KitabDoc } from '../types/kitab'

export default function ReaderPage() {
  const { kitabId } = useParams()
  const [kitab, setKitab] = useState<KitabDoc | null>(null)
  const [chapters, setChapters] = useState<KitabChapter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!kitabId) {
      setError('معرف الكتاب غير متوفر')
      setLoading(false)
      return
    }

    let active = true

    const run = async () => {
      try {
        setLoading(true)
        const payload = await getKitabWithChapters(kitabId)
        if (!active) {
          return
        }

        setKitab(payload.kitab)
        setChapters(payload.chapters)
        setError('')
      } catch {
        if (!active) {
          return
        }

        setError('تعذر تحميل الكتاب')
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void run()

    return () => {
      active = false
    }
  }, [kitabId])

  if (loading) {
    return <p className="rounded-xl bg-white p-4 text-center">جاري تحميل الكتاب...</p>
  }

  if (error || !kitab) {
    return <p className="rounded-xl bg-red-50 p-4 text-center text-red-700">{error || 'الكتاب غير موجود'}</p>
  }

  return <KitabReader kitab={kitab} chapters={chapters} />
}
