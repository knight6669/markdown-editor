import type { EditorPreferences, PreviewWidth, SaveStatus } from '../types/editor'

export const STORAGE_KEYS = {
  draftStore: 'knight.markdown-editor.drafts.v2',
  preferences: 'knight.markdown-editor.preferences.v2',
  imageAssets: 'knight.markdown-editor.image-assets.v1',
} as const

export const DEFAULT_DOCUMENT_NAME = 'knight-markdown'
export const MOBILE_BREAKPOINT = 768
export const AUTOSAVE_INTERVAL = 30_000
export const PREVIEW_DEBOUNCE = 200
export const DEFAULT_SPLIT_RATIO = 50
export const MIN_DESKTOP_RATIO = 24
export const MAX_DESKTOP_RATIO = 76
export const MIN_MOBILE_RATIO = 32
export const MAX_MOBILE_RATIO = 68
export const MAX_HISTORY_ITEMS = 10

export const DEFAULT_EDITOR_PREFERENCES: EditorPreferences = {
  themeMode: 'system',
  fontSize: 16,
  previewWidth: 'comfortable',
  codeFont: 'ibm-plex',
  lineWrapping: true,
  lineNumbers: true,
  desktopViewMode: 'split',
  mobileViewMode: 'editor',
  wordGoal: null,
}

export const PREVIEW_WIDTH_VALUES: Record<PreviewWidth, string> = {
  narrow: '44rem',
  comfortable: '58rem',
  wide: '72rem',
  fluid: '100%',
}

export const CODE_FONT_STACKS = {
  'ibm-plex':
    '"IBM Plex Mono", "JetBrains Mono", "SFMono-Regular", Consolas, monospace',
  jetbrains:
    '"JetBrains Mono", "IBM Plex Mono", "SFMono-Regular", Consolas, monospace',
  sfmono:
    '"SFMono-Regular", "JetBrains Mono", "IBM Plex Mono", Consolas, monospace',
} as const

export const SAMPLE_IMAGE_URLS = {
  current:
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1400&q=80',
  legacy: [
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80',
  ],
} as const

export const SAVE_STATUS_LABELS: Record<SaveStatus, string> = {
  ready: '示例内容已就绪',
  restored: '已恢复上次草稿',
  editing: '编辑中',
  saved: '已保存到浏览器草稿',
  imported: '已导入 Markdown 文件',
  reset: '已恢复默认示例',
  failed: '保存失败，请检查浏览器存储空间',
  'history-restored': '已从历史快照恢复',
  copied: 'HTML 已复制到剪贴板',
  printed: '已准备打印 / PDF 导出',
}

export const DEFAULT_MARKDOWN = `# Knight Markdown Studio

欢迎来到一个更完整的 Markdown 工作台。
## 现在可以做什么？

- 左侧使用 Markdown 源码写作
- 右侧实时预览 GFM 渲染结果
- 使用大纲、命令面板、查找替换和历史快照管理长文档

### 任务列表

- [x] 实时预览与代码高亮
- [x] 工具栏与快捷键
- [x] 文件导入 / 导出 / HTML 复制
- [ ] 导出一份正式文档

### 代码块
\`\`\`ts
const greeting = 'Hello, Markdown!'

function announce(message: string) {
  return \`>> \${message}\`
}

console.log(announce(greeting))
\`\`\`

### 表格

| 功能 | 状态 | 说明 |
| --- | --- | --- |
| 大纲目录 | 已完成 | 自动提取 # / ## / ### |
| 草稿历史 | 已完成 | 保留最近几次快照 |
| 设置页 | 已完成 | 主题、字号、宽度、代码字体 |

### 引用

> 好的写作工具，不只是能写，更要能让结构、节奏与修改路径都清晰可见。

### 链接与图片

访问 [OpenAI](https://openai.com/) 获取更多灵感。
![技术工作台](${SAMPLE_IMAGE_URLS.current})

### 脚注

脚注也已经准备好。[^1]

[^1]: 你可以在这里补充引用、说明或延伸资料。`
