export type KitabCategory = 'فقه' | 'تفسير' | 'حديث' | 'نحو' | 'صرف' | 'أدب' | 'تاريخ' | 'عقيدة'
export type KitabLevel = 'مبتدئ' | 'متوسط' | 'متقدم'

export interface KitabNodeInput {
  id: string
  title: string
  type?: string
  content?: string
  order?: number
  children?: KitabNodeInput[]
}

export interface KitabChapterInput {
  chapterId: string
  title: string
  content: string
  order?: number
  nodeType?: string
  depth?: number
  path?: string[]
}

export interface KitabInput {
  id: string
  title: string
  author: string
  category: KitabCategory
  level: KitabLevel
  coverColor?: string
  description?: string
  chapters: KitabChapterInput[]
  sourceFormat?: 'chapters' | 'hierarchical'
  structureLabels?: string[]
  sections?: KitabNodeInput[]
}

export interface KitabDoc {
  id: string
  title: string
  author: string
  category: KitabCategory
  level: KitabLevel
  coverColor: string
  description: string
  chapterCount: number
  sourceFormat?: 'chapters' | 'hierarchical'
  structureLabels?: string[]
  createdAt?: unknown
  addedBy?: string
}

export interface KitabChapter {
  id: string
  title: string
  content: string
  order: number
  nodeType?: string
  depth?: number
  path?: string[]
}

export interface ReadingProgress {
  kitabId: string
  currentChapter: string
  scrollPosition: number
  completed: boolean
  lastReadAt?: unknown
}

export interface VocabularyEntry {
  id: string
  word: string
  meaningAr: string
  meaningTa: string
  meaningEn: string
  context: string
  kitabId: string
  chapterId: string
  savedAt?: Date
  reviewCount: number
}
