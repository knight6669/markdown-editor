import { useEffect, useMemo, useRef, useState } from 'react'
import type { CommandPaletteItem } from '../types/editor'

type CommandPaletteProps = {
  commands: CommandPaletteItem[]
  onClose: () => void
}

export function CommandPalette({ commands, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const filteredCommands = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) {
      return commands
    }

    return commands.filter((command) =>
      [command.title, command.description, ...command.keywords]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery),
    )
  }, [commands, query])

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <section
        className="palette-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="palette-title"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            onClose()
          }

          if (event.key === 'ArrowDown') {
            event.preventDefault()
            setActiveIndex((current) =>
              Math.min(current + 1, Math.max(filteredCommands.length - 1, 0)),
            )
          }

          if (event.key === 'ArrowUp') {
            event.preventDefault()
            setActiveIndex((current) => Math.max(current - 1, 0))
          }

          if (event.key === 'Enter') {
            const activeCommand = filteredCommands[activeIndex]
            if (activeCommand) {
              activeCommand.run()
              onClose()
            }
          }
        }}
      >
        <div className="floating-panel__header">
          <div>
            <p className="eyebrow">命令面板</p>
            <h3 id="palette-title">快速执行操作</h3>
          </div>
          <button type="button" className="close-button" onClick={onClose}>
            关闭
          </button>
        </div>

        <label className="palette-search">
          <span className="sr-only">搜索命令</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setActiveIndex(0)
            }}
            placeholder="搜索导出、设置、插入表格、重置草稿……"
          />
        </label>

        <div className="palette-list" role="listbox" aria-label="命令结果">
          {filteredCommands.length === 0 ? (
            <div className="empty-state">没有找到匹配的命令。</div>
          ) : (
            filteredCommands.map((command, index) => (
              <button
                key={command.id}
                type="button"
                className={`palette-item ${
                  index === activeIndex ? 'palette-item--active' : ''
                }`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => {
                  command.run()
                  onClose()
                }}
              >
                <div>
                  <strong>{command.title}</strong>
                  <p>{command.description}</p>
                </div>
                <div className="palette-meta">
                  <span>{command.group}</span>
                  {command.shortcut ? <kbd>{command.shortcut}</kbd> : null}
                </div>
              </button>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
