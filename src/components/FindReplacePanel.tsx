type FindReplacePanelProps = {
  isOpen: boolean
  query: string
  replacement: string
  caseSensitive: boolean
  matchCount: number
  onChangeQuery: (value: string) => void
  onChangeReplacement: (value: string) => void
  onToggleCaseSensitive: () => void
  onFindNext: () => void
  onReplace: () => void
  onReplaceAll: () => void
  onClose: () => void
}

export function FindReplacePanel({
  isOpen,
  query,
  replacement,
  caseSensitive,
  matchCount,
  onChangeQuery,
  onChangeReplacement,
  onToggleCaseSensitive,
  onFindNext,
  onReplace,
  onReplaceAll,
  onClose,
}: FindReplacePanelProps) {
  if (!isOpen) {
    return null
  }

  return (
    <section className="floating-panel find-panel" aria-label="查找与替换">
      <div className="floating-panel__header">
        <div>
          <p className="eyebrow">查找工具</p>
          <h3>查找与替换</h3>
        </div>
        <button type="button" className="close-button" onClick={onClose}>
          关闭
        </button>
      </div>

      <div className="find-panel__grid">
        <label>
          查找
          <input
            value={query}
            onChange={(event) => onChangeQuery(event.target.value)}
            placeholder="输入要查找的内容"
          />
        </label>

        <label>
          替换为
          <input
            value={replacement}
            onChange={(event) => onChangeReplacement(event.target.value)}
            placeholder="输入替换内容"
          />
        </label>
      </div>

      <div className="find-panel__actions">
        <button type="button" className="ghost-button" onClick={onToggleCaseSensitive}>
          {caseSensitive ? '区分大小写：开' : '区分大小写：关'}
        </button>
        <span className="status-chip">匹配 {matchCount} 处</span>
        <button type="button" className="ghost-button" onClick={onFindNext}>
          查找下一个
        </button>
        <button type="button" className="ghost-button" onClick={onReplace}>
          替换当前
        </button>
        <button type="button" className="primary-button" onClick={onReplaceAll}>
          全部替换
        </button>
      </div>
    </section>
  )
}
