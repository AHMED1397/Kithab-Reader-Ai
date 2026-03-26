import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import useAuth from '../hooks/useAuth'
import { bulkImportKitabs, getKitabWithChapters } from '../services/kitabService'
import type { KitabCategory, KitabInput, KitabLevel, KitabNodeInput } from '../types/kitab'

interface DraftNode {
  id: string
  title: string
  details: string
  collapsed: boolean
  children: DraftNode[]
}

interface BuilderDraft {
  kitabId: string
  title: string
  author: string
  category: KitabCategory
  level: KitabLevel
  coverColor: string
  description: string
  notes: string
  tree: DraftNode[]
}

const STORAGE_KEY = 'kitab-tree-builder-draft'
const CATEGORY_OPTIONS: KitabCategory[] = ['فقه', 'تفسير', 'حديث', 'نحو', 'صرف', 'أدب', 'تاريخ', 'عقيدة']
const LEVEL_OPTIONS: KitabLevel[] = ['مبتدئ', 'متوسط', 'متقدم']

function createDraftNode(): DraftNode {
  return {
    id: crypto.randomUUID(),
    title: '',
    details: '',
    collapsed: false,
    children: [],
  }
}

function createEmptyDraft(): BuilderDraft {
  return {
    kitabId: '',
    title: '',
    author: '',
    category: 'حديث',
    level: 'مبتدئ',
    coverColor: '#1B5E20',
    description: '',
    notes: '',
    tree: [createDraftNode()],
  }
}

function normalizeNodes(nodes: unknown[]): DraftNode[] {
  return nodes
    .map((node) => {
      if (!node || typeof node !== 'object') {
        return null
      }

      const candidate = node as Partial<DraftNode>
      return {
        id: typeof candidate.id === 'string' ? candidate.id : crypto.randomUUID(),
        title: String(candidate.title ?? ''),
        details: String(candidate.details ?? ''),
        collapsed: Boolean(candidate.collapsed),
        children: Array.isArray(candidate.children) ? normalizeNodes(candidate.children) : [],
      }
    })
    .filter((item): item is DraftNode => Boolean(item))
}

function loadDraft(): BuilderDraft {
  const fallback = createEmptyDraft()

  try {
    const cached = localStorage.getItem(STORAGE_KEY)
    if (!cached) {
      return fallback
    }

    const parsed = JSON.parse(cached) as Partial<BuilderDraft>
    return {
      kitabId: String(parsed.kitabId ?? ''),
      title: String(parsed.title ?? ''),
      author: String(parsed.author ?? ''),
      category: CATEGORY_OPTIONS.includes(parsed.category as KitabCategory)
        ? (parsed.category as KitabCategory)
        : fallback.category,
      level: LEVEL_OPTIONS.includes(parsed.level as KitabLevel)
        ? (parsed.level as KitabLevel)
        : fallback.level,
      coverColor: String(parsed.coverColor ?? '#1B5E20'),
      description: String(parsed.description ?? ''),
      notes: String(parsed.notes ?? ''),
      tree: Array.isArray(parsed.tree) && parsed.tree.length ? normalizeNodes(parsed.tree) : fallback.tree,
    }
  } catch {
    return fallback
  }
}

function slugify(value: string, fallback: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '_')
    .replace(/^_+|_+$/g, '') || fallback
}

function updateNodeTree(nodes: DraftNode[], nodeId: string, updater: (node: DraftNode) => DraftNode): DraftNode[] {
  return nodes.map((node) => {
    if (node.id === nodeId) {
      return updater(node)
    }

    if (!node.children.length) {
      return node
    }

    return {
      ...node,
      children: updateNodeTree(node.children, nodeId, updater),
    }
  })
}

function removeNodeTree(nodes: DraftNode[], nodeId: string): DraftNode[] {
  return nodes
    .filter((node) => node.id !== nodeId)
    .map((node) => ({
      ...node,
      children: removeNodeTree(node.children, nodeId),
    }))
}

function countNodes(nodes: DraftNode[]): number {
  return nodes.reduce((sum, node) => sum + 1 + countNodes(node.children), 0)
}

function getMaxDepth(nodes: DraftNode[], depth = 1): number {
  if (!nodes.length) {
    return depth
  }

  return Math.max(
    depth,
    ...nodes.map((node) => (node.children.length ? getMaxDepth(node.children, depth + 1) : depth)),
  )
}

function buildSectionsFromTree(nodes: DraftNode[], path: string[] = [], depth = 0): KitabNodeInput[] {
  const sections: KitabNodeInput[] = []

  for (const [index, node] of nodes.entries()) {
    const title = node.title.trim()
    if (!title) {
      continue
    }

    const nextPath = [...path, title]
    sections.push({
      id: slugify(nextPath.join('_'), `node_${depth + 1}_${index + 1}`),
      title,
      type: `المستوى ${depth + 1}`,
      content: node.details.trim() || undefined,
      children: buildSectionsFromTree(node.children, nextPath, depth + 1),
    })
  }

  return sections
}

function flattenSections(sections: KitabNodeInput[]) {
  const chapters: KitabInput['chapters'] = []

  function walk(nodes: KitabNodeInput[], path: string[] = [], depth = 0) {
    for (const node of nodes) {
      const nextPath = [...path, node.title]

      if (node.content?.trim()) {
        chapters.push({
          chapterId: node.id,
          title: nextPath.join(' / '),
          content: node.content.trim(),
          order: chapters.length + 1,
          nodeType: node.type,
          depth,
          path: nextPath,
        })
      }

      if (node.children?.length) {
        walk(node.children, nextPath, depth + 1)
      }
    }
  }

  walk(sections)
  return chapters
}

function buildDraftTreeFromChapters(chapters: Array<{ id: string; title: string; content: string; path?: string[] }>) {
  function insertNode(nodes: DraftNode[], path: string[], chapterId: string, content: string): DraftNode[] {
    if (!path.length) {
      return nodes
    }

    const [currentTitle, ...rest] = path
    const existingIndex = nodes.findIndex((node) => node.title === currentTitle)
    const existingNode = existingIndex >= 0 ? nodes[existingIndex] : createDraftNode()
    const nextNode: DraftNode = {
      ...existingNode,
      id: rest.length === 0 ? chapterId : existingNode.id,
      title: currentTitle,
      details: rest.length === 0 ? content : existingNode.details,
      collapsed: existingNode.collapsed ?? false,
      children: insertNode(existingNode.children, rest, chapterId, content),
    }

    if (existingIndex === -1) {
      return [...nodes, nextNode]
    }

    return nodes.map((node, index) => (index === existingIndex ? nextNode : node))
  }

  let tree: DraftNode[] = []

  for (const chapter of chapters) {
    const path = (chapter.path?.length ? chapter.path : chapter.title.split(' / '))
      .map((part) => part.trim())
      .filter(Boolean)

    if (!path.length) {
      continue
    }

    tree = insertNode(tree, path, chapter.id, chapter.content)
  }

  return tree.length ? tree : [createDraftNode()]
}

interface TreeNodeCardProps {
  node: DraftNode
  path: number[]
  onAddChild: (nodeId: string) => void
  onRemove: (nodeId: string) => void
  onToggle: (nodeId: string) => void
  onChangeTitle: (nodeId: string, value: string) => void
  onChangeDetails: (nodeId: string, value: string) => void
}

function TreeNodeCard({ node, path, onAddChild, onRemove, onToggle, onChangeTitle, onChangeDetails }: TreeNodeCardProps) {
  const numbering = path.join('.')
  const hasChildren = node.children.length > 0

  return (
    <div className="flex flex-col items-center">
      <article className="w-[320px] rounded-3xl border border-[#E8E0D2] bg-[#FFFDF8] p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[#1B5E20]">الفرع {numbering}</p>
            <p className="text-xs text-[#8D6E63]">كل ضغطة على + تضيف ابنًا واحدًا جديدًا تحت هذه العقدة</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onAddChild(node.id)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#1B5E20] text-lg font-bold text-white transition hover:bg-[#154a19]"
              aria-label="إضافة ابن"
              title="إضافة ابن"
            >
              +
            </button>

            {hasChildren ? (
              <button
                type="button"
                onClick={() => onToggle(node.id)}
                className="rounded-xl border border-[#1B5E20]/15 px-3 py-2 text-xs font-semibold text-[#1B5E20] transition hover:bg-[#1B5E20]/5"
              >
                {node.collapsed ? 'توسيع' : 'طي'}
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => onRemove(node.id)}
              className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50"
            >
              حذف
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block space-y-2 text-sm font-medium text-[#3E2723]">
            <span>اسم الفرع</span>
            <input
              value={node.title}
              onChange={(event) => onChangeTitle(node.id, event.target.value)}
              className="w-full rounded-2xl border border-[#D7CCC8] bg-white px-4 py-3 outline-none transition focus:border-[#1B5E20]"
              placeholder={`الفرع ${numbering}`}
            />
          </label>

          <label className="block space-y-2 text-sm font-medium text-[#3E2723]">
            <span>تفاصيل / محتوى</span>
            <textarea
              value={node.details}
              onChange={(event) => onChangeDetails(node.id, event.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-[#D7CCC8] bg-white px-4 py-3 outline-none transition focus:border-[#1B5E20]"
              placeholder="يمكنك كتابة وصف صغير أو النص الكامل لهذه الوحدة"
            />
          </label>
        </div>
      </article>

      {hasChildren && !node.collapsed ? (
        <div className="mt-4 flex w-full flex-col items-center">
          <div className="h-6 w-px bg-[#D7CCC8]" />
          <div className="w-full overflow-x-auto pb-4">
            <div className="relative inline-flex min-w-max flex-row-reverse items-start gap-6 px-6 pt-6">
              {node.children.length > 1 ? (
                <div className="absolute left-12 right-12 top-0 h-px bg-[#D7CCC8]" />
              ) : null}

              {node.children.map((child, index) => (
                <div
                  key={child.id}
                  className="relative pt-6 before:absolute before:right-1/2 before:top-0 before:h-6 before:w-px before:bg-[#D7CCC8]"
                >
                  <TreeNodeCard
                    node={child}
                    path={[...path, index + 1]}
                    onAddChild={onAddChild}
                    onRemove={onRemove}
                    onToggle={onToggle}
                    onChangeTitle={onChangeTitle}
                    onChangeDetails={onChangeDetails}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default function AdminBuilderPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const editingKitabId = searchParams.get('kitabId')?.trim() ?? ''
  const isEditingExisting = Boolean(editingKitabId)
  const initialDraft = useMemo(() => loadDraft(), [])

  const [kitabId, setKitabId] = useState(initialDraft.kitabId)
  const [title, setTitle] = useState(initialDraft.title)
  const [author, setAuthor] = useState(initialDraft.author)
  const [category, setCategory] = useState<KitabCategory>(initialDraft.category)
  const [level, setLevel] = useState<KitabLevel>(initialDraft.level)
  const [coverColor, setCoverColor] = useState(initialDraft.coverColor)
  const [description, setDescription] = useState(initialDraft.description)
  const [notes, setNotes] = useState(initialDraft.notes)
  const [tree, setTree] = useState<DraftNode[]>(initialDraft.tree)
  const [isLoadingExisting, setIsLoadingExisting] = useState(isEditingExisting)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!editingKitabId) {
      return
    }

    let active = true
    setIsLoadingExisting(true)

    getKitabWithChapters(editingKitabId)
      .then(({ kitab, chapters }) => {
        if (!active) {
          return
        }

        setKitabId(kitab.id)
        setTitle(kitab.title)
        setAuthor(kitab.author)
        setCategory(kitab.category)
        setLevel(kitab.level)
        setCoverColor(kitab.coverColor)
        setDescription(kitab.description)
        setNotes('')
        setTree(buildDraftTreeFromChapters(chapters))
      })
      .catch((error) => {
        console.error(error)
        toast.error('تعذر تحميل الكتاب المطلوب')
      })
      .finally(() => {
        if (active) {
          setIsLoadingExisting(false)
        }
      })

    return () => {
      active = false
    }
  }, [editingKitabId])

  useEffect(() => {
    const draft: BuilderDraft = {
      kitabId,
      title,
      author,
      category,
      level,
      coverColor,
      description,
      notes,
      tree,
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
  }, [author, category, coverColor, description, kitabId, level, notes, title, tree])

  const sections = useMemo(() => buildSectionsFromTree(tree), [tree])
  const generatedChapters = useMemo(() => flattenSections(sections), [sections])
  const totalNodes = useMemo(() => countNodes(tree), [tree])
  const maxDepth = useMemo(() => getMaxDepth(tree), [tree])
  const structureLabels = useMemo(
    () => Array.from({ length: Math.max(1, maxDepth) }, (_, index) => `المستوى ${index + 1}`),
    [maxDepth],
  )

  const generatedTreeJson = useMemo(
    () => ({
      name: title.trim(),
      details: description.trim(),
      meta: {
        kitabId: kitabId.trim(),
        author: author.trim(),
        category,
        level,
        coverColor,
        notes: notes.trim(),
      },
      children: sections,
    }),
    [author, category, coverColor, description, kitabId, level, notes, sections, title],
  )

  const generatedKitab = useMemo<KitabInput | null>(() => {
    const normalizedTitle = title.trim()
    const normalizedAuthor = author.trim()

    if (!normalizedTitle || !normalizedAuthor || generatedChapters.length === 0) {
      return null
    }

    return {
      id: kitabId.trim() || slugify(normalizedTitle, 'kitab'),
      title: normalizedTitle,
      author: normalizedAuthor,
      category,
      level,
      coverColor,
      description: [description.trim(), notes.trim()].filter(Boolean).join('\n\n'),
      chapters: generatedChapters,
      sections,
      sourceFormat: maxDepth > 1 ? 'hierarchical' : 'chapters',
      structureLabels,
    }
  }, [author, category, coverColor, description, generatedChapters, kitabId, level, maxDepth, notes, sections, structureLabels, title])

  function addRootNode() {
    setTree((current) => [...current, createDraftNode()])
  }

  function addChildNode(nodeId: string) {
    setTree((current) =>
      updateNodeTree(current, nodeId, (node) => ({
        ...node,
        collapsed: false,
        children: [...node.children, createDraftNode()],
      })),
    )
  }

  function removeNode(nodeId: string) {
    setTree((current) => {
      const nextTree = removeNodeTree(current, nodeId)
      return nextTree.length ? nextTree : [createDraftNode()]
    })
  }

  function toggleNode(nodeId: string) {
    setTree((current) => updateNodeTree(current, nodeId, (node) => ({ ...node, collapsed: !node.collapsed })))
  }

  function updateNodeTitle(nodeId: string, value: string) {
    setTree((current) => updateNodeTree(current, nodeId, (node) => ({ ...node, title: value })))
  }

  function updateNodeDetails(nodeId: string, value: string) {
    setTree((current) => updateNodeTree(current, nodeId, (node) => ({ ...node, details: value })))
  }

  function clearDraft() {
    const empty = createEmptyDraft()
    setKitabId(empty.kitabId)
    setTitle(empty.title)
    setAuthor(empty.author)
    setCategory(empty.category)
    setLevel(empty.level)
    setCoverColor(empty.coverColor)
    setDescription(empty.description)
    setNotes(empty.notes)
    setTree(empty.tree)
    localStorage.removeItem(STORAGE_KEY)
  }

  function restoreDraft() {
    const draft = loadDraft()
    setKitabId(draft.kitabId)
    setTitle(draft.title)
    setAuthor(draft.author)
    setCategory(draft.category)
    setLevel(draft.level)
    setCoverColor(draft.coverColor)
    setDescription(draft.description)
    setNotes(draft.notes)
    setTree(draft.tree)
    toast.success('تم تحميل المسودة المحلية')
  }

  async function handleSave() {
    if (!user?.uid) {
      toast.error('يجب تسجيل الدخول أولًا')
      return
    }

    if (!generatedKitab) {
      toast.error('أدخل عنوان الكتاب واسم المؤلف، ثم أضف على الأقل فرعًا واحدًا باسم ومحتوى')
      return
    }

    setIsSaving(true)

    try {
      await bulkImportKitabs([generatedKitab], user.uid)
      toast.success(`تم حفظ الكتاب: ${generatedKitab.title}`)
      navigate('/admin')
    } catch (error) {
      console.error(error)
      toast.error('تعذر حفظ الكتاب. حاول مرة أخرى')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-[#1B5E20]/15 bg-[#FDF6E3] p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[#1B5E20]">منشئ الشجرة الهرمية</p>
            <h1 className="font-['Amiri'] text-4xl font-bold text-[#1B5E20]">{isEditingExisting ? 'تعديل الكتاب عبر شجرة ديناميكية' : 'تنظيم الكتاب عبر شجرة ديناميكية'}</h1>
            <p className="max-w-3xl text-sm leading-7 text-[#6D4C41]">
              {isEditingExisting
                ? 'تم تحميل الكتاب القديم. يمكنك الآن تعديل الاسم أو الفروع أو المحتوى ثم حفظ التحديثات في نفس الكتاب.'
                : 'ابدأ باسم الكتاب وتفاصيله في الأعلى، ثم استخدم زر + لإضافة فرع واحد جديد في كل ضغطة. الآن الفروع تتمدّد أفقيًا لعرض أوضح للشجرة.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/admin" className="rounded-2xl border border-[#1B5E20]/20 px-4 py-2 text-sm font-semibold text-[#1B5E20] transition hover:bg-[#1B5E20]/5">الرجوع إلى الإدارة</Link>
            <button type="button" onClick={restoreDraft} className="rounded-2xl border border-[#1B5E20]/20 px-4 py-2 text-sm font-semibold text-[#1B5E20] transition hover:bg-[#1B5E20]/5">تحميل المسودة</button>
            <button type="button" onClick={clearDraft} className="rounded-2xl border border-[#6D4C41]/20 px-4 py-2 text-sm font-semibold text-[#6D4C41] transition hover:bg-white">مسح الكل</button>
          </div>
        </div>
      </header>

      <section className="rounded-3xl border border-[#1B5E20]/10 bg-white p-6 shadow-sm">
        {isLoadingExisting ? (
          <p className="mb-4 rounded-2xl border border-[#1B5E20]/15 bg-[#FDF6E3] px-4 py-3 text-sm text-[#1B5E20]">
            جارٍ تحميل الكتاب القديم...
          </p>
        ) : null}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-[#3E2723]">العقدة الجذرية: الكتاب</h2>
            <p className="text-sm text-[#6D4C41]">هذه هي قمة الشجرة، ومنها تتفرع جميع الفروع الأخرى.</p>
          </div>
          <button
            type="button"
            onClick={addRootNode}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#1B5E20] text-xl font-bold text-white transition hover:bg-[#154a19]"
            aria-label="إضافة فرع جديد"
            title="إضافة فرع جديد"
          >
            +
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-[#3E2723]"><span>اسم الكتاب</span><input value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded-2xl border border-[#D7CCC8] bg-[#FFFDF8] px-4 py-3 outline-none transition focus:border-[#1B5E20]" placeholder="مثل: صحيح البخاري" /></label>
          <label className="space-y-2 text-sm font-medium text-[#3E2723]"><span>اسم المؤلف</span><input value={author} onChange={(event) => setAuthor(event.target.value)} className="w-full rounded-2xl border border-[#D7CCC8] bg-[#FFFDF8] px-4 py-3 outline-none transition focus:border-[#1B5E20]" placeholder="مثل: الإمام البخاري" /></label>
          <label className="space-y-2 text-sm font-medium text-[#3E2723]"><span>معرّف الكتاب</span><input value={kitabId} onChange={(event) => setKitabId(event.target.value)} readOnly={isEditingExisting} className="w-full rounded-2xl border border-[#D7CCC8] bg-[#FFFDF8] px-4 py-3 outline-none transition focus:border-[#1B5E20]" placeholder="اتركه فارغًا ليُنشأ تلقائيًا" /></label>
          <label className="space-y-2 text-sm font-medium text-[#3E2723]"><span>لون الغلاف</span><div className="flex items-center gap-3 rounded-2xl border border-[#D7CCC8] bg-[#FFFDF8] px-4 py-3"><input value={coverColor} onChange={(event) => setCoverColor(event.target.value)} type="color" className="h-10 w-14 rounded-xl border-0 bg-transparent p-0" /><input value={coverColor} onChange={(event) => setCoverColor(event.target.value)} className="w-full bg-transparent outline-none" placeholder="#1B5E20" /></div></label>
          <label className="space-y-2 text-sm font-medium text-[#3E2723]"><span>التصنيف</span><select value={category} onChange={(event) => setCategory(event.target.value as KitabCategory)} className="w-full rounded-2xl border border-[#D7CCC8] bg-[#FFFDF8] px-4 py-3 outline-none transition focus:border-[#1B5E20]">{CATEGORY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
          <label className="space-y-2 text-sm font-medium text-[#3E2723]"><span>المستوى</span><select value={level} onChange={(event) => setLevel(event.target.value as KitabLevel)} className="w-full rounded-2xl border border-[#D7CCC8] bg-[#FFFDF8] px-4 py-3 outline-none transition focus:border-[#1B5E20]">{LEVEL_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
        </div>

        <label className="mt-4 block space-y-2 text-sm font-medium text-[#3E2723]"><span>تفاصيل / وصف الكتاب</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} className="w-full rounded-2xl border border-[#D7CCC8] bg-[#FFFDF8] px-4 py-3 outline-none transition focus:border-[#1B5E20]" placeholder="مثل: مجموعة أحاديث جمعها الإمام البخاري" /></label>
        <label className="mt-4 block space-y-2 text-sm font-medium text-[#3E2723]"><span>ملاحظات إضافية</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className="w-full rounded-2xl border border-[#D7CCC8] bg-[#FFFDF8] px-4 py-3 outline-none transition focus:border-[#1B5E20]" placeholder="أي ملاحظات تنظيمية أو وصفية إضافية" /></label>
      </section>

      <section className="rounded-3xl border border-[#1B5E20]/10 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#3E2723]">الفروع التابعة</h2>
            <p className="text-sm text-[#6D4C41]">الآن الشجرة أفقية: كل مستوى يتمدّد يمينًا ويسارًا بدل التكدس العمودي.</p>
          </div>
          <p className="text-xs font-semibold text-[#8D6E63]">يتم حفظ المسودة تلقائيًا في هذا المتصفح</p>
        </div>

        <div className="overflow-x-auto pb-6">
          <div className="inline-flex min-w-full flex-row-reverse items-start justify-center gap-6 px-4">
            {tree.map((node, index) => (
              <TreeNodeCard
                key={node.id}
                node={node}
                path={[index + 1]}
                onAddChild={addChildNode}
                onRemove={removeNode}
                onToggle={toggleNode}
                onChangeTitle={updateNodeTitle}
                onChangeDetails={updateNodeDetails}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-3xl border border-[#1B5E20]/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-[#3E2723]">ملخص الشجرة</h2>
          <div className="mt-4 space-y-3 text-sm text-[#6D4C41]">
            <p><span className="font-semibold text-[#3E2723]">عدد العقد:</span> {totalNodes}</p>
            <p><span className="font-semibold text-[#3E2723]">أقصى عمق:</span> {maxDepth}</p>
            <p><span className="font-semibold text-[#3E2723]">الوحدات القابلة للقراءة:</span> {generatedChapters.length}</p>
            <p><span className="font-semibold text-[#3E2723]">الحفظ المحلي:</span> تلقائي</p>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isLoadingExisting || !generatedKitab}
            className="mt-6 w-full rounded-2xl bg-[#1B5E20] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#154a19] disabled:cursor-not-allowed disabled:bg-[#A5B8A6]"
          >
            {isSaving ? 'جارٍ الحفظ...' : isEditingExisting ? 'تحديث الكتاب في Firestore' : 'حفظ الكتاب في Firestore'}
          </button>
        </section>

        <section className="rounded-3xl border border-[#1B5E20]/10 bg-[#1A1410] p-6 text-white shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Tree JSON</h2>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs">الجذر + الأبناء</span>
          </div>
          <pre className="mt-4 max-h-[24rem] overflow-auto rounded-2xl bg-black/20 p-4 text-xs leading-6 text-[#FDF6E3]" dir="ltr">
            {JSON.stringify(generatedTreeJson, null, 2)}
          </pre>
        </section>

        <section className="rounded-3xl border border-[#1B5E20]/10 bg-[#1A1410] p-6 text-white shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Firestore JSON</h2>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs">القارئ + الفصول</span>
          </div>
          <pre className="mt-4 max-h-[24rem] overflow-auto rounded-2xl bg-black/20 p-4 text-xs leading-6 text-[#FDF6E3]" dir="ltr">
            {generatedKitab ? JSON.stringify(generatedKitab, null, 2) : 'أدخل البيانات وأضف فرعًا واحدًا على الأقل مع محتوى'}
          </pre>
        </section>
      </section>
    </section>
  )
}







