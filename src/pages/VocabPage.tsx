import { useEffect, useMemo, useState } from 'react'
import Flashcard from '../components/vocab/Flashcard'
import VocabNotebook from '../components/vocab/VocabNotebook'
import VocabStats from '../components/vocab/VocabStats'
import useAuth from '../hooks/useAuth'
import { subscribeToKitabs } from '../services/kitabService'
import { subscribeToUserVocabulary } from '../services/vocabService'
import type { KitabDoc, VocabularyEntry } from '../types/kitab'

export default function VocabPage() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<VocabularyEntry[]>([])
  const [kitabs, setKitabs] = useState<KitabDoc[]>([])

  useEffect(() => {
    const unsubscribeKitabs = subscribeToKitabs(setKitabs)
    return () => unsubscribeKitabs()
  }, [])

  useEffect(() => {
    if (!user) {
      return
    }

    const unsubscribeVocab = subscribeToUserVocabulary(user.uid, setEntries)
    return () => unsubscribeVocab()
  }, [user])

  const kitabNameById = useMemo(
    () =>
      kitabs.reduce<Record<string, string>>((acc, kitab) => {
        acc[kitab.id] = kitab.title
        return acc
      }, {}),
    [kitabs],
  )

  if (!user) {
    return null
  }

  return (
    <section className="space-y-4">
      <header className="rounded-2xl border border-[#1B5E20]/20 bg-[#FDF6E3] p-6 shadow-sm">
        <h1 className="font-['Amiri'] text-4xl font-bold text-[#1B5E20]">مفكرة المفردات</h1>
        <p className="text-[#6D4C41]">حفظ ومراجعة وتصدير جميع المفردات التي جمعتها أثناء القراءة.</p>
      </header>

      <VocabStats entries={entries} kitabNameById={kitabNameById} />
      <Flashcard uid={user.uid} entries={entries} kitabNameById={kitabNameById} />
      <VocabNotebook uid={user.uid} entries={entries} kitabNameById={kitabNameById} />
    </section>
  )
}
