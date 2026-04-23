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
        const isHeadingAction =
          action.id === 'h1' || action.id === 'h2' || action.id === 'h3'

        return (
          <button
            key={action.id}
            type="button"
            className={`toolbar-button ${
              isHeadingAction ? 'toolbar-button--heading' : ''
            }`}
            title={
              action.shortcut ? `${action.label} · ${action.shortcut}` : action.label
            }
            aria-label={action.label}
            onClick={() => onAction(action.id)}
          >
            {isHeadingAction ? (
              <span className="toolbar-button__heading-label">{action.label}</span>
            ) : (
              <>
                <Icon size={16} />
                <span>{action.label}</span>
              </>
            )}
          </button>
        )
      })}
    </div>
  )
}
