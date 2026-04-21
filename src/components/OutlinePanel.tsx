import type { CSSProperties } from 'react'
import type { MarkdownOutlineItem } from '../types/editor'

type OutlinePanelProps = {
  title?: string
  outline: MarkdownOutlineItem[]
  activeSlug: string | null
  onSelect: (item: MarkdownOutlineItem) => void
  onClose?: () => void
}

export function OutlinePanel({
  title = '文档大纲',
  outline,
  activeSlug,
  onSelect,
  onClose,
}: OutlinePanelProps) {
  return (
    <aside className="outline-panel" aria-label="文档大纲">
      <div className="floating-panel__header">
        <div>
          <p className="eyebrow">结构导航</p>
          <h3>{title}</h3>
        </div>
        {onClose ? (
          <button type="button" className="close-button" onClick={onClose}>
            关闭
          </button>
        ) : null}
      </div>

      {outline.length === 0 ? (
        <div className="empty-state">当前文档还没有 # / ## / ### 标题。</div>
      ) : (
        <nav className="outline-list">
          {outline.map((item) => (
            <button
              key={item.slug}
              type="button"
              className={`outline-item ${
                activeSlug === item.slug ? 'outline-item--active' : ''
              }`}
              style={{ '--outline-depth': item.level } as CSSProperties}
              onClick={() => onSelect(item)}
            >
              <span className="outline-item__level">H{item.level}</span>
              <span>{item.text}</span>
            </button>
          ))}
        </nav>
      )}
    </aside>
  )
}
