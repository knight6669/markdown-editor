import DOMPurify from 'dompurify'
import MarkdownIt from 'markdown-it'
import type Token from 'markdown-it/lib/token.mjs'
import type { RenderRule } from 'markdown-it/lib/renderer.mjs'
import markdownItFootnote from 'markdown-it-footnote'
import markdownItTaskLists from 'markdown-it-task-lists'
import { CODE_FONT_STACKS, DEFAULT_DOCUMENT_NAME, PREVIEW_WIDTH_VALUES } from './constants'
import { hljs } from './highlight'
import { resolveMarkdownImageAssets } from './image-assets'
import type {
  DocumentStats,
  EditorPreferences,
  MarkdownOutlineItem,
  RenderedMarkdownDocument,
  ResolvedTheme,
} from '../types/editor'

const markdownRenderer = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  highlight(code: string, language: string) {
    try {
      if (language && hljs.getLanguage(language)) {
        const highlighted = hljs.highlight(code, {
          language,
          ignoreIllegals: true,
        }).value

        return `<pre><code class="hljs language-${escapeAttribute(
          language,
        )}">${highlighted}</code></pre>`
      }

      const highlighted = hljs.highlightAuto(code).value
      return `<pre><code class="hljs">${highlighted}</code></pre>`
    } catch {
      return `<pre><code class="hljs">${escapeHtml(code)}</code></pre>`
    }
  },
})

markdownRenderer.use(markdownItTaskLists, {
  enabled: true,
  label: true,
  labelAfter: true,
})

markdownRenderer.use(markdownItFootnote)

const defaultLinkRenderer: RenderRule =
  markdownRenderer.renderer.rules.link_open ??
  ((tokens, index, options, _env, self) =>
    self.renderToken(tokens, index, options))

markdownRenderer.renderer.rules.link_open = (
  tokens,
  index,
  options,
  env,
  self,
) => {
  tokens[index].attrSet('target', '_blank')
  tokens[index].attrSet('rel', 'noreferrer noopener')
  return defaultLinkRenderer(tokens, index, options, env, self)
}

const defaultImageRenderer: RenderRule =
  markdownRenderer.renderer.rules.image ??
  ((tokens, index, options, _env, self) =>
    self.renderToken(tokens, index, options))

markdownRenderer.renderer.rules.image = (
  tokens,
  index,
  options,
  env,
  self,
) => {
  tokens[index].attrSet('loading', 'lazy')
  return defaultImageRenderer(tokens, index, options, env, self)
}

export const PREVIEW_CONTENT_CSS = String.raw`
.markdown-preview,
.standalone-preview {
  --preview-bg: transparent;
  --preview-text: #223331;
  --preview-muted: #5d7370;
  --preview-heading: #142120;
  --preview-border: rgba(24, 45, 43, 0.12);
  --preview-inline-code: rgba(9, 127, 122, 0.1);
  --preview-blockquote-bg: rgba(9, 127, 122, 0.06);
  --preview-code-bg: #f7fbfa;
  --preview-table-stripe: rgba(9, 127, 122, 0.03);
  --preview-link: #0a857f;
  --preview-pre-border: rgba(74, 182, 162, 0.14);
  color: var(--preview-text);
  font-size: inherit;
  line-height: 1.8;
  width: min(100%, var(--preview-content-width, 58rem));
  margin: 0 auto;
}

.markdown-preview > :first-child,
.standalone-preview > :first-child {
  margin-top: 0;
}

.markdown-preview > :last-child,
.standalone-preview > :last-child {
  margin-bottom: 0;
}

.md-source-block {
  scroll-margin-top: 1.25rem;
}

.markdown-preview h1,
.markdown-preview h2,
.markdown-preview h3,
.markdown-preview h4,
.markdown-preview h5,
.markdown-preview h6,
.standalone-preview h1,
.standalone-preview h2,
.standalone-preview h3,
.standalone-preview h4,
.standalone-preview h5,
.standalone-preview h6 {
  color: var(--preview-heading);
  line-height: 1.2;
  margin: 1.45em 0 0.6em;
  letter-spacing: -0.03em;
}

.markdown-preview h1,
.standalone-preview h1 {
  font-size: clamp(1.9rem, 1.25rem + 1vw, 2.55rem);
}

.markdown-preview h2,
.standalone-preview h2 {
  font-size: clamp(1.35rem, 1.05rem + 0.6vw, 1.8rem);
}

.markdown-preview h3,
.standalone-preview h3 {
  font-size: 1.14rem;
}

.markdown-preview p,
.markdown-preview ul,
.markdown-preview ol,
.markdown-preview blockquote,
.markdown-preview table,
.markdown-preview pre,
.standalone-preview p,
.standalone-preview ul,
.standalone-preview ol,
.standalone-preview blockquote,
.standalone-preview table,
.standalone-preview pre {
  margin: 0 0 1.05rem;
}

.markdown-preview ul,
.markdown-preview ol,
.standalone-preview ul,
.standalone-preview ol {
  padding-left: 1.35rem;
}

.markdown-preview li + li,
.standalone-preview li + li {
  margin-top: 0.35rem;
}

.markdown-preview a,
.standalone-preview a {
  color: var(--preview-link);
  text-decoration-thickness: 0.08em;
  text-underline-offset: 0.22em;
}

.markdown-preview img,
.standalone-preview img {
  display: block;
  inline-size: auto;
  max-inline-size: 100%;
  block-size: auto;
  border-radius: 1rem;
  border: 1px solid var(--preview-border);
  margin: 1.3rem 0;
}

.markdown-preview hr,
.standalone-preview hr {
  border: 0;
  block-size: 1px;
  margin: 1.85rem 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(9, 127, 122, 0.35),
    transparent
  );
}

.markdown-preview blockquote,
.standalone-preview blockquote {
  padding: 0.9rem 1rem;
  background: var(--preview-blockquote-bg);
  border-inline-start: 0.24rem solid rgba(9, 127, 122, 0.45);
  border-radius: 0 1rem 1rem 0;
  color: var(--preview-muted);
}

.markdown-preview table,
.standalone-preview table {
  inline-size: 100%;
  border-collapse: collapse;
  border: 1px solid var(--preview-border);
  border-radius: 1rem;
  overflow: hidden;
}

.markdown-preview th,
.markdown-preview td,
.standalone-preview th,
.standalone-preview td {
  padding: 0.82rem 0.92rem;
  border-bottom: 1px solid var(--preview-border);
  border-right: 1px solid var(--preview-border);
  text-align: left;
}

.markdown-preview thead,
.standalone-preview thead {
  background: rgba(9, 127, 122, 0.08);
}

.markdown-preview tbody tr:nth-child(even),
.standalone-preview tbody tr:nth-child(even) {
  background: var(--preview-table-stripe);
}

.markdown-preview code,
.standalone-preview code {
  font-family: var(--app-code-font, "IBM Plex Mono", Consolas, monospace);
  font-size: 0.92em;
  border-radius: 0.5rem;
}

.markdown-preview :not(pre) > code,
.standalone-preview :not(pre) > code {
  padding: 0.2rem 0.45rem;
  background: var(--preview-inline-code);
}

.markdown-preview pre,
.standalone-preview pre {
  overflow: auto;
  padding: 1rem 1.05rem;
  border-radius: 1rem;
  background: var(--preview-code-bg);
  border: 1px solid var(--preview-pre-border);
}

.markdown-preview pre code,
.standalone-preview pre code {
  padding: 0;
  background: none;
  font-size: 0.9rem;
}

.markdown-preview input[type='checkbox'],
.standalone-preview input[type='checkbox'] {
  inline-size: 1rem;
  block-size: 1rem;
  margin-right: 0.45rem;
  accent-color: #0a857f;
}

.markdown-preview sup,
.standalone-preview sup {
  color: var(--preview-link);
}

.markdown-preview .footnotes,
.standalone-preview .footnotes {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--preview-border);
  color: var(--preview-muted);
}

.markdown-preview .hljs,
.standalone-preview .hljs {
  color: #1f2b2b;
}

.markdown-preview .hljs-comment,
.markdown-preview .hljs-quote,
.standalone-preview .hljs-comment,
.standalone-preview .hljs-quote {
  color: #73817f;
}

.markdown-preview .hljs-keyword,
.markdown-preview .hljs-selector-tag,
.markdown-preview .hljs-literal,
.markdown-preview .hljs-section,
.markdown-preview .hljs-link,
.standalone-preview .hljs-keyword,
.standalone-preview .hljs-selector-tag,
.standalone-preview .hljs-literal,
.standalone-preview .hljs-section,
.standalone-preview .hljs-link {
  color: #0a7f79;
}

.markdown-preview .hljs-string,
.markdown-preview .hljs-title,
.markdown-preview .hljs-name,
.markdown-preview .hljs-type,
.markdown-preview .hljs-attribute,
.markdown-preview .hljs-symbol,
.markdown-preview .hljs-bullet,
.markdown-preview .hljs-addition,
.standalone-preview .hljs-string,
.standalone-preview .hljs-title,
.standalone-preview .hljs-name,
.standalone-preview .hljs-type,
.standalone-preview .hljs-attribute,
.standalone-preview .hljs-symbol,
.standalone-preview .hljs-bullet,
.standalone-preview .hljs-addition {
  color: #b25b32;
}

.markdown-preview .hljs-number,
.markdown-preview .hljs-meta,
.markdown-preview .hljs-built_in,
.markdown-preview .hljs-builtin-name,
.markdown-preview .hljs-params,
.markdown-preview .hljs-template-variable,
.markdown-preview .hljs-operator,
.standalone-preview .hljs-number,
.standalone-preview .hljs-meta,
.standalone-preview .hljs-built_in,
.standalone-preview .hljs-builtin-name,
.standalone-preview .hljs-params,
.standalone-preview .hljs-template-variable,
.standalone-preview .hljs-operator {
  color: #8f54d4;
}

.markdown-preview .hljs-emphasis,
.standalone-preview .hljs-emphasis {
  font-style: italic;
}

.markdown-preview .hljs-strong,
.standalone-preview .hljs-strong {
  font-weight: 700;
}

.markdown-preview .hljs-deletion,
.standalone-preview .hljs-deletion {
  color: #c04a4a;
}

:root[data-theme='dark'] .markdown-preview,
:root[data-theme='dark'] .standalone-preview,
html[data-export-theme='dark'] .standalone-preview {
  --preview-text: #dce9e5;
  --preview-muted: #96ada8;
  --preview-heading: #f2fbf7;
  --preview-border: rgba(166, 219, 210, 0.12);
  --preview-inline-code: rgba(91, 212, 195, 0.14);
  --preview-blockquote-bg: rgba(91, 212, 195, 0.08);
  --preview-code-bg: #0f1e21;
  --preview-table-stripe: rgba(91, 212, 195, 0.03);
  --preview-link: #66d9c9;
  --preview-pre-border: rgba(91, 212, 195, 0.14);
}

:root[data-theme='dark'] .markdown-preview .hljs,
:root[data-theme='dark'] .standalone-preview .hljs,
html[data-export-theme='dark'] .standalone-preview .hljs {
  color: #deece8;
}

:root[data-theme='dark'] .markdown-preview .hljs-comment,
:root[data-theme='dark'] .markdown-preview .hljs-quote,
:root[data-theme='dark'] .standalone-preview .hljs-comment,
:root[data-theme='dark'] .standalone-preview .hljs-quote,
html[data-export-theme='dark'] .standalone-preview .hljs-comment,
html[data-export-theme='dark'] .standalone-preview .hljs-quote {
  color: #809894;
}

:root[data-theme='dark'] .markdown-preview .hljs-keyword,
:root[data-theme='dark'] .markdown-preview .hljs-selector-tag,
:root[data-theme='dark'] .markdown-preview .hljs-literal,
:root[data-theme='dark'] .markdown-preview .hljs-section,
:root[data-theme='dark'] .markdown-preview .hljs-link,
:root[data-theme='dark'] .standalone-preview .hljs-keyword,
:root[data-theme='dark'] .standalone-preview .hljs-selector-tag,
:root[data-theme='dark'] .standalone-preview .hljs-literal,
:root[data-theme='dark'] .standalone-preview .hljs-section,
:root[data-theme='dark'] .standalone-preview .hljs-link,
html[data-export-theme='dark'] .standalone-preview .hljs-keyword,
html[data-export-theme='dark'] .standalone-preview .hljs-selector-tag,
html[data-export-theme='dark'] .standalone-preview .hljs-literal,
html[data-export-theme='dark'] .standalone-preview .hljs-section,
html[data-export-theme='dark'] .standalone-preview .hljs-link {
  color: #67dccc;
}

:root[data-theme='dark'] .markdown-preview .hljs-string,
:root[data-theme='dark'] .markdown-preview .hljs-title,
:root[data-theme='dark'] .markdown-preview .hljs-name,
:root[data-theme='dark'] .markdown-preview .hljs-type,
:root[data-theme='dark'] .markdown-preview .hljs-attribute,
:root[data-theme='dark'] .markdown-preview .hljs-symbol,
:root[data-theme='dark'] .markdown-preview .hljs-bullet,
:root[data-theme='dark'] .markdown-preview .hljs-addition,
:root[data-theme='dark'] .standalone-preview .hljs-string,
:root[data-theme='dark'] .standalone-preview .hljs-title,
:root[data-theme='dark'] .standalone-preview .hljs-name,
:root[data-theme='dark'] .standalone-preview .hljs-type,
:root[data-theme='dark'] .standalone-preview .hljs-attribute,
:root[data-theme='dark'] .standalone-preview .hljs-symbol,
:root[data-theme='dark'] .standalone-preview .hljs-bullet,
:root[data-theme='dark'] .standalone-preview .hljs-addition,
html[data-export-theme='dark'] .standalone-preview .hljs-string,
html[data-export-theme='dark'] .standalone-preview .hljs-title,
html[data-export-theme='dark'] .standalone-preview .hljs-name,
html[data-export-theme='dark'] .standalone-preview .hljs-type,
html[data-export-theme='dark'] .standalone-preview .hljs-attribute,
html[data-export-theme='dark'] .standalone-preview .hljs-symbol,
html[data-export-theme='dark'] .standalone-preview .hljs-bullet,
html[data-export-theme='dark'] .standalone-preview .hljs-addition {
  color: #ffb278;
}

:root[data-theme='dark'] .markdown-preview .hljs-number,
:root[data-theme='dark'] .markdown-preview .hljs-meta,
:root[data-theme='dark'] .markdown-preview .hljs-built_in,
:root[data-theme='dark'] .markdown-preview .hljs-builtin-name,
:root[data-theme='dark'] .markdown-preview .hljs-params,
:root[data-theme='dark'] .markdown-preview .hljs-template-variable,
:root[data-theme='dark'] .markdown-preview .hljs-operator,
:root[data-theme='dark'] .standalone-preview .hljs-number,
:root[data-theme='dark'] .standalone-preview .hljs-meta,
:root[data-theme='dark'] .standalone-preview .hljs-built_in,
:root[data-theme='dark'] .standalone-preview .hljs-builtin-name,
:root[data-theme='dark'] .standalone-preview .hljs-params,
:root[data-theme='dark'] .standalone-preview .hljs-template-variable,
:root[data-theme='dark'] .standalone-preview .hljs-operator,
html[data-export-theme='dark'] .standalone-preview .hljs-number,
html[data-export-theme='dark'] .standalone-preview .hljs-meta,
html[data-export-theme='dark'] .standalone-preview .hljs-built_in,
html[data-export-theme='dark'] .standalone-preview .hljs-builtin-name,
html[data-export-theme='dark'] .standalone-preview .hljs-params,
html[data-export-theme='dark'] .standalone-preview .hljs-template-variable,
html[data-export-theme='dark'] .standalone-preview .hljs-operator {
  color: #c2a1ff;
}

:root[data-theme='dark'] .markdown-preview .hljs-deletion,
:root[data-theme='dark'] .standalone-preview .hljs-deletion,
html[data-export-theme='dark'] .standalone-preview .hljs-deletion {
  color: #ff8b8b;
}

@media print {
  body {
    background: white !important;
  }
}
`

export function renderMarkdownDocument(markdownSource: string): RenderedMarkdownDocument {
  const normalizedMarkdown = resolveMarkdownImageAssets(markdownSource)
  const env = {}
  const tokens = markdownRenderer.parse(normalizedMarkdown, env)
  const outline = annotateTokens(tokens)
  const html = markdownRenderer.renderer.render(
    tokens,
    markdownRenderer.options,
    env,
  )

  return {
    html: sanitizeHtml(html),
    outline,
  }
}

export function countDocumentStats(
  markdownSource: string,
  wordGoal: number | null,
): DocumentStats {
  const characters = markdownSource.length
  return {
    characters,
    lines: markdownSource.length === 0 ? 1 : markdownSource.split(/\r?\n/u).length,
    goalProgress: wordGoal && wordGoal > 0 ? Math.min(characters / wordGoal, 1) : null,
  }
}

export function buildStandaloneHtml(
  markdownSource: string,
  documentTitle: string,
  preferences: EditorPreferences,
) {
  const renderedDocument = renderMarkdownDocument(markdownSource)
  const safeTitle = escapeHtml(documentTitle || DEFAULT_DOCUMENT_NAME)
  const exportTheme = resolveExportTheme(preferences.themeMode)
  const standaloneOutline = buildStandaloneOutlineTree(renderedDocument.outline)
  const standaloneLayoutClass =
    renderedDocument.outline.length > 0
      ? 'standalone-layout'
      : 'standalone-layout standalone-layout--no-outline'

  return `<!DOCTYPE html>
<html lang="zh-CN" data-export-theme="${exportTheme}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${safeTitle}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=JetBrains+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap');

      :root {
        color-scheme: light dark;
        --app-code-font: ${CODE_FONT_STACKS[preferences.codeFont]};
        --preview-content-width: ${PREVIEW_WIDTH_VALUES[preferences.previewWidth]};
      }

      * {
        box-sizing: border-box;
      }

      html {
        scroll-behavior: smooth;
      }

      html[data-export-theme='light'] {
        color-scheme: light;
      }

      html[data-export-theme='dark'] {
        color-scheme: dark;
      }

      body {
        margin: 0;
        min-height: 100vh;
        padding: 2rem 1rem 3rem;
        font-family:
          "Manrope",
          "PingFang SC",
          "Microsoft YaHei",
          "Noto Sans SC",
          system-ui,
          sans-serif;
        font-size: ${preferences.fontSize}px;
        background:
          radial-gradient(circle at top left, rgba(74, 182, 162, 0.16), transparent 28rem),
          radial-gradient(circle at top right, rgba(9, 127, 122, 0.08), transparent 24rem),
          linear-gradient(180deg, #f3f1eb, #e7ece7);
      }

      html[data-export-theme='dark'] body {
        background:
          radial-gradient(circle at top left, rgba(91, 212, 195, 0.12), transparent 28rem),
          radial-gradient(circle at top right, rgba(29, 141, 138, 0.14), transparent 24rem),
          linear-gradient(180deg, #091315, #0d1d20);
      }

      .standalone-shell {
        max-width: 1320px;
        margin: 0 auto;
        padding: 1.4rem;
        border: 1px solid rgba(24, 45, 43, 0.12);
        border-radius: 1.6rem;
        background: rgba(255, 253, 248, 0.88);
        box-shadow:
          0 1.3rem 3.6rem -2rem rgba(15, 32, 31, 0.34),
          0 0.4rem 1.2rem rgba(15, 32, 31, 0.08);
        backdrop-filter: blur(16px);
      }

      html[data-export-theme='dark'] .standalone-shell {
        border-color: rgba(166, 219, 210, 0.12);
        background: rgba(11, 22, 24, 0.92);
        box-shadow:
          0 1.8rem 3.8rem -2.1rem rgba(0, 0, 0, 0.72),
          0 0.4rem 1.2rem rgba(0, 0, 0, 0.28);
      }

      .standalone-layout {
        display: grid;
        grid-template-columns: minmax(17.2rem, 20rem) minmax(0, 1fr);
        gap: 1.4rem;
        align-items: start;
      }

      .standalone-main .standalone-preview {
        width: min(100%, max(var(--preview-content-width, 58rem), 72rem));
      }

      .standalone-layout--no-outline {
        grid-template-columns: minmax(0, 1fr);
      }

      .standalone-outline {
        position: sticky;
        top: 1.2rem;
        max-height: calc(100vh - 5rem);
        overflow: auto;
        overflow-x: hidden;
        padding: 1rem 1rem 1rem 1.05rem;
        border-radius: 1.3rem;
        border: 1px solid rgba(24, 45, 43, 0.1);
        background:
          linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(248, 251, 250, 0.9));
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.45),
          0 1rem 2.2rem -1.8rem rgba(15, 32, 31, 0.42);
      }

      html[data-export-theme='dark'] .standalone-outline {
        border-color: rgba(166, 219, 210, 0.12);
        background:
          linear-gradient(180deg, rgba(18, 33, 36, 0.92), rgba(13, 26, 29, 0.88));
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.03),
          0 1.2rem 2.4rem -1.9rem rgba(0, 0, 0, 0.72);
      }

      .standalone-outline::-webkit-scrollbar {
        width: 0.6rem;
      }

      .standalone-outline::-webkit-scrollbar-thumb {
        border: 0.18rem solid transparent;
        border-radius: 999px;
        background: rgba(77, 112, 108, 0.22);
        background-clip: padding-box;
      }

      html[data-export-theme='dark'] .standalone-outline::-webkit-scrollbar-thumb {
        background: rgba(154, 201, 194, 0.18);
        background-clip: padding-box;
      }

      .standalone-outline__header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 0.8rem;
        margin-bottom: 1rem;
      }

      .standalone-outline__kicker {
        margin: 0 0 0.16rem;
        color: #67807c;
        font-size: 0.76rem;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }

      .standalone-outline__title {
        margin: 0;
        color: #152624;
        font-size: 1.18rem;
        font-weight: 800;
        letter-spacing: -0.03em;
      }

      html[data-export-theme='dark'] .standalone-outline__kicker {
        color: #89a59f;
      }

      html[data-export-theme='dark'] .standalone-outline__title {
        color: #f0faf6;
      }

      .standalone-outline__count {
        flex: 0 0 auto;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 2rem;
        height: 2rem;
        padding: 0 0.68rem;
        border-radius: 999px;
        border: 1px solid rgba(18, 62, 58, 0.1);
        background: rgba(255, 255, 255, 0.66);
        color: #496460;
        font-size: 0.82rem;
        font-weight: 700;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4);
      }

      html[data-export-theme='dark'] .standalone-outline__count {
        border-color: rgba(166, 219, 210, 0.12);
        background: rgba(255, 255, 255, 0.04);
        color: #c8ddd8;
      }

      .standalone-outline__groups {
        display: grid;
        gap: 1rem;
      }

      .standalone-outline__group {
        display: grid;
        gap: 0.55rem;
      }

      .standalone-outline__group + .standalone-outline__group {
        padding-top: 0.9rem;
        border-top: 1px solid rgba(26, 91, 85, 0.08);
      }

      html[data-export-theme='dark'] .standalone-outline__group + .standalone-outline__group {
        border-top-color: rgba(154, 201, 194, 0.08);
      }

      .standalone-outline__group-label {
        margin-bottom: 0.08rem;
      }

      .standalone-outline__group-label .standalone-outline__link {
        min-height: 2.7rem;
        padding: 0.72rem 0.9rem 0.72rem 1rem;
        border-radius: 1.05rem;
      }

      .standalone-outline__group-label .standalone-outline__link:hover {
        background: rgba(250, 255, 254, 0.86);
      }

      .standalone-outline__group-label .standalone-outline__link::after {
        opacity: 0;
      }

      .standalone-outline__group-label .standalone-outline__link::before {
        left: 0.42rem;
      }

      .standalone-outline__branch,
      .standalone-outline__tree {
        display: grid;
        gap: 0.2rem;
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .standalone-outline__branch {
        padding-left: 0;
      }

      .standalone-outline__tree {
        margin-top: 0.18rem;
        padding-left: 0.5rem;
      }

      .standalone-outline__list {
        display: grid;
        gap: 0.18rem;
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .standalone-outline__item {
        position: relative;
        min-width: 0;
      }

      .standalone-outline__item--branch + .standalone-outline__item--branch,
      .standalone-outline__item--leaf + .standalone-outline__item--leaf {
        margin-top: 0.02rem;
      }

      .standalone-outline__link {
        position: relative;
        display: flex;
        align-items: flex-start;
        gap: 0.72rem;
        width: 100%;
        min-width: 0;
        min-height: 2.2rem;
        padding: 0.62rem 0.82rem 0.62rem 1rem;
        border-radius: 1rem;
        border: 1px solid transparent;
        color: #39524f;
        text-decoration: none;
        isolation: isolate;
        transition:
          background-color 160ms ease,
          border-color 160ms ease,
          box-shadow 160ms ease,
          color 160ms ease,
          opacity 160ms ease;
      }

      .standalone-outline__link::before {
        content: '';
        position: absolute;
        left: 0.36rem;
        top: 0.45rem;
        bottom: 0.45rem;
        width: 0.2rem;
        border-radius: 999px;
        background: linear-gradient(180deg, #33b9ad, #0b7e77);
        opacity: 0;
        transform: scaleY(0.62);
        transform-origin: center;
        transition:
          opacity 180ms ease,
          transform 180ms ease;
      }

      .standalone-outline__link::after {
        content: '';
        position: absolute;
        left: 1rem;
        top: 50%;
        width: 0.82rem;
        height: 1px;
        background: rgba(29, 89, 84, 0.12);
        transform: translateY(-50%);
        transition:
          background-color 160ms ease,
          width 160ms ease,
          opacity 160ms ease;
      }

      .standalone-outline__link[data-level='1']::after {
        opacity: 0;
      }

      .standalone-outline__link:hover {
        background: rgba(255, 255, 255, 0.62);
        border-color: rgba(9, 127, 122, 0.09);
        color: #133532;
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.5),
          0 0.75rem 1.6rem -1.5rem rgba(18, 67, 63, 0.26);
      }

      .standalone-outline__link:hover::after {
        background: rgba(15, 95, 89, 0.2);
      }

      .standalone-outline__link:focus-visible {
        outline: none;
        border-color: rgba(9, 127, 122, 0.22);
        box-shadow:
          0 0 0 0.18rem rgba(9, 127, 122, 0.12),
          inset 0 1px 0 rgba(255, 255, 255, 0.5);
      }

      .standalone-outline__link.is-active,
      .standalone-outline__link[aria-current='location'] {
        background: linear-gradient(
          180deg,
          rgba(243, 253, 251, 0.96),
          rgba(231, 247, 244, 0.9)
        );
        border-color: rgba(9, 127, 122, 0.14);
        color: #0d3b37;
        font-weight: 700;
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.62),
          0 1rem 2rem -1.7rem rgba(14, 68, 64, 0.34);
      }

      .standalone-outline__link.is-active::before,
      .standalone-outline__link[aria-current='location']::before {
        opacity: 1;
        transform: scaleY(1);
      }

      .standalone-outline__link.is-active::after,
      .standalone-outline__link[aria-current='location']::after {
        background: rgba(9, 127, 122, 0.24);
        width: 0.96rem;
      }

      .standalone-outline__link[data-level='2'] {
        padding-left: 1.5rem;
      }

      .standalone-outline__link[data-level='3'] {
        padding-left: 1.72rem;
      }

      html[data-export-theme='dark'] .standalone-outline__link {
        color: #b9d0cb;
      }

      html[data-export-theme='dark'] .standalone-outline__link::after {
        background: rgba(154, 201, 194, 0.12);
      }

      html[data-export-theme='dark'] .standalone-outline__link:hover {
        background: rgba(255, 255, 255, 0.03);
        border-color: rgba(91, 212, 195, 0.1);
        color: #f2fbf7;
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.04),
          0 0.9rem 1.8rem -1.5rem rgba(0, 0, 0, 0.58);
      }

      html[data-export-theme='dark'] .standalone-outline__link:hover::after {
        background: rgba(154, 201, 194, 0.22);
      }

      html[data-export-theme='dark'] .standalone-outline__link:focus-visible {
        border-color: rgba(91, 212, 195, 0.2);
        box-shadow:
          0 0 0 0.18rem rgba(91, 212, 195, 0.12),
          inset 0 1px 0 rgba(255, 255, 255, 0.04);
      }

      html[data-export-theme='dark'] .standalone-outline__link.is-active,
      html[data-export-theme='dark'] .standalone-outline__link[aria-current='location'] {
        background: linear-gradient(
          180deg,
          rgba(18, 42, 44, 0.98),
          rgba(14, 34, 36, 0.96)
        );
        border-color: rgba(91, 212, 195, 0.16);
        color: #f3fffb;
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.03),
          0 1rem 1.95rem -1.55rem rgba(0, 0, 0, 0.78);
      }

      html[data-export-theme='dark'] .standalone-outline__link.is-active::before,
      html[data-export-theme='dark']
        .standalone-outline__link[aria-current='location']::before {
        background: linear-gradient(180deg, #7be5da, #27b3a6);
      }

      html[data-export-theme='dark'] .standalone-outline__link.is-active::after,
      html[data-export-theme='dark']
        .standalone-outline__link[aria-current='location']::after {
        background: rgba(123, 229, 218, 0.3);
      }

      .standalone-outline__bullet {
        flex: 0 0 auto;
        inline-size: 0.44rem;
        block-size: 0.44rem;
        margin-top: 0.45rem;
        border-radius: 999px;
        background: currentColor;
        opacity: 0.32;
        transition:
          opacity 160ms ease,
          transform 160ms ease,
          background-color 160ms ease;
      }

      .standalone-outline__link:hover .standalone-outline__bullet {
        opacity: 0.48;
      }

      .standalone-outline__link.is-active .standalone-outline__bullet,
      .standalone-outline__link[aria-current='location'] .standalone-outline__bullet {
        opacity: 0.78;
        transform: scale(1.05);
      }

      .standalone-outline__text {
        min-width: 0;
        line-height: 1.42;
        font-size: 0.98rem;
        letter-spacing: -0.01em;
        overflow-wrap: anywhere;
      }

      .standalone-outline__link[data-level='1'] .standalone-outline__text {
        font-size: 1.02rem;
        font-weight: 700;
      }

      .standalone-outline__link[data-level='2'] .standalone-outline__text {
        font-size: 0.96rem;
        font-weight: 620;
      }

      .standalone-outline__link[data-level='3'] .standalone-outline__text {
        font-size: 0.92rem;
        color: #5b7571;
      }

      html[data-export-theme='dark']
        .standalone-outline__link[data-level='3']
        .standalone-outline__text {
        color: #9eb7b1;
      }

      .standalone-main {
        min-width: 0;
      }

      .standalone-footer {
        margin-top: 2rem;
        padding-top: 1rem;
        border-top: 1px solid rgba(24, 45, 43, 0.12);
        color: #5f7471;
        font-size: 0.92rem;
      }

      html[data-export-theme='dark'] .standalone-footer {
        border-color: rgba(166, 219, 210, 0.12);
        color: #96ada8;
      }

      ${PREVIEW_CONTENT_CSS}

      @media (max-width: 900px) {
        .standalone-layout {
          grid-template-columns: minmax(0, 1fr);
        }

        .standalone-outline {
          position: static;
          margin-bottom: 0.3rem;
        }
      }

      @media print {
        body {
          background: white !important;
          padding: 0;
        }

        .standalone-shell {
          box-shadow: none;
          border: none;
          background: transparent;
          padding: 0;
          max-width: none;
        }

        .standalone-layout {
          display: block;
        }

        .standalone-outline {
          display: none;
        }

        .standalone-footer {
          margin-top: 1.5rem;
        }
      }
    </style>
  </head>
  <body>
    <main class="standalone-shell">
      <div class="${standaloneLayoutClass}">
        ${standaloneOutline}
        <section class="standalone-main">
          <article class="standalone-preview">${renderedDocument.html}</article>
      <footer class="standalone-footer">Copyright©2026 Knight | 贺.AllRights Reserved</footer>
        </section>
      </div>
    </main>
    <script>
      (() => {
        const outlineLinks = Array.from(
          document.querySelectorAll('.standalone-outline__link[href^="#"]'),
        )
        if (outlineLinks.length === 0) {
          return
        }

        const headingEntries = outlineLinks
          .map((link) => {
            const href = link.getAttribute('href') || ''
            const headingId = href.startsWith('#') ? href.slice(1) : ''
            const heading = headingId ? document.getElementById(headingId) : null
            return heading ? [heading, link] : null
          })
          .filter(Boolean)

        const headingMap = new Map(headingEntries)
        const linkHeadingMap = new Map(
          headingEntries.map(([heading, link]) => [link, heading]),
        )
        let lockedHeading = null
        let releaseLockTimer = null

        const clearNavigationLock = () => {
          if (releaseLockTimer) {
            window.clearTimeout(releaseLockTimer)
            releaseLockTimer = null
          }

          lockedHeading = null
        }

        const setActiveLink = (activeLink) => {
          outlineLinks.forEach((link) => {
            link.classList.toggle('is-active', link === activeLink)
            if (link === activeLink) {
              link.setAttribute('aria-current', 'location')
            } else {
              link.removeAttribute('aria-current')
            }
          })
        }

        outlineLinks.forEach((link) => {
          link.addEventListener('click', () => {
            const targetHeading = linkHeadingMap.get(link) || null
            if (targetHeading) {
              lockedHeading = targetHeading
              if (releaseLockTimer) {
                window.clearTimeout(releaseLockTimer)
              }

              releaseLockTimer = window.setTimeout(() => {
                clearNavigationLock()
              }, 1200)
            }

            setActiveLink(link)
          })
        })

        const observer = new IntersectionObserver(
          (entries) => {
            const visibleHeadings = entries
              .filter((entry) => entry.isIntersecting)
              .sort(
                (entryA, entryB) =>
                  entryA.boundingClientRect.top - entryB.boundingClientRect.top,
              )

            if (lockedHeading) {
              const targetLink = headingMap.get(lockedHeading) || null
              const hasReachedTarget =
                visibleHeadings.some((entry) => entry.target === lockedHeading) ||
                Math.abs(lockedHeading.getBoundingClientRect().top) < 96

              if (targetLink && hasReachedTarget) {
                setActiveLink(targetLink)
                clearNavigationLock()
                return
              }

              return
            }

            const activeHeading = visibleHeadings[0]?.target
            if (!activeHeading) {
              return
            }

            const activeLink = headingMap.get(activeHeading)
            if (activeLink) {
              setActiveLink(activeLink)
            }
          },
          {
            rootMargin: '0px 0px -72% 0px',
            threshold: [0, 1],
          },
        )

        headingMap.forEach((_link, heading) => {
          observer.observe(heading)
        })

        setActiveLink(outlineLinks[0])
      })()
    </script>
  </body>
</html>`
}

export function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function sanitizeHtml(html: string) {
  return DOMPurify.sanitize(html, {
    ADD_ATTR: [
      'target',
      'rel',
      'class',
      'checked',
      'disabled',
      'type',
      'loading',
      'id',
      'data-source-line',
      'data-source-line-end',
      'data-heading-slug',
      'data-heading-level',
    ],
  })
}

function annotateTokens(tokens: Token[]) {
  const outline: MarkdownOutlineItem[] = []
  const slugCounts = new Map<string, number>()

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]

    if (token.block && token.map && token.nesting !== -1) {
      const lineStart = token.map[0] + 1
      const lineEnd = Math.max(lineStart, token.map[1])
      token.attrSet('data-source-line', String(lineStart))
      token.attrSet('data-source-line-end', String(lineEnd))
      token.attrJoin('class', 'md-source-block')
    }

    if (token.type === 'heading_open' && token.map) {
      const level = Number(token.tag.slice(1))
      const headingText = tokens[index + 1]?.content.trim() || `section-${index}`
      const slug = createUniqueSlug(headingText, slugCounts)
      token.attrSet('id', slug)
      token.attrSet('data-heading-slug', slug)
      token.attrSet('data-heading-level', String(level))

      if (level >= 1 && level <= 3) {
        outline.push({
          level: level as 1 | 2 | 3,
          text: headingText,
          slug,
          lineStart: token.map[0] + 1,
        })
      }
    }
  }

  return outline
}

function createUniqueSlug(text: string, counts: Map<string, number>) {
  const baseSlug =
    text
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .replace(/\s+/gu, '-')
      .replace(/-+/gu, '-') || 'section'

  const currentCount = counts.get(baseSlug) ?? 0
  counts.set(baseSlug, currentCount + 1)

  return currentCount === 0 ? baseSlug : `${baseSlug}-${currentCount + 1}`
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replaceAll(' ', '-')
}

function resolveExportTheme(themeMode: EditorPreferences['themeMode']): ResolvedTheme {
  return themeMode === 'dark' ? 'dark' : 'light'
}

function buildStandaloneOutline(outline: MarkdownOutlineItem[]) {
  if (outline.length === 0) {
    return ''
  }

  const items = outline
    .map(
      (item) => `
          <li class="standalone-outline__item">
            <a
              class="standalone-outline__link"
              data-level="${item.level}"
              href="#${escapeAttribute(item.slug)}"
            >
              <span class="standalone-outline__bullet" aria-hidden="true"></span>
              <span class="standalone-outline__text">${escapeHtml(item.text)}</span>
            </a>
          </li>`,
    )
    .join('')

  return `
        <aside class="standalone-outline" aria-label="文档大纲">
          <div class="standalone-outline__header">
            <div>
              <p class="standalone-outline__kicker">Outline</p>
          <h2 class="standalone-outline__title">文档大纲</h2>
            </div>
            <span class="standalone-outline__count">${outline.length}</span>
          </div>
          <ol class="standalone-outline__list">${items}
          </ol>
        </aside>`
}

void buildStandaloneOutline

function buildStandaloneOutlineTree(outline: MarkdownOutlineItem[]) {
  if (outline.length === 0) {
    return ''
  }

  type OutlineBranch = {
    children: MarkdownOutlineItem[]
    heading: MarkdownOutlineItem | null
  }

  type OutlineGroup = {
    branches: OutlineBranch[]
    heading: MarkdownOutlineItem | null
  }

  const groups: OutlineGroup[] = []
  let currentGroup: OutlineGroup | null = null
  let currentBranch: OutlineBranch | null = null

  const ensureGroup = () => {
    if (currentGroup) {
      return currentGroup
    }

    currentGroup = {
      branches: [],
      heading: null,
    }
    groups.push(currentGroup)
    return currentGroup
  }

  const ensureBranch = () => {
    const group = ensureGroup()
    if (currentBranch) {
      return currentBranch
    }

    currentBranch = {
      children: [],
      heading: null,
    }
    group.branches.push(currentBranch)
    return currentBranch
  }

  outline.forEach((item) => {
    if (item.level === 1) {
      currentGroup = {
        branches: [],
        heading: item,
      }
      groups.push(currentGroup)
      currentBranch = null
      return
    }

    if (item.level === 2) {
      const group = ensureGroup()
      currentBranch = {
        children: [],
        heading: item,
      }
      group.branches.push(currentBranch)
      return
    }

    ensureBranch().children.push(item)
  })

  const renderLink = (item: MarkdownOutlineItem) => `
    <a
      class="standalone-outline__link"
      data-level="${item.level}"
      href="#${escapeAttribute(item.slug)}"
    >
      <span class="standalone-outline__bullet" aria-hidden="true"></span>
      <span class="standalone-outline__text">${escapeHtml(item.text)}</span>
    </a>`

  const groupsMarkup = groups
    .map((group) => {
      const groupLabel = group.heading
        ? `
          <div class="standalone-outline__group-label">
            ${renderLink(group.heading)}
          </div>`
        : ''

      const branchesMarkup = group.branches
        .map((branch) => {
          if (!branch.heading) {
            return branch.children
              .map(
                (child) => `
              <li class="standalone-outline__item standalone-outline__item--leaf">
                ${renderLink(child)}
              </li>`,
              )
              .join('')
          }

          const childTree = branch.children.length
            ? `<ol class="standalone-outline__tree">
                ${branch.children
                  .map(
                    (child) => `
                  <li class="standalone-outline__item standalone-outline__item--leaf">
                    ${renderLink(child)}
                  </li>`,
                  )
                  .join('')}
              </ol>`
            : ''

          return `
            <li class="standalone-outline__item standalone-outline__item--branch">
              ${renderLink(branch.heading)}
              ${childTree}
            </li>`
        })
        .join('')

      return `
        <section class="standalone-outline__group">
          ${groupLabel}
          ${
            branchesMarkup
              ? `<ol class="standalone-outline__branch">${branchesMarkup}
            </ol>`
              : ''
          }
        </section>`
    })
    .join('')

  return `
        <aside class="standalone-outline" aria-label="文档大纲">
          <div class="standalone-outline__header">
            <div>
              <p class="standalone-outline__kicker">Outline</p>
              <h2 class="standalone-outline__title">文档大纲</h2>
            </div>
            <span class="standalone-outline__count">${outline.length}</span>
          </div>
          <div class="standalone-outline__groups">${groupsMarkup}
          </div>
        </aside>`
}
