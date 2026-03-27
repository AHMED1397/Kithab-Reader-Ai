import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import KitabReader from '../components/reader/KitabReader'
import { getChaptersMetadata, getKitabMetadata } from '../services/kitabService'
import type { ChapterMetadata, KitabDoc } from '../types/kitab'

export default function ReaderPage() {
  const { kitabId } = useParams()
  const [kitab, setKitab] = useState<KitabDoc | null>(null)
  const [chaptersMetadata, setChaptersMetadata] = useState<ChapterMetadata[]>([])
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
        const [kitabData, chaptersData] = await Promise.all([
          getKitabMetadata(kitabId),
          getChaptersMetadata(kitabId),
        ])

        if (!active) {
          return
        }

        setKitab(kitabData)
        setChaptersMetadata(chaptersData)
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

  return <KitabReader kitab={kitab} chaptersMetadata={chaptersMetadata} />
}
