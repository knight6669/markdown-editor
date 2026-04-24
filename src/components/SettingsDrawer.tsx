import type { DraftSnapshot, EditorPreferences, ResolvedTheme } from '../types/editor'

type SettingsDrawerProps = {
  isOpen: boolean
  preferences: EditorPreferences
  resolvedTheme: ResolvedTheme
  history: DraftSnapshot[]
  onClose: () => void
  onChangePreferences: (patch: Partial<EditorPreferences>) => void
  onRestoreSnapshot: (snapshotId: string) => void
  onClearHistory: () => void
}

export function SettingsDrawer({
  isOpen,
  preferences,
  resolvedTheme,
  history,
  onClose,
  onChangePreferences,
  onRestoreSnapshot,
  onClearHistory,
}: SettingsDrawerProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div
      className="dialog-backdrop settings-backdrop"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <aside className="settings-drawer" role="dialog" aria-modal="true">
        <div className="floating-panel__header">
          <div>
            <p className="eyebrow">偏好设置</p>
            <h3>主题与编辑器</h3>
          </div>
          <button type="button" className="close-button" onClick={onClose}>
            关闭
          </button>
        </div>

        <section className="settings-section">
          <h4>显示模式</h4>
          <div className="segmented-control">
            {(['system', 'light', 'dark'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                className={`segment-button ${
                  preferences.themeMode === mode ? 'segment-button--active' : ''
                }`}
                onClick={() => onChangePreferences({ themeMode: mode })}
              >
                {mode === 'system'
                  ? `跟随系统（当前${resolvedTheme}）`
                  : mode === 'light'
                    ? '浅色'
                    : '深色'}
              </button>
            ))}
          </div>
        </section>

        <section className="settings-section">
          <h4>视觉与排版</h4>
          <label>
            正文字号
            <input
              type="range"
              min="14"
              max="20"
              value={preferences.fontSize}
              onChange={(event) =>
                onChangePreferences({ fontSize: Number(event.target.value) })
              }
            />
            <span className="status-chip">{preferences.fontSize}px</span>
          </label>

          <label>
            预览宽度
            <select
              value={preferences.previewWidth}
              onChange={(event) =>
                onChangePreferences({
                  previewWidth: event.target.value as EditorPreferences['previewWidth'],
                })
              }
            >
              <option value="narrow">紧凑阅读</option>
              <option value="comfortable">标准宽度</option>
              <option value="wide">宽屏文档</option>
              <option value="fluid">铺满容器</option>
            </select>
          </label>

          <label>
            代码字体
            <select
              value={preferences.codeFont}
              onChange={(event) =>
                onChangePreferences({
                  codeFont: event.target.value as EditorPreferences['codeFont'],
                })
              }
            >
              <option value="ibm-plex">IBM Plex Mono</option>
              <option value="jetbrains">JetBrains Mono</option>
              <option value="sfmono">SF Mono 风格</option>
            </select>
          </label>
        </section>

        <section className="settings-section">
          <h4>编辑习惯</h4>
          <label className="toggle-row">
            <span>自动换行</span>
            <input
              type="checkbox"
              checked={preferences.lineWrapping}
              onChange={() =>
                onChangePreferences({ lineWrapping: !preferences.lineWrapping })
              }
            />
          </label>

          <label className="toggle-row">
            <span>显示行号</span>
            <input
              type="checkbox"
              checked={preferences.lineNumbers}
              onChange={() =>
                onChangePreferences({ lineNumbers: !preferences.lineNumbers })
              }
            />
          </label>

          <label>
            桌面端默认视图
            <select
              value={preferences.desktopViewMode}
              onChange={(event) =>
                onChangePreferences({
                  desktopViewMode:
                    event.target.value as EditorPreferences['desktopViewMode'],
                })
              }
            >
              <option value="split">分屏</option>
              <option value="editor">编辑</option>
              <option value="preview">预览</option>
            </select>
          </label>

          <label>
            移动端默认视图
            <select
              value={preferences.mobileViewMode}
              onChange={(event) =>
                onChangePreferences({
                  mobileViewMode:
                    event.target.value as EditorPreferences['mobileViewMode'],
                })
              }
            >
              <option value="split">分屏</option>
              <option value="editor">编辑</option>
              <option value="preview">预览</option>
            </select>
          </label>
        </section>

        <section className="settings-section">
          <div className="settings-section__header">
            <div>
              <h4>草稿历史</h4>
              <p>保留最近几次自动或手动保存的快照，避免误删内容。</p>
            </div>
            <button type="button" className="ghost-button" onClick={onClearHistory}>
              清空历史
            </button>
          </div>

          {history.length === 0 ? (
            <div className="empty-state">还没有历史快照。</div>
          ) : (
            <div className="snapshot-list">
              {history.map((snapshot) => (
                <div key={snapshot.id} className="snapshot-item">
                  <div>
                    <strong>{snapshot.documentName}.md</strong>
                    <p>{formatSnapshotMeta(snapshot)}</p>
                    <code>{snapshot.markdown.slice(0, 72).replace(/\n/g, ' ')}</code>
                  </div>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => onRestoreSnapshot(snapshot.id)}
                  >
                    恢复
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </aside>
    </div>
  )
}

function formatSnapshotMeta(snapshot: DraftSnapshot) {
  const label =
    snapshot.reason === 'manual'
      ? '手动保存'
      : snapshot.reason === 'auto'
        ? '自动保存'
        : snapshot.reason === 'import'
          ? '导入文件'
          : snapshot.reason === 'reset'
            ? '重置示例'
            : '历史恢复'

  return `${label} · ${new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(snapshot.savedAt)}`
}
