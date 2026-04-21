import type { LucideIcon } from 'lucide-react'

export type ToolbarAction = {
  id: string
  label: string
  shortcut?: string
  icon: LucideIcon
}

type ToolbarProps = {
  actions: ToolbarAction[]
  onAction: (actionId: string) => void
}

export function Toolbar({ actions, onAction }: ToolbarProps) {
  return (
    <div className="toolbar" role="toolbar" aria-label="Markdown 工具栏">
      {actions.map((action) => {
        const Icon = action.icon

        return (
          <button
            key={action.id}
            type="button"
            className="toolbar-button"
            title={
              action.shortcut ? `${action.label} · ${action.shortcut}` : action.label
            }
            aria-label={action.label}
            onClick={() => onAction(action.id)}
          >
            <Icon size={16} />
            <span>{action.label}</span>
          </button>
        )
      })}
    </div>
  )
}
