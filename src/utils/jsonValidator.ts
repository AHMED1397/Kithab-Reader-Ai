import type { KitabChapterInput, KitabInput, KitabNodeInput } from '../types/kitab'

const validCategories = new Set(['فقه', 'تفسير', 'حديث', 'نحو', 'صرف', 'أدب', 'تاريخ', 'عقيدة'])
const validLevels = new Set(['مبتدئ', 'متوسط', 'متقدم'])
const defaultStructureLabels = ['كتاب', 'باب', 'فصل', 'مقطع']

export interface ValidationResult {
  valid: boolean
  errors: string[]
  kitabs: KitabInput[]
}

function assertString(value: unknown, field: string, errors: string[], index: number) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    errors.push(`العنصر ${index + 1}: الحقل "${field}" مطلوب ويجب أن يكون نصًا.`)
    return ''
  }

  return value.trim()
}

function normalizeStructureLabels(value: unknown): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    return [...defaultStructureLabels]
  }

  const labels = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
  return labels.length > 0 ? labels : [...defaultStructureLabels]
}

function flattenSections(
  nodes: KitabNodeInput[],
  errors: string[],
  kitabIndex: number,
  labels: string[],
  ancestry: string[] = [],
  depth = 0,
): KitabChapterInput[] {
  const output: KitabChapterInput[] = []

  for (const [nodeIndex, node] of nodes.entries()) {
    const nodeId = typeof node.id === 'string' && node.id.trim() ? node.id.trim() : ''
    const nodeTitle = typeof node.title === 'string' && node.title.trim() ? node.title.trim() : ''
    const nodeType =
      typeof node.type === 'string' && node.type.trim()
        ? node.type.trim()
        : labels[Math.min(depth, labels.length - 1)]
    const nodeContent = typeof node.content === 'string' ? node.content.trim() : ''
    const children = Array.isArray(node.children) ? node.children : []
    const path = [...ancestry, nodeTitle].filter(Boolean)

    if (!nodeId) {
      errors.push(`العنصر ${kitabIndex + 1}: كل قسم هرمي يحتاج إلى id.`)
    }

    if (!nodeTitle) {
      errors.push(`العنصر ${kitabIndex + 1}: كل قسم هرمي يحتاج إلى title.`)
    }

    if (nodeContent) {
      output.push({
        chapterId: nodeId || `node_${depth + 1}_${nodeIndex + 1}`,
        title: path.join(' / ') || nodeTitle,
        content: nodeContent,
        order: typeof node.order === 'number' ? node.order : output.length + 1,
        nodeType,
        depth,
        path,
      })
    }

    if (children.length > 0) {
      output.push(...flattenSections(children, errors, kitabIndex, labels, path, depth + 1))
    }
  }

  return output
}

function normalizeFlatChapters(rawChapters: unknown[], index: number, errors: string[]): KitabChapterInput[] {
  const output: KitabChapterInput[] = []

  for (const [chapterIndex, chapter] of rawChapters.entries()) {
    if (!chapter || typeof chapter !== 'object') {
      errors.push(`العنصر ${index + 1}: الفصل ${chapterIndex + 1} غير صالح.`)
      continue
    }

    const chapterObj = chapter as Record<string, unknown>
    const chapterId = assertString(chapterObj.chapterId, 'chapterId', errors, index)
    const chapterTitle = assertString(chapterObj.title, 'chapter title', errors, index)
    const chapterContent = assertString(chapterObj.content, 'chapter content', errors, index)
    const order = typeof chapterObj.order === 'number' ? chapterObj.order : chapterIndex + 1

    output.push({
      chapterId,
      title: chapterTitle,
      content: chapterContent,
      order,
      nodeType: 'فصل',
      depth: 0,
      path: chapterTitle ? [chapterTitle] : [],
    })
  }

  return output
}

function normalizeKitab(raw: unknown, index: number, errors: string[]): KitabInput | null {
  if (!raw || typeof raw !== 'object') {
    errors.push(`العنصر ${index + 1}: البيانات غير صالحة.`)
    return null
  }

  const candidate = raw as Record<string, unknown>
  const id = assertString(candidate.id, 'id', errors, index)
  const title = assertString(candidate.title, 'title', errors, index)
  const author = assertString(candidate.author, 'author', errors, index)
  const category = assertString(candidate.category, 'category', errors, index)
  const level = assertString(candidate.level, 'level', errors, index)
  const coverColor = typeof candidate.coverColor === 'string' ? candidate.coverColor : '#1B5E20'
  const description = typeof candidate.description === 'string' ? candidate.description : ''
  const structureLabels = normalizeStructureLabels(candidate.structureLabels)

  if (!validCategories.has(category)) {
    errors.push(`العنصر ${index + 1}: التصنيف "${category}" غير مدعوم.`)
  }

  if (!validLevels.has(level)) {
    errors.push(`العنصر ${index + 1}: المستوى "${level}" غير مدعوم.`)
  }

  const hasFlatChapters = Array.isArray(candidate.chapters) && candidate.chapters.length > 0
  const hasSections = Array.isArray(candidate.sections) && candidate.sections.length > 0

  if (!hasFlatChapters && !hasSections) {
    errors.push(`العنصر ${index + 1}: يجب توفير chapters أو sections على الأقل.`)
    return null
  }

  const sections = hasSections ? (candidate.sections as KitabNodeInput[]) : []
  const chapters = hasFlatChapters
    ? normalizeFlatChapters(candidate.chapters as unknown[], index, errors)
    : flattenSections(sections, errors, index, structureLabels)

  if (chapters.length === 0) {
    errors.push(`العنصر ${index + 1}: لا يوجد محتوى صالح بعد المعالجة.`)
    return null
  }

  const normalizedChapters: KitabChapterInput[] = chapters.map((chapter, chapterIndex) => ({
    chapterId: chapter.chapterId,
    title: chapter.title,
    content: chapter.content,
    order: typeof chapter.order === 'number' ? chapter.order : chapterIndex + 1,
    nodeType: chapter.nodeType,
    depth: chapter.depth,
    path: chapter.path,
  }))

  return {
    id,
    title,
    author,
    category: category as KitabInput['category'],
    level: level as KitabInput['level'],
    coverColor,
    description,
    chapters: normalizedChapters,
    sourceFormat: hasSections ? 'hierarchical' : 'chapters',
    structureLabels,
    sections,
  }
}

export function parseAndValidateKitabJson(jsonText: string): ValidationResult {
  const errors: string[] = []
  let parsed: unknown

  try {
    parsed = JSON.parse(jsonText)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'تنسيق JSON غير صالح.'
    return {
      valid: false,
      errors: [`خطأ JSON: ${message}`],
      kitabs: [],
    }
  }

  const payload = Array.isArray(parsed) ? parsed : [parsed]
  const kitabs: KitabInput[] = []

  for (const [index, item] of payload.entries()) {
    const normalized = normalizeKitab(item, index, errors)
    if (normalized) {
      kitabs.push(normalized)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    kitabs,
  }
}
