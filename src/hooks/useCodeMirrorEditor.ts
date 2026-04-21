import { basicSetup } from 'codemirror'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { markdown } from '@codemirror/lang-markdown'
import {
  Compartment,
  EditorSelection,
  EditorState,
  type Extension,
} from '@codemirror/state'
import { EditorView, keymap, placeholder, type KeyBinding } from '@codemirror/view'
import { tags as t } from '@lezer/highlight'
import { useEffect, useRef, useState } from 'react'
import {
  detectImageUrl,
  isImageFile,
  isLikelyUrl,
  readFileAsDataUrl,
} from '../lib/file'
import {
  getSelectedEditorText,
  insertImage,
  insertOrderedList,
  insertPlainTextAtSelection,
  wrapEditorSelection,
} from '../lib/editor'
import { saveImageAssetDataUrl } from '../lib/image-assets'
import type { ResolvedTheme } from '../types/editor'

type UseCodeMirrorEditorArgs = {
  markdownText: string
  lineWrapping: boolean
  resolvedTheme: ResolvedTheme
  onChange: (nextMarkdown: string) => void
  onFocus: () => void
  onOpenLinkDialog: () => void
  onOpenCommandPalette: () => void
  onOpenFindPanel: () => void
  onSave: () => void
}

const EDITOR_BODY_FONT_STACK =
  '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", "Helvetica Neue", Arial, sans-serif'

export function useCodeMirrorEditor({
  markdownText,
  lineWrapping,
  resolvedTheme,
  onChange,
  onFocus,
  onOpenLinkDialog,
  onOpenCommandPalette,
  onOpenFindPanel,
  onSave,
}: UseCodeMirrorEditorArgs) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const editorViewRef = useRef<EditorView | null>(null)
  const [editorView, setEditorView] = useState<EditorView | null>(null)
  const initialMarkdownRef = useRef(markdownText)
  const initialLineWrappingRef = useRef(lineWrapping)
  const initialThemeRef = useRef(resolvedTheme)
  const isApplyingExternalChangeRef = useRef(false)
  const lineWrappingCompartmentRef = useRef(new Compartment())
  const themeCompartmentRef = useRef(new Compartment())
  const callbacksRef = useRef({
    onChange,
    onFocus,
    onOpenLinkDialog,
    onOpenCommandPalette,
    onOpenFindPanel,
    onSave,
  })

  useEffect(() => {
    callbacksRef.current = {
      onChange,
      onFocus,
      onOpenLinkDialog,
      onOpenCommandPalette,
      onOpenFindPanel,
      onSave,
    }
  }, [
    onChange,
    onFocus,
    onOpenLinkDialog,
    onOpenCommandPalette,
    onOpenFindPanel,
    onSave,
  ])

  useEffect(() => {
    if (!hostRef.current) {
      return
    }

    const createKeyBinding = (
      key: string,
      run: (view: EditorView) => void,
    ): KeyBinding => ({
      key,
      run: (view) => {
        run(view)
        return true
      },
    })

    const view = new EditorView({
      state: EditorState.create({
        doc: initialMarkdownRef.current,
        extensions: [
          basicSetup,
          markdown(),
          themeCompartmentRef.current.of(
            createEditorAppearance(initialThemeRef.current),
          ),
          lineWrappingCompartmentRef.current.of(
            initialLineWrappingRef.current ? EditorView.lineWrapping : [],
          ),
          placeholder('在这里写 Markdown，右侧会实时渲染预览。'),
          EditorState.tabSize.of(2),
          EditorView.updateListener.of((update) => {
            if (!update.docChanged) {
              return
            }

            if (isApplyingExternalChangeRef.current) {
              isApplyingExternalChangeRef.current = false
              return
            }

            callbacksRef.current.onChange(update.state.doc.toString())
          }),
          EditorView.domEventHandlers({
            focus: () => {
              callbacksRef.current.onFocus()
            },
            paste: (event, view) => {
              const clipboardFiles = Array.from(
                event.clipboardData?.files ?? [],
              )
              const imageFile = clipboardFiles.find(isImageFile)

              if (imageFile) {
                event.preventDefault()
                void readFileAsDataUrl(imageFile).then((dataUrl) => {
                  insertImage(
                    view,
                    normalizeImageAlt(imageFile.name),
                    saveImageAssetDataUrl(dataUrl),
                  )
                })
                return true
              }

              const pastedText = event.clipboardData?.getData('text/plain').trim()
              if (!pastedText || !isLikelyUrl(pastedText)) {
                return false
              }

              event.preventDefault()
              void detectImageUrl(pastedText).then((isImageUrl) => {
                if (isImageUrl) {
                  insertImage(view, '粘贴图片', pastedText)
                } else {
                  insertPlainTextAtSelection(view, pastedText)
                }
              })
              return true
            },
          }),
          keymap.of([
            createKeyBinding('Mod-b', (view) =>
              wrapEditorSelection(view, '**', '**', '加粗文本'),
            ),
            createKeyBinding('Mod-i', (view) =>
              wrapEditorSelection(view, '*', '*', '斜体文本'),
            ),
            createKeyBinding('Mod-k', () => {
              callbacksRef.current.onOpenLinkDialog()
            }),
            createKeyBinding('Mod-Shift-c', (view) =>
              wrapEditorSelection(view, '`', '`', 'inline-code'),
            ),
            createKeyBinding('Mod-Shift-7', (view) => insertOrderedList(view)),
            createKeyBinding('Mod-f', () => {
              callbacksRef.current.onOpenFindPanel()
            }),
            createKeyBinding('Mod-p', () => {
              callbacksRef.current.onOpenCommandPalette()
            }),
            createKeyBinding('Mod-s', () => {
              callbacksRef.current.onSave()
            }),
          ]),
        ],
      }),
      parent: hostRef.current,
    })

    editorViewRef.current = view
    setEditorView(view)

    return () => {
      view.destroy()
      editorViewRef.current = null
      setEditorView(null)
    }
  }, [])

  useEffect(() => {
    const view = editorViewRef.current
    if (!view) {
      return
    }

    view.dispatch({
      effects: lineWrappingCompartmentRef.current.reconfigure(
        lineWrapping ? EditorView.lineWrapping : [],
      ),
    })
  }, [lineWrapping])

  useEffect(() => {
    const view = editorViewRef.current
    if (!view) {
      return
    }

    view.dispatch({
      effects: themeCompartmentRef.current.reconfigure(
        createEditorAppearance(resolvedTheme),
      ),
    })
  }, [resolvedTheme])

  useEffect(() => {
    const view = editorViewRef.current
    if (!view) {
      return
    }

    const currentValue = view.state.doc.toString()
    if (currentValue === markdownText) {
      return
    }

    const currentSelection = view.state.selection.main
    isApplyingExternalChangeRef.current = true
    view.dispatch({
      changes: {
        from: 0,
        to: currentValue.length,
        insert: markdownText,
      },
      selection: EditorSelection.range(
        Math.min(currentSelection.anchor, markdownText.length),
        Math.min(currentSelection.head, markdownText.length),
      ),
    })
  }, [markdownText])

  return {
    hostRef,
    editorViewRef,
    editorView,
    getSelectedText: () => {
      const view = editorViewRef.current
      return view ? getSelectedEditorText(view) : ''
    },
    focusEditor: () => {
      editorViewRef.current?.focus()
    },
  }
}

function normalizeImageAlt(fileName: string) {
  const withoutExtension = fileName.replace(/\.[^.]+$/u, '')
  return withoutExtension || '粘贴图片'
}

function createEditorAppearance(resolvedTheme: ResolvedTheme): Extension {
  const isDark = resolvedTheme === 'dark'

  return [
    EditorView.theme(
      {
        '&': {
          height: '100%',
          backgroundColor: 'transparent',
          color: 'var(--body-text)',
        },
        '.cm-scroller': {
          overflow: 'auto',
          fontFamily: EDITOR_BODY_FONT_STACK,
          fontSize: 'var(--editor-font-size)',
          lineHeight: '1.7',
        },
        '.cm-content': {
          padding: '1.25rem 1.25rem 3rem',
          minHeight: '100%',
          caretColor: 'var(--accent-strong)',
        },
        '.cm-placeholder': {
          color: isDark
            ? 'rgba(200, 221, 215, 0.52)'
            : 'rgba(95, 116, 113, 0.72)',
        },
        '&.cm-focused': {
          outline: 'none',
        },
        '.cm-line': {
          paddingInline: '0.12rem',
        },
        '.cm-cursor, .cm-dropCursor': {
          borderLeftColor: 'var(--accent-strong)',
        },
        '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection':
          {
            backgroundColor: 'var(--selection)',
          },
        '.cm-activeLine': {
          backgroundColor: 'var(--editor-active-line)',
        },
        '.cm-activeLineGutter': {
          backgroundColor: 'transparent',
        },
        '.cm-gutters': {
          backgroundColor: 'transparent',
          color: 'var(--editor-gutter)',
          border: 'none',
          fontFamily: EDITOR_BODY_FONT_STACK,
        },
      },
      { dark: isDark },
    ),
    syntaxHighlighting(createMarkdownHighlightStyle(resolvedTheme)),
  ]
}

function createMarkdownHighlightStyle(
  resolvedTheme: ResolvedTheme,
): HighlightStyle {
  const isDark = resolvedTheme === 'dark'

  return HighlightStyle.define([
    {
      tag: t.heading,
      color: isDark ? '#f7fffd' : '#153632',
      fontWeight: '800',
    },
    {
      tag: [t.processingInstruction, t.meta, t.separator, t.contentSeparator],
      color: isDark ? '#74e5d7' : '#0d857d',
      fontWeight: '700',
    },
    {
      tag: [t.link, t.url],
      color: isDark ? '#98ddff' : '#0e77ca',
      textDecoration: 'underline',
      textDecorationThickness: '0.08em',
      textDecorationColor: isDark
        ? 'rgba(152, 221, 255, 0.44)'
        : 'rgba(14, 119, 202, 0.28)',
    },
    {
      tag: [t.string, t.special(t.string)],
      color: isDark ? '#9dece1' : '#108d82',
    },
    {
      tag: [t.quote, t.comment],
      color: isDark ? '#c1d4d0' : '#637774',
      fontStyle: 'italic',
    },
    {
      tag: [t.list, t.atom],
      color: isDark ? '#d8e6e1' : '#273938',
      fontWeight: '500',
    },
    {
      tag: t.emphasis,
      color: isDark ? '#eef8f5' : '#284240',
      fontStyle: 'italic',
    },
    {
      tag: t.strong,
      color: isDark ? '#ffffff' : '#132826',
      fontWeight: '800',
    },
    {
      tag: t.strikethrough,
      color: isDark ? '#dbece8' : '#435856',
      textDecoration: 'line-through',
    },
    {
      tag: t.monospace,
      color: isDark ? '#ffc98d' : '#9e5d17',
      backgroundColor: isDark
        ? 'rgba(255, 201, 141, 0.08)'
        : 'rgba(158, 93, 23, 0.08)',
      borderRadius: '0.28rem',
      fontFamily: 'var(--app-code-font)',
    },
    {
      tag: t.invalid,
      color: isDark ? '#ff9d9d' : '#c95151',
    },
  ])
}
