import {
  type ChangeEvent,
  type CSSProperties,
  type DragEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import type { EditorView } from '@codemirror/view'
import {
  Bold,
  ChevronDown,
  ChevronUp,
  Code2,
  Download,
  Eye,
  FileCode2,
  FileUp,
  Focus,
  Heading1,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  ListTodo,
  Maximize2,
  Minus,
  NotebookPen,
  Pencil,
  Printer,
  Quote,
  RotateCcw,
  Search,
  Settings2,
  SquareTerminal,
  Strikethrough,
  Table2,
} from 'lucide-react'
import './App.css'
import { CommandPalette } from './components/CommandPalette'
import { FindReplacePanel } from './components/FindReplacePanel'
import { InsertDialog } from './components/InsertDialog'
import { OutlinePanel } from './components/OutlinePanel'
import { SettingsDrawer } from './components/SettingsDrawer'
import { Toolbar, type ToolbarAction } from './components/Toolbar'
import {
  AUTOSAVE_INTERVAL,
  CODE_FONT_STACKS,
  DEFAULT_DOCUMENT_NAME,
  DEFAULT_MARKDOWN,
  DEFAULT_SPLIT_RATIO,
  MAX_DESKTOP_RATIO,
  MAX_MOBILE_RATIO,
  MIN_DESKTOP_RATIO,
  MIN_MOBILE_RATIO,
  MOBILE_BREAKPOINT,
  PREVIEW_WIDTH_VALUES,
  SAVE_STATUS_LABELS,
} from './lib/constants'
import {
  copyTextToClipboard,
  detectImageUrl,
  downloadTextFile,
  isImageFile,
  isLikelyUrl,
  isMarkdownFile,
  normalizeDocumentName,
  openPrintWindow,
  readFileAsDataUrl,
  readTextFile,
} from './lib/file'
import { saveImageAssetDataUrl } from './lib/image-assets'
import {
  getSearchMatchCount,
  getSelectedEditorText,
  insertCodeBlock,
  insertHeading,
  insertHorizontalRule,
  insertImage,
  insertLink,
  insertOrderedList,
  insertQuote,
  insertTableTemplate,
  insertTaskList,
  insertUnorderedList,
  replaceAllMatches,
  replaceCurrentMatch,
  scrollEditorToLine,
  selectSearchMatch,
  wrapEditorSelection,
} from './lib/editor'
import { countSearchMatches } from './lib/editor-transforms'
import {
  PREVIEW_CONTENT_CSS,
  buildStandaloneHtml,
  countDocumentStats,
} from './lib/markdown'
import {
  collectPreviewAnchors,
  findPreviewAnchorForLine,
  getPreviewTargetTopForLine,
  getActiveOutlineSlug,
  scrollPreviewAnchorIntoView,
  scrollPreviewHeadingIntoView,
} from './lib/preview-sync'
import { useCodeMirrorEditor } from './hooks/useCodeMirrorEditor'
import { useDraftHistory } from './hooks/useDraftHistory'
import { useEditorPreferences } from './hooks/useEditorPreferences'
import { useFullscreen } from './hooks/useFullscreen'
import { useMarkdownPreview } from './hooks/useMarkdownPreview'
import { useMediaQuery } from './hooks/useMediaQuery'
import type {
  CommandPaletteItem,
  InsertDialogState,
  MarkdownOutlineItem,
  SaveStatus,
} from './types/editor'

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  { id: 'h1', label: 'H1', icon: Heading1 },
  { id: 'h2', label: 'H2', icon: Heading2 },
  { id: 'h3', label: 'H3', icon: Heading3 },
  { id: 'bold', label: '粗体', icon: Bold, shortcut: 'Ctrl/Cmd + B' },
  { id: 'italic', label: '斜体', icon: Italic, shortcut: 'Ctrl/Cmd + I' },
  { id: 'strike', label: '删除线', icon: Strikethrough },
  { id: 'link', label: '链接', icon: Link2, shortcut: 'Ctrl/Cmd + K' },
  { id: 'image', label: '图片', icon: ImagePlus },
  { id: 'ul', label: '无序列表', icon: List },
  {
    id: 'ol',
    label: '有序列表',
    icon: ListOrdered,
    shortcut: 'Ctrl/Cmd + Shift + 7',
  },
  { id: 'task', label: '任务列表', icon: ListTodo },
  { id: 'code-block', label: '代码块', icon: Code2 },
  {
    id: 'inline-code',
    label: '行内代码',
    icon: Code2,
    shortcut: 'Ctrl/Cmd + Shift + C',
  },
  { id: 'quote', label: '引用', icon: Quote },
  { id: 'rule', label: '分割线', icon: Minus },
  { id: 'table', label: '表格', icon: Table2 },
]

function App() {
  const appShellRef = useRef<HTMLDivElement | null>(null)
  const workspaceRef = useRef<HTMLDivElement | null>(null)
  const previewScrollRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const syncSourceRef = useRef<'outline' | null>(null)
  const syncTimeoutRef = useRef<number | null>(null)
  const previewFollowFrameRef = useRef<number | null>(null)
  const previewFollowTargetRef = useRef<number | null>(null)
  const previewSyncModeRef = useRef<'selection' | 'scroll'>('selection')
  const dragCounterRef = useRef(0)
  const savePayloadRef = useRef({
    markdown: DEFAULT_MARKDOWN,
    documentName: DEFAULT_DOCUMENT_NAME,
    dirty: false,
  })
  const persistDraftRef = useRef<
    ReturnType<typeof useDraftHistory>['persistDraft'] | null
  >(null)
  const editorBridgeRef = useRef<EditorView | null>(null)

  const isMobile = useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')
  const { preferences, updatePreferences } = useEditorPreferences()
  const { draftStore, persistDraft, restoreSnapshot, wipeHistory } =
    useDraftHistory()
  const initialDraft = draftStore.current
  const [markdownText, setMarkdownText] = useState(
    () => initialDraft?.markdown ?? DEFAULT_MARKDOWN,
  )
  const [documentName, setDocumentName] = useState(
    () => initialDraft?.documentName ?? DEFAULT_DOCUMENT_NAME,
  )
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(() =>
    initialDraft ? 'restored' : 'ready',
  )
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(
    () => initialDraft?.savedAt ?? null,
  )
  const [isDirty, setIsDirty] = useState(false)
  const [splitRatio, setSplitRatio] = useState(DEFAULT_SPLIT_RATIO)
  const [isDraggingSplitter, setIsDraggingSplitter] = useState(false)
  const [insertDialog, setInsertDialog] = useState<InsertDialogState>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [isFindPanelOpen, setIsFindPanelOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [replacementText, setReplacementText] = useState('')
  const [isCaseSensitive, setIsCaseSensitive] = useState(false)
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [isDropActive, setIsDropActive] = useState(false)
  const [isToolbarVisible, setIsToolbarVisible] = useState(false)
  const [activeSourceLine, setActiveSourceLine] = useState(1)
  const [sourceSelectionRevision, setSourceSelectionRevision] = useState(0)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isMobileOutlineOpen, setIsMobileOutlineOpen] = useState(false)

  const resolvedTheme =
    preferences.themeMode === 'system'
      ? prefersDark
        ? 'dark'
        : 'light'
      : preferences.themeMode

  const renderedDocument = useMarkdownPreview(markdownText)
  const stats = countDocumentStats(markdownText, preferences.wordGoal)
  const activeOutlineSlug = getActiveOutlineSlug(
    renderedDocument.outline,
    activeSourceLine,
  )

  const mobileViewMode = isMobile ? preferences.mobileViewMode : 'split'
  const showEditorPanel = !isMobile || mobileViewMode !== 'preview'
  const showPreviewPanel = !isMobile || mobileViewMode !== 'editor'
  const showSplitter =
    (!isMobile && showEditorPanel && showPreviewPanel) ||
    (isMobile && mobileViewMode === 'split')
  const isSyncEnabled = showEditorPanel && showPreviewPanel

  const openLinkDialog = useCallback(() => {
    const selectedText = editorBridgeRef.current
      ? getSelectedEditorText(editorBridgeRef.current)
      : ''

    setInsertDialog({
      mode: 'link',
      text: selectedText || '閾炬帴鏂囧瓧',
      url: 'https://',
    })
  }, [])

  const openFindPanel = useCallback(() => {
    if (!searchQuery && editorBridgeRef.current) {
      const selectedText = getSelectedEditorText(editorBridgeRef.current)
      if (selectedText) {
        setSearchQuery(selectedText)
      }
    }

    setIsFindPanelOpen(true)
    setIsCommandPaletteOpen(false)
  }, [searchQuery])

  const openCommandPalette = useCallback(() => {
    setIsCommandPaletteOpen(true)
    setIsSettingsOpen(false)
  }, [])

  const stopPreviewFollowAnimation = useCallback(() => {
    if (previewFollowFrameRef.current !== null) {
      window.cancelAnimationFrame(previewFollowFrameRef.current)
      previewFollowFrameRef.current = null
    }

    previewFollowTargetRef.current = null
  }, [])

  const animatePreviewFollowTo = useCallback(
    (container: HTMLElement, targetTop: number) => {
      previewFollowTargetRef.current = targetTop

      if (previewFollowFrameRef.current !== null) {
        return
      }

      const tick = () => {
        const nextTarget = previewFollowTargetRef.current
        if (nextTarget === null) {
          previewFollowFrameRef.current = null
          return
        }

        const delta = nextTarget - container.scrollTop
        if (Math.abs(delta) < 0.6) {
          container.scrollTop = nextTarget
          previewFollowFrameRef.current = null
          return
        }

        container.scrollTop += delta * 0.22
        previewFollowFrameRef.current = window.requestAnimationFrame(tick)
      }

      previewFollowFrameRef.current = window.requestAnimationFrame(tick)
    },
    [],
  )

  const updateSyncedSourceLine = useCallback((
    lineNumber: number,
    mode: 'selection' | 'scroll' = 'selection',
  ) => {
    previewSyncModeRef.current = mode
    setActiveSourceLine(lineNumber)
    setSourceSelectionRevision((current) => current + 1)
  }, [])

  const saveNow = () => {
    persistCurrentDraft('manual')
  }

  const { hostRef, editorView, focusEditor } = useCodeMirrorEditor({
    markdownText,
    lineWrapping: preferences.lineWrapping,
    resolvedTheme,
    onChange: (nextMarkdown) => {
      setMarkdownText(nextMarkdown)
      setIsDirty(true)
      setSaveStatus('editing')
    },
    onFocus: () => {
      setSaveStatus((current) => (current === 'editing' ? current : 'editing'))
    },
    onOpenLinkDialog: openLinkDialog,
    onOpenCommandPalette: openCommandPalette,
    onOpenFindPanel: openFindPanel,
    onSave: saveNow,
    onActiveLineChange: (lineNumber) =>
      updateSyncedSourceLine(lineNumber, 'selection'),
    onVisibleLineChange: (lineNumber) =>
      updateSyncedSourceLine(lineNumber, 'scroll'),
  })

  const { isFullscreen, toggleFullscreen } = useFullscreen(appShellRef)

  useEffect(() => {
    editorBridgeRef.current = editorView
  }, [editorView])

  useEffect(() => {
    persistDraftRef.current = persistDraft
  }, [persistDraft])

  useEffect(() => {
    savePayloadRef.current = {
      markdown: markdownText,
      documentName,
      dirty: isDirty,
    }
  }, [documentName, isDirty, markdownText])

  useEffect(() => {
    document.title = 'Knight Markdown Studio'

    const root = document.documentElement
    root.dataset.theme = resolvedTheme
    root.style.setProperty('--editor-font-size', `${preferences.fontSize}px`)
    root.style.setProperty(
      '--preview-content-width',
      PREVIEW_WIDTH_VALUES[preferences.previewWidth],
    )
    root.style.setProperty(
      '--app-code-font',
      CODE_FONT_STACKS[preferences.codeFont],
    )
  }, [
    preferences.codeFont,
    preferences.fontSize,
    preferences.previewWidth,
    resolvedTheme,
  ])

  useEffect(() => {
    if (!toastMessage) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setToastMessage(null)
    }, 2600)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [toastMessage])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const payload = savePayloadRef.current
      if (!payload.dirty) {
        return
      }

      try {
        const nextStore = persistDraftRef.current?.({
          markdown: payload.markdown,
          documentName: payload.documentName,
          reason: 'auto',
        })

        if (!nextStore?.current) {
          return
        }

        setIsDirty(false)
        setLastSavedAt(nextStore.current.savedAt)
        setSaveStatus('saved')
      } catch {
        setSaveStatus('failed')
        setToastMessage('保存失败，请检查浏览器的本地存储容量。')
      }
    }, AUTOSAVE_INTERVAL)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    const handleBeforeUnload = () => {
      const payload = savePayloadRef.current
      if (!payload.dirty) {
        return
      }

      persistDraftRef.current?.({
        markdown: payload.markdown,
        documentName: payload.documentName,
        reason: 'auto',
      })
    }

    window.addEventListener('pagehide', handleBeforeUnload)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('pagehide', handleBeforeUnload)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  useEffect(() => {
    return () => {
      stopPreviewFollowAnimation()
    }
  }, [stopPreviewFollowAnimation])

  useEffect(() => {
    if (
      !isSyncEnabled ||
      syncSourceRef.current === 'outline' ||
      !previewScrollRef.current
    ) {
      stopPreviewFollowAnimation()
      return
    }

    const previewNode = previewScrollRef.current
    const frameId = window.requestAnimationFrame(() => {
      const previewAnchors = collectPreviewAnchors(previewNode)
      if (previewSyncModeRef.current === 'scroll') {
        const targetTop = getPreviewTargetTopForLine(
          previewNode,
          previewAnchors,
          activeSourceLine,
        )

        if (targetTop !== null) {
          animatePreviewFollowTo(previewNode, targetTop)
        }
        return
      }

      stopPreviewFollowAnimation()
      const anchor = findPreviewAnchorForLine(
        previewAnchors,
        activeSourceLine,
      )
      if (!anchor) {
        return
      }

      scrollPreviewAnchorIntoView(previewNode, anchor)
    })

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [
    activeSourceLine,
    animatePreviewFollowTo,
    isSyncEnabled,
    renderedDocument.html,
    sourceSelectionRevision,
    stopPreviewFollowAnimation,
  ])

  useEffect(() => {
    if (!isDraggingSplitter) {
      return
    }

    const handlePointerMove = (event: PointerEvent) => {
      const workspace = workspaceRef.current
      if (!workspace) {
        return
      }

      const bounds = workspace.getBoundingClientRect()
      const minRatio = isMobile ? MIN_MOBILE_RATIO : MIN_DESKTOP_RATIO
      const maxRatio = isMobile ? MAX_MOBILE_RATIO : MAX_DESKTOP_RATIO

      const nextRatio = isMobile
        ? ((event.clientY - bounds.top) / bounds.height) * 100
        : ((event.clientX - bounds.left) / bounds.width) * 100

      setSplitRatio(Math.min(maxRatio, Math.max(minRatio, nextRatio)))
    }

    const stopDragging = () => {
      setIsDraggingSplitter(false)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', stopDragging)
    window.addEventListener('pointercancel', stopDragging)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', stopDragging)
      window.removeEventListener('pointercancel', stopDragging)
    }
  }, [isDraggingSplitter, isMobile])

  useEffect(() => {
    const handleWindowKeyDown = (event: KeyboardEvent) => {
      const isModifierPressed = event.metaKey || event.ctrlKey

      if (isModifierPressed && event.key.toLowerCase() === 'p') {
        event.preventDefault()
        openCommandPalette()
      }

      if (isModifierPressed && event.key.toLowerCase() === 'f') {
        event.preventDefault()
        openFindPanel()
      }

      if (event.key === 'Escape') {
        setIsCommandPaletteOpen(false)
        setIsSettingsOpen(false)
        setIsFindPanelOpen(false)
        setIsMobileOutlineOpen(false)
      }
    }

    window.addEventListener('keydown', handleWindowKeyDown)
    return () => {
      window.removeEventListener('keydown', handleWindowKeyDown)
    }
  }, [openCommandPalette, openFindPanel])

  const searchMatchCount = editorView
    ? getSearchMatchCount(editorView, searchQuery, {
        caseSensitive: isCaseSensitive,
      })
    : countSearchMatches(markdownText, searchQuery, {
        caseSensitive: isCaseSensitive,
      })

  const workspaceGridStyle = getWorkspaceGridStyle({
    isMobile,
    splitRatio,
    showEditorPanel,
    showPreviewPanel,
  })

  const commandItems: CommandPaletteItem[] = [
    {
      id: 'save',
      title: '立即保存',
      description: '把当前内容保存为最新草稿，并写入历史快照。',
      shortcut: 'Ctrl/Cmd + S',
      group: '文件',
      keywords: ['保存', '草稿', 'history', 'snapshot'],
      run: saveNow,
    },
    {
      id: 'import',
      title: '导入 Markdown',
      description: '读取本地 .md 文件并替换当前编辑内容。',
      group: '文件',
      keywords: ['导入', 'markdown', 'file'],
      run: () => fileInputRef.current?.click(),
    },
    {
      id: 'export-md',
      title: '导出 Markdown',
      description: '将当前源码另存为 .md 文件。',
      group: '文件',
      keywords: ['导出', 'download', 'markdown'],
      run: handleExportMarkdown,
    },
    {
      id: 'export-html',
      title: '导出 HTML',
      description: '导出包含样式的独立 HTML 文件。',
      group: '文件',
      keywords: ['html', 'standalone', 'export'],
      run: handleExportHtml,
    },
    {
      id: 'copy-html',
      title: '复制 HTML',
      description: '复制与导出一致的完整 HTML 文档到剪贴板。',
      group: '文件',
      keywords: ['copy', 'html', 'clipboard'],
      run: handleCopyHtml,
    },
    {
      id: 'export-pdf',
      title: '导出 PDF / 打印',
      description: '打开打印窗口，可直接保存为 PDF。',
      group: '文件',
      keywords: ['pdf', 'print'],
      run: handleExportPdf,
    },
    {
      id: 'toggle-focus',
      title: isFocusMode ? '退出专注模式' : '进入专注模式',
      description: '切换更沉浸的编辑界面。',
      group: '视图',
      keywords: ['focus', 'zen', '专注'],
      run: () => setIsFocusMode((current) => !current),
    },
    {
      id: 'toggle-fullscreen',
      title: isFullscreen ? '退出全屏' : '进入全屏',
      description: '切换浏览器全屏模式。',
      group: '视图',
      keywords: ['fullscreen', 'max'],
      run: () => {
        void toggleFullscreen()
      },
    },
    {
      id: 'toggle-wrap',
      title: preferences.lineWrapping ? '关闭自动换行' : '开启自动换行',
      description: '切换编辑器源码是否自动折行显示。',
      group: '视图',
      keywords: ['wrap', 'line'],
      run: () =>
        updatePreferences({ lineWrapping: !preferences.lineWrapping }),
    },
    {
      id: 'toggle-lines',
      title: preferences.lineNumbers ? '隐藏行号' : '显示行号',
      description: '切换编辑器左侧的行号栏。',
      group: '视图',
      keywords: ['line numbers', 'gutter'],
      run: () =>
        updatePreferences({ lineNumbers: !preferences.lineNumbers }),
    },
    {
      id: 'find-replace',
      title: '打开查找替换',
      description: '在当前文档中查找、替换并统计匹配结果。',
      shortcut: 'Ctrl/Cmd + F',
      group: '编辑',
      keywords: ['search', 'replace'],
      run: openFindPanel,
    },
    {
      id: 'open-settings',
      title: '打开设置',
      description: '调整主题、字号、预览宽度、代码字体和历史快照。',
      group: '设置',
      keywords: ['theme', 'settings', 'preferences'],
      run: () => setIsSettingsOpen(true),
    },
    {
      id: 'reset-document',
      title: '恢复默认示例',
      description: '清空当前工作区并恢复默认示例内容，同时保留历史快照。',
      group: '设置',
      keywords: ['reset', 'default', 'example', '草稿'],
      run: handleResetDocument,
    },
    ...TOOLBAR_ACTIONS.map((action) => ({
      id: `toolbar-${action.id}`,
      title: `插入 ${action.label}`,
      description: `执行工具栏动作：${action.label}。`,
      shortcut: action.shortcut,
      group: '格式',
      keywords: ['toolbar', 'insert', action.label],
      run: () => runToolbarAction(action.id),
    })),
  ]

  return (
    <>
      <style>{PREVIEW_CONTENT_CSS}</style>
      <input
        ref={fileInputRef}
        className="hidden-file-input"
        type="file"
        accept=".md,text/markdown"
        onChange={handleImportedFile}
      />

      <div
        ref={appShellRef}
        className={`app-shell ${isFocusMode ? 'app-shell--focus' : ''}`}
      >
        {isDropActive ? (
          <div className="drop-overlay" role="presentation">
            <div className="drop-overlay__card">
              <p className="eyebrow">拖拽导入</p>
              <strong>释放以导入 Markdown 或插入图片</strong>
            </div>
          </div>
        ) : null}

        {!isFocusMode ? (
          <header className="topbar">
            <div className="brand-block">
              <div className="brand-mark" aria-hidden="true">
                <NotebookPen size={18} />
              </div>
              <div className="brand-copy">
                <p className="eyebrow brand-eyebrow">
                  Markdown Workspace | Markdown 编辑工作台
                </p>
                <h1 className="brand-title" aria-label="Knight Markdown Studio">
                  <span>Knight Markdown Studio</span>
                </h1>
              </div>
            </div>

            <div className="header-meta">
              <div className="hint-strip" aria-label="快捷键提示">
                <span>⌘/Ctrl + B 粗体</span>
                <span>⌘/Ctrl + I 斜体</span>
                <span>⌘/Ctrl + F 查找</span>
                <span>⌘/Ctrl + P 命令面板</span>
              </div>

              <div className="header-actions">
                <button type="button" className="ghost-button" onClick={saveNow}>
                  <Download size={16} />
                  保存
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileUp size={16} />
                  导入
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={handleExportMarkdown}
                >
                  <Download size={16} />
                  导出 MD
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={handleExportHtml}
                >
                  <FileCode2 size={16} />
                  导出 HTML
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={handleExportPdf}
                >
                  <Printer size={16} />
                  PDF / 打印
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={openFindPanel}
                >
                  <Search size={16} />
                  查找替换
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={openCommandPalette}
                >
                  <SquareTerminal size={16} />
                  命令面板
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => setIsSettingsOpen(true)}
                >
                  <Settings2 size={16} />
                  设置
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={handleResetDocument}
                >
                  <RotateCcw size={16} />
                  重置示例
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => setIsFocusMode((current) => !current)}
                >
                  <Focus size={16} />
                  {isFocusMode ? '退出专注' : '专注模式'}
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => {
                    void toggleFullscreen()
                  }}
                >
                  <Maximize2 size={16} />
                  {isFullscreen ? '退出全屏' : '全屏'}
                </button>
              </div>
            </div>
          </header>
        ) : null}

        <main className={`app-main ${isFocusMode ? 'app-main--focus' : ''}`}>
          {!isMobile && !isFocusMode ? (
            <OutlinePanel
              outline={renderedDocument.outline}
              activeSlug={activeOutlineSlug}
              onSelect={handleSelectOutlineItem}
            />
          ) : null}

          <section
            className="workspace-card"
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="workspace-summary">
              <div>
                <p className="eyebrow">当前文档</p>
                <strong>{documentName}.md</strong>
                {saveStatus === 'ready' ? null : (
                  <p className="workspace-summary__caption">
                    {SAVE_STATUS_LABELS[saveStatus]}
                  </p>
                )}
              </div>

              <div className="workspace-stats">
                <span>{resolvedTheme === 'dark' ? '深色主题' : '浅色主题'}</span>
                <span>{stats.characters} 字符</span>
                <span>{stats.lines} 行</span>
                {renderedDocument.outline.length > 0 ? (
                  <span>{renderedDocument.outline.length} 个大纲节点</span>
                ) : null}
              </div>
            </div>

            <div className="workspace-body">
              {isMobile ? (
                <div className="mobile-toolbar">
                  <div className="segmented-control">
                    {(['editor', 'preview', 'split'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        className={`segment-button ${
                          preferences.mobileViewMode === mode
                            ? 'segment-button--active'
                            : ''
                        }`}
                        onClick={() => updatePreferences({ mobileViewMode: mode })}
                      >
                        {mode === 'editor' ? '编辑' : mode === 'preview' ? '预览' : '分屏'}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => setIsMobileOutlineOpen(true)}
                  >
                    <Eye size={16} />
                    大纲
                  </button>
                </div>
              ) : null}

              {isFindPanelOpen ? (
                <FindReplacePanel
                  isOpen={isFindPanelOpen}
                  query={searchQuery}
                  replacement={replacementText}
                  caseSensitive={isCaseSensitive}
                  matchCount={searchMatchCount}
                  onChangeQuery={setSearchQuery}
                  onChangeReplacement={setReplacementText}
                  onToggleCaseSensitive={() =>
                    setIsCaseSensitive((current) => !current)
                  }
                  onFindNext={handleFindNext}
                  onReplace={handleReplaceCurrent}
                  onReplaceAll={handleReplaceAll}
                  onClose={() => setIsFindPanelOpen(false)}
                />
              ) : null}

              <div
                ref={workspaceRef}
                className={`workspace-grid workspace-grid--${
                  isMobile ? 'vertical' : 'horizontal'
                } ${
                  isDraggingSplitter ? 'workspace-grid--dragging' : ''
                }`}
                style={workspaceGridStyle}
              >
                {showEditorPanel ? (
                  <section
                    className={`panel panel--editor ${
                      isToolbarVisible ? 'panel--editor-toolbar-open' : ''
                    }`}
                    aria-label="Markdown 编辑区"
                  >
                    <div className="panel-header panel-header--compact panel-header--bare">
                      <span className="panel-meta">
                        {preferences.lineNumbers ? '行号开启' : '无行号'} 路{' '}
                        {preferences.lineWrapping ? '自动换行' : '横向滚动'}
                      </span>
                      <button
                        type="button"
                        className="toolbar-toggle"
                        aria-expanded={isToolbarVisible}
                        aria-controls="editor-toolbar"
                        onClick={() => setIsToolbarVisible((current) => !current)}
                      >
                        {isToolbarVisible ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {isToolbarVisible ? '隐藏工具栏' : '展开工具栏'}
                      </button>
                    </div>

                    {isToolbarVisible ? (
                      <div id="editor-toolbar">
                        <Toolbar actions={TOOLBAR_ACTIONS} onAction={runToolbarAction} />
                      </div>
                    ) : null}

                    <div className="editor-surface">
                      <div
                        ref={hostRef}
                        className={`editor-host ${
                          preferences.lineNumbers
                            ? ''
                            : 'editor-host--hide-line-numbers'
                        } ${preferences.lineWrapping ? 'editor-host--wrap' : 'editor-host--nowrap'}`}
                      />
                    </div>
                  </section>
                ) : null}

                {showSplitter ? (
                  <button
                    type="button"
                    className={`splitter splitter--${isMobile ? 'vertical' : 'horizontal'}`}
                      aria-label={isMobile ? '拖动调整上下区域高度' : '拖动调整左右栏宽度'}
                    onPointerDown={() => setIsDraggingSplitter(true)}
                  >
                    <span className="splitter-grip" />
                  </button>
                ) : null}

                {showPreviewPanel ? (
                  <section className="panel panel--preview" aria-label="实时预览区">
                    <div className="panel-header panel-header--compact panel-header--bare panel-header--end">
                      <span className="preview-badge">GFM + 光标跟随</span>
                    </div>

                    <div className="preview-surface">
                      <div ref={previewScrollRef} className="preview-scroll">
                        <article
                          className="markdown-preview"
                          dangerouslySetInnerHTML={{ __html: renderedDocument.html }}
                        />
                      </div>
                    </div>
                  </section>
                ) : null}
              </div>
            </div>
          </section>
        </main>

        {!isFocusMode ? (
          <footer className="statusbar">
            <div className="status-group">
              <span>{stats.characters} 字符</span>
              <span>{stats.lines} 行</span>
              <span>{isDirty ? '待保存' : '已同步到浏览器草稿'}</span>
              <span>最近保存：{formatTimestamp(lastSavedAt)}</span>
            </div>

            <div className="copyright">
              Copyright©2026 Knight | 贺.AllRights Reserved
            </div>
          </footer>
        ) : (
          <button
            type="button"
            className="focus-exit-button"
            onClick={() => setIsFocusMode(false)}
          >
            <Pencil size={16} />
            退出专注模式
          </button>
        )}

        {toastMessage ? <div className="toast">{toastMessage}</div> : null}
      </div>

      <SettingsDrawer
        isOpen={isSettingsOpen}
        preferences={preferences}
        resolvedTheme={resolvedTheme}
        history={draftStore.history}
        onClose={() => setIsSettingsOpen(false)}
        onChangePreferences={updatePreferences}
        onRestoreSnapshot={handleRestoreSnapshot}
        onClearHistory={handleClearHistory}
      />

      {isMobileOutlineOpen ? (
        <div className="dialog-backdrop" role="presentation">
          <OutlinePanel
            title="移动端大纲"
            outline={renderedDocument.outline}
            activeSlug={activeOutlineSlug}
            onSelect={handleSelectOutlineItem}
            onClose={() => setIsMobileOutlineOpen(false)}
          />
        </div>
      ) : null}

      {isCommandPaletteOpen ? (
        <CommandPalette
          commands={commandItems}
          onClose={() => setIsCommandPaletteOpen(false)}
        />
      ) : null}

      {insertDialog ? (
        <InsertDialog
          dialogState={insertDialog}
          onChange={setInsertDialog}
          onClose={() => setInsertDialog(null)}
          onSubmit={handleDialogSubmit}
        />
      ) : null}
    </>
  )

  function executeWithEditor(action: (view: EditorView) => void) {
    const view = editorBridgeRef.current
    if (!view) {
      return
    }

    action(view)
  }

  function persistCurrentDraft(
    reason: 'auto' | 'manual' | 'import' | 'reset' | 'history-restore',
    nextMarkdown = markdownText,
    nextDocumentName = documentName,
  ) {
    try {
      const nextStore = persistDraftRef.current?.({
        markdown: nextMarkdown,
        documentName: nextDocumentName,
        reason,
      })

      if (!nextStore?.current) {
        return null
      }

      setIsDirty(false)
      setLastSavedAt(nextStore.current.savedAt)
      setSaveStatus(
        reason === 'import'
          ? 'imported'
          : reason === 'reset'
            ? 'reset'
            : reason === 'history-restore'
              ? 'history-restored'
              : 'saved',
      )
      return nextStore
    } catch {
      setSaveStatus('failed')
      showToast('保存失败，请检查浏览器的本地存储容量。')
      return null
    }
  }

  function releaseSyncGuard(delay = 80) {
    if (syncTimeoutRef.current) {
      window.clearTimeout(syncTimeoutRef.current)
    }

    syncTimeoutRef.current = window.setTimeout(() => {
      syncSourceRef.current = null
    }, delay)
  }

  async function importMarkdownFile(file: File) {
    if (!isMarkdownFile(file)) {
      return false
    }

    const content = await readTextFile(file)
    const nextName = normalizeDocumentName(file.name)
    setDocumentName(nextName)
    setMarkdownText(content)
    setActiveSourceLine(1)
    persistCurrentDraft('import', content, nextName)
    showToast(`已导入 ${file.name}`)
    focusEditor()
    return true
  }

  async function insertImageFile(file: File) {
    const view = editorBridgeRef.current
    if (!view || !isImageFile(file)) {
      return false
    }

    const dataUrl = await readFileAsDataUrl(file)
    insertImage(
      view,
      normalizeDocumentName(file.name),
      saveImageAssetDataUrl(dataUrl),
    )
    showToast(`已插入图片 ${file.name}`)
    return true
  }

  async function handleDroppedUrl(value: string) {
    const view = editorBridgeRef.current
    if (!view || !value.trim()) {
      return
    }

    if (await detectImageUrl(value)) {
      insertImage(view, '拖拽图片', value)
      showToast('已插入拖拽图片链接')
      return
    }

    if (isLikelyUrl(value)) {
      insertLink(view, value, value)
      showToast('已插入链接')
      return
    }

    insertImage(view, '鎷栨嫿鍥剧墖', value)
  }

  async function handleImportedFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    await importMarkdownFile(file)
    event.target.value = ''
  }

  async function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault()
    dragCounterRef.current = 0
    setIsDropActive(false)

    const files = Array.from(event.dataTransfer.files)
    const markdownFile = files.find(isMarkdownFile)
    if (markdownFile) {
      await importMarkdownFile(markdownFile)
      return
    }

    const imageFile = files.find(isImageFile)
    if (imageFile) {
      await insertImageFile(imageFile)
      return
    }

    const droppedUrl =
      event.dataTransfer.getData('text/uri-list') ||
      event.dataTransfer.getData('text/plain')
    if (droppedUrl.trim()) {
      await handleDroppedUrl(droppedUrl.trim())
    }
  }

  function handleDragEnter(event: DragEvent<HTMLElement>) {
    if (!hasDropPayload(event.dataTransfer)) {
      return
    }

    event.preventDefault()
    dragCounterRef.current += 1
    setIsDropActive(true)
  }

  function handleDragOver(event: DragEvent<HTMLElement>) {
    if (!hasDropPayload(event.dataTransfer)) {
      return
    }

    event.preventDefault()
  }

  function handleDragLeave(event: DragEvent<HTMLElement>) {
    if (!hasDropPayload(event.dataTransfer)) {
      return
    }

    event.preventDefault()
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1)
    if (dragCounterRef.current === 0) {
      setIsDropActive(false)
    }
  }

  function handleDialogSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!insertDialog) {
      return
    }

    const normalizedUrl = insertDialog.url.trim()
    if (!normalizedUrl) {
      return
    }

    executeWithEditor((view) => {
      if (insertDialog.mode === 'link') {
        insertLink(view, insertDialog.text, normalizedUrl)
      } else {
        insertImage(view, insertDialog.text, normalizedUrl)
      }
    })

    setInsertDialog(null)
  }

  function handleExportMarkdown() {
    downloadTextFile(`${documentName}.md`, markdownText, 'text/markdown')
    showToast('Markdown 文件已开始下载')
  }

  function handleExportHtml() {
    downloadTextFile(
      `${documentName}.html`,
      buildStandaloneHtml(markdownText, documentName, preferences),
      'text/html',
    )
    showToast('HTML 文件已开始下载')
  }

  async function handleCopyHtml() {
    try {
      await copyTextToClipboard(
        buildStandaloneHtml(markdownText, documentName, preferences),
      )
      setSaveStatus('copied')
      showToast('完整 HTML 文档已复制到剪贴板')
    } catch {
      showToast('复制失败，请检查浏览器权限。')
    }
  }

  function handleExportPdf() {
    const didOpen = openPrintWindow(markdownText, documentName, preferences)
    if (didOpen) {
      setSaveStatus('printed')
      showToast('已打开打印窗口，可直接保存为 PDF')
    } else {
      showToast('无法打开打印窗口，请检查浏览器弹窗设置。')
    }
  }

  function handleFindNext() {
    if (!searchQuery || !editorBridgeRef.current) {
      return
    }

    const nextMatch = selectSearchMatch(editorBridgeRef.current, searchQuery, {
      caseSensitive: isCaseSensitive,
    })

    if (!nextMatch) {
      showToast('没有找到匹配结果。')
    }
  }

  function handleReplaceCurrent() {
    if (!searchQuery || !editorBridgeRef.current) {
      return
    }

    const replaced = replaceCurrentMatch(
      editorBridgeRef.current,
      searchQuery,
      replacementText,
      {
        caseSensitive: isCaseSensitive,
      },
    )

    if (replaced) {
      setIsDirty(true)
      setSaveStatus('editing')
      showToast('已替换当前匹配项')
    } else {
      showToast('当前没有可替换的匹配项。')
    }
  }

  function handleReplaceAll() {
    if (!searchQuery || !editorBridgeRef.current) {
      return
    }

    const replacedCount = replaceAllMatches(
      editorBridgeRef.current,
      searchQuery,
      replacementText,
      {
        caseSensitive: isCaseSensitive,
      },
    )

    if (replacedCount > 0) {
      setIsDirty(true)
      setSaveStatus('editing')
      showToast(`已替换 ${replacedCount} 处匹配`)
    } else {
      showToast('没有找到可替换的匹配项。')
    }
  }

  function handleRestoreSnapshot(snapshotId: string) {
    const nextStore = restoreSnapshot(snapshotId)
    if (!nextStore.current) {
      return
    }

    setMarkdownText(nextStore.current.markdown)
    setDocumentName(nextStore.current.documentName)
    setLastSavedAt(nextStore.current.savedAt)
    setIsDirty(false)
    setSaveStatus('history-restored')
    setIsSettingsOpen(false)
    setActiveSourceLine(1)
    showToast('已从历史快照恢复内容')
  }

  function handleClearHistory() {
    const shouldClear = window.confirm('确定要清空历史快照吗？')
    if (!shouldClear) {
      return
    }

    wipeHistory()
    showToast('历史快照已清空')
  }

  function handleSelectOutlineItem(item: MarkdownOutlineItem) {
    setActiveSourceLine(item.lineStart)
    setIsMobileOutlineOpen(false)
    syncSourceRef.current = 'outline'
    previewSyncModeRef.current = 'selection'
    stopPreviewFollowAnimation()

    if (editorBridgeRef.current) {
      scrollEditorToLine(editorBridgeRef.current, item.lineStart)
    }

    if (previewScrollRef.current) {
      const didScrollToHeading = scrollPreviewHeadingIntoView(
        previewScrollRef.current,
        item.slug,
      )

      if (!didScrollToHeading) {
        const anchor = findPreviewAnchorForLine(
          collectPreviewAnchors(previewScrollRef.current),
          item.lineStart,
        )

        if (anchor) {
          scrollPreviewAnchorIntoView(previewScrollRef.current, anchor, 'smooth')
        }
      }
    }

    releaseSyncGuard(260)
  }

  function handleResetDocument() {
    const shouldReset = window.confirm(
      '确定要恢复默认示例内容吗？当前内容会进入历史快照。',
    )
    if (!shouldReset) {
      return
    }

    setMarkdownText(DEFAULT_MARKDOWN)
    setDocumentName(DEFAULT_DOCUMENT_NAME)
    setActiveSourceLine(1)
    persistCurrentDraft('reset', DEFAULT_MARKDOWN, DEFAULT_DOCUMENT_NAME)
    showToast('已恢复默认示例内容')
  }

  function runToolbarAction(actionId: string) {
    switch (actionId) {
      case 'h1':
        executeWithEditor((view) => insertHeading(view, 1))
        break
      case 'h2':
        executeWithEditor((view) => insertHeading(view, 2))
        break
      case 'h3':
        executeWithEditor((view) => insertHeading(view, 3))
        break
      case 'bold':
        executeWithEditor((view) =>
          wrapEditorSelection(view, '**', '**', '加粗文本'),
        )
        break
      case 'italic':
        executeWithEditor((view) =>
          wrapEditorSelection(view, '*', '*', '斜体文本'),
        )
        break
      case 'strike':
        executeWithEditor((view) =>
          wrapEditorSelection(view, '~~', '~~', '删除线文本'),
        )
        break
      case 'link':
        openLinkDialog()
        break
      case 'image':
        setInsertDialog({
          mode: 'image',
          text: '图片说明',
          url: 'https://',
        })
        break
      case 'ul':
        executeWithEditor((view) => insertUnorderedList(view))
        break
      case 'ol':
        executeWithEditor((view) => insertOrderedList(view))
        break
      case 'task':
        executeWithEditor((view) => insertTaskList(view))
        break
      case 'code-block':
        executeWithEditor((view) => insertCodeBlock(view))
        break
      case 'inline-code':
        executeWithEditor((view) =>
          wrapEditorSelection(view, '`', '`', 'inline-code'),
        )
        break
      case 'quote':
        executeWithEditor((view) => insertQuote(view))
        break
      case 'rule':
        executeWithEditor((view) => insertHorizontalRule(view))
        break
      case 'table':
        executeWithEditor((view) => insertTableTemplate(view))
        break
      default:
        break
    }
  }

  function showToast(message: string) {
    setToastMessage(message)
  }
}

function getWorkspaceGridStyle({
  isMobile,
  splitRatio,
  showEditorPanel,
  showPreviewPanel,
}: {
  isMobile: boolean
  splitRatio: number
  showEditorPanel: boolean
  showPreviewPanel: boolean
}): CSSProperties {
  if (showEditorPanel && showPreviewPanel) {
    return isMobile
      ? {
          gridTemplateRows: `minmax(16rem, ${splitRatio}fr) 0.7rem minmax(16rem, ${
            100 - splitRatio
          }fr)`,
        }
      : {
          gridTemplateColumns: `minmax(0, ${splitRatio}fr) 0.7rem minmax(0, ${
            100 - splitRatio
          }fr)`,
        }
  }

  return {
    gridTemplateColumns: 'minmax(0, 1fr)',
  }
}

function formatTimestamp(timestamp: number | null) {
  if (!timestamp) {
    return '尚未保存'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp)
}

function hasDropPayload(dataTransfer: DataTransfer) {
  return (
    dataTransfer.types.includes('Files') ||
    dataTransfer.types.includes('text/uri-list') ||
    dataTransfer.types.includes('text/plain')
  )
}

export default App
