import { useEffect, useMemo, useState } from 'react'
import BookFilter from '../components/library/BookFilter'
import Bookshelf from '../components/library/Bookshelf'
import SearchBar from '../components/library/SearchBar'
import useAuth from '../hooks/useAuth'
import { subscribeToKitabs, subscribeToReadingProgress } from '../services/kitabService'
import type { KitabCategory, KitabDoc, KitabLevel, ReadingProgress } from '../types/kitab'

export default function LibraryPage() {
  const { user, profile } = useAuth()
  const [kitabs, setKitabs] = useState<KitabDoc[]>([])
  const [progressMap, setProgressMap] = useState<Record<string, ReadingProgress>>({})
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<'' | KitabCategory>('')
  const [level, setLevel] = useState<'' | KitabLevel>('')
  const [sortBy, setSortBy] = useState<'recent' | 'alphabetical' | 'mostRead'>('recent')

  useEffect(() => {
    const unsubscribe = subscribeToKitabs(setKitabs)
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) {
      return
    }

    const unsubscribe = subscribeToReadingProgress(user.uid, setProgressMap)
    return () => unsubscribe()
  }, [user])

  const filteredKitabs = useMemo(() => {
    const queryText = search.trim().toLowerCase()

    const result = kitabs.filter((kitab) => {
      const matchesSearch =
        queryText.length === 0 ||
        kitab.title.toLowerCase().includes(queryText) ||
        kitab.author.toLowerCase().includes(queryText) ||
        kitab.category.toLowerCase().includes(queryText)

      const matchesCategory = category ? kitab.category === category : true
      const matchesLevel = level ? kitab.level === level : true

      return matchesSearch && matchesCategory && matchesLevel
    })

    if (sortBy === 'alphabetical') {
      return [...result].sort((a, b) => a.title.localeCompare(b.title, 'ar'))
    }

    if (sortBy === 'mostRead') {
      return [...result].sort(
        (a, b) => (progressMap[b.id]?.scrollPosition ?? 0) - (progressMap[a.id]?.scrollPosition ?? 0),
      )
    }

    return result
  }, [category, kitabs, level, progressMap, search, sortBy])

  const stats = useMemo(() => {
    const booksInProgress = Object.values(progressMap).filter(
      (item) => item.scrollPosition > 0 && !item.completed,
    ).length

    return {
      totalKitabs: kitabs.length,
      totalVocab: profile?.stats.totalVocabSaved ?? 0,
      booksInProgress,
      streak: profile?.stats.currentStreak ?? 0,
    }
  }, [kitabs.length, profile?.stats.currentStreak, profile?.stats.totalVocabSaved, progressMap])

  return (
    <section className="space-y-4">
      <header className="rounded-3xl bg-[linear-gradient(130deg,#1B5E20,#245f2e,#8D6E63)] p-6 text-[#FDF6E3] shadow">
        <h1 className="font-['Amiri'] text-5xl font-bold">المكتبة الذكية</h1>
        <p className="text-lg text-[#F9E3B0]">اقرأ، تعلم، واحفظ المفردات</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white/15 p-3">إجمالي الكتب: {stats.totalKitabs}</div>
          <div className="rounded-xl bg-white/15 p-3">المفردات المحفوظة: {stats.totalVocab}</div>
          <div className="rounded-xl bg-white/15 p-3">قيد القراءة: {stats.booksInProgress}</div>
          <div className="rounded-xl bg-white/15 p-3">المواظبة: {stats.streak} يوم</div>
        </div>
      </header>

      <SearchBar value={search} onChange={setSearch} />

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <BookFilter
          category={category}
          level={level}
          sortBy={sortBy}
          onCategoryChange={setCategory}
          onLevelChange={setLevel}
          onSortChange={setSortBy}
        />
        <Bookshelf kitabs={filteredKitabs} progressMap={progressMap} />
      </div>
    </section>
  )
}
