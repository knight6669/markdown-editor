export type ThemeMode = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'
export type PreviewWidth = 'narrow' | 'comfortable' | 'wide' | 'fluid'
export type CodeFont = 'ibm-plex' | 'jetbrains' | 'sfmono'
export type WorkspaceViewMode = 'split' | 'editor' | 'preview'

export type SaveStatus =
  | 'ready'
  | 'restored'
  | 'editing'
  | 'saved'
  | 'imported'
  | 'reset'
  | 'failed'
  | 'history-restored'
  | 'copied'
  | 'printed'

export type DraftSaveReason =
  | 'auto'
  | 'manual'
  | 'import'
  | 'reset'
  | 'history-restore'

export type DraftSnapshot = {
  id: string
  markdown: string
  documentName: string
  savedAt: number
  reason: DraftSaveReason
}

export type DraftStore = {
  current: DraftSnapshot | null
  history: DraftSnapshot[]
}

export type EditorPreferences = {
  themeMode: ThemeMode
  fontSize: number
  previewWidth: PreviewWidth
  codeFont: CodeFont
  lineWrapping: boolean
  lineNumbers: boolean
  desktopViewMode: WorkspaceViewMode
  mobileViewMode: WorkspaceViewMode
  wordGoal: number | null
}

export type MarkdownOutlineItem = {
  level: 1 | 2 | 3
  text: string
  slug: string
  lineStart: number
}

export type RenderedMarkdownDocument = {
  html: string
  outline: MarkdownOutlineItem[]
}

export type DocumentStats = {
  characters: number
  lines: number
  goalProgress: number | null
}

export type InsertDialogMode = 'link' | 'image'

export type InsertDialogState =
  | {
      mode: InsertDialogMode
      text: string
      url: string
    }
  | null

export type TextRange = {
  from: number
  to: number
}

export type TextTransformResult = {
  text: string
  selection: TextRange
}

export type SearchOptions = {
  caseSensitive: boolean
}

export type SearchMatch = TextRange & {
  query: string
}

export type CommandPaletteItem = {
  id: string
  title: string
  description: string
  shortcut?: string
  group: string
  keywords: string[]
  run: () => void
}
