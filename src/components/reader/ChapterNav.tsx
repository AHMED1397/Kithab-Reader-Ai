import { useEffect, useMemo, useState } from 'react'
import type { ChapterMetadata } from '../../types/kitab'

interface ChapterNavProps {
  chapters: ChapterMetadata[]
  currentChapterId: string
  collapsed: boolean
  onToggle: () => void
  onSelect: (chapterId: string) => void
}

interface TocNode {
  key: string
  title: string
  chapterId?: string
  children: TocNode[]
}

function buildTocTree(chapters: ChapterMetadata[]) {
  const root: TocNode[] = []

  for (const chapter of chapters) {
    const path = (chapter.path?.length ? chapter.path : chapter.title.split(' / '))
      .map((part) => part.trim())
      .filter(Boolean)

    if (!path.length) {
      continue
    }

    let level = root
    let currentKey = ''

    path.forEach((title, index) => {
      currentKey = currentKey ? `${currentKey}__${title}` : title
      const existing = level.find((node) => node.key === currentKey)

      if (existing) {
        if (index === path.length - 1) {
          existing.chapterId = chapter.id
        }
        level = existing.children
        return
      }

      const nextNode: TocNode = {
        key: currentKey,
        title,
        chapterId: index === path.length - 1 ? chapter.id : undefined,
        children: [],
      }

      level.push(nextNode)
      level = nextNode.children
    })
  }

  return root
}

function findExpandedKeys(nodes: TocNode[], targetId: string, trail: string[] = []): string[] {
  for (const node of nodes) {
    const nextTrail = [...trail, node.key]

    if (node.chapterId === targetId) {
      return trail
    }

    if (node.children.length) {
      const childTrail = findExpandedKeys(node.children, targetId, nextTrail)
      if (childTrail.length) {
        return childTrail
      }
    }
  }

  return []
}

interface TocItemProps {
  node: TocNode
  depth: number
  currentChapterId: string
  expandedKeys: string[]
  onToggleExpand: (key: string) => void
  onSelect: (chapterId: string) => void
}

function TocItem({
  node,
  depth,
  currentChapterId,
  expandedKeys,
  onToggleExpand,
  onSelect,
}: TocItemProps) {
  const isExpanded = expandedKeys.includes(node.key)
  const hasChildren = node.children.length > 0
  const isActive = node.chapterId === currentChapterId

  return (
    <div className="space-y-2">
      <div
        className={`flex items-center gap-2 rounded-xl border px-2 py-2 transition ${
          isActive
            ? 'border-[#1B5E20] bg-[#1B5E20]/10 text-[#1B5E20]'
            : 'border-[#1B5E20]/15 bg-white text-[#5D4037] hover:bg-[#F9A825]/10'
        }`}
        style={{ marginRight: `${depth * 12}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggleExpand(node.key)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#1B5E20]/15 text-sm font-bold text-[#1B5E20] transition hover:bg-[#1B5E20]/5"
            aria-label={isExpanded ? 'إخفاء الفروع' : 'إظهار الفروع'}
            title={isExpanded ? 'إخفاء الفروع' : 'إظهار الفروع'}
          >
            {isExpanded ? '▾' : '▸'}
          </button>
        ) : (
          <span className="flex h-8 w-8 items-center justify-center text-xs text-[#B08968]">•</span>
        )}

        <button
          type="button"
          onClick={() => {
            if (node.chapterId) {
              onSelect(node.chapterId)
            } else if (hasChildren) {
              onToggleExpand(node.key)
            }
          }}
          className={`flex-1 text-right text-sm ${isActive ? 'font-semibold' : ''}`}
        >
          {node.title}
        </button>
      </div>

      {hasChildren && isExpanded ? (
        <div className="space-y-2 border-r border-[#1B5E20]/10 pr-2">
          {node.children.map((child) => (
            <TocItem
              key={child.key}
              node={child}
              depth={depth + 1}
              currentChapterId={currentChapterId}
              expandedKeys={expandedKeys}
              onToggleExpand={onToggleExpand}
              onSelect={onSelect}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default function ChapterNav({
  chapters,
  currentChapterId,
  collapsed,
  onToggle,
  onSelect,
}: ChapterNavProps) {
  const tocTree = useMemo(() => buildTocTree(chapters), [chapters])
  const [expandedKeys, setExpandedKeys] = useState<string[]>([])

  useEffect(() => {
    const keysToExpand = findExpandedKeys(tocTree, currentChapterId)
    if (!keysToExpand.length) {
      return
    }

    setExpandedKeys((current) => Array.from(new Set([...current, ...keysToExpand])))
  }, [tocTree, currentChapterId])

  const toggleExpand = (key: string) => {
    setExpandedKeys((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    )
  }

  return (
    <aside className={`rounded-2xl border border-[#1B5E20]/20 bg-[#FDF6E3] p-3 shadow-sm ${collapsed ? 'w-full' : 'w-full lg:w-[320px]'}`}>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-bold text-[#1B5E20]">الفهرس</h3>
        <button
          type="button"
          onClick={onToggle}
          className="rounded-lg border border-[#1B5E20]/30 px-2 py-1 text-xs font-semibold text-[#1B5E20]"
        >
          {collapsed ? 'إظهار' : 'إخفاء'}
        </button>
      </div>

      {!collapsed ? (
        <div className="max-h-[65vh] space-y-2 overflow-auto pr-1">
          {tocTree.map((node) => (
            <TocItem
              key={node.key}
              node={node}
              depth={0}
              currentChapterId={currentChapterId}
              expandedKeys={expandedKeys}
              onToggleExpand={toggleExpand}
              onSelect={onSelect}
            />
          ))}
        </div>
      ) : null}
    </aside>
  )
}
