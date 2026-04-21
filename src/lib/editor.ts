import { EditorSelection } from '@codemirror/state'
import type { EditorView } from '@codemirror/view'
import type { SearchOptions, TextTransformResult } from '../types/editor'
import {
  countSearchMatches,
  findNextMatch,
  getSelectionText,
  insertCodeBlockText,
  insertHeadingText,
  insertHorizontalRuleText,
  insertImageText,
  insertLinkText,
  insertOrderedListText,
  insertPlainText,
  insertQuoteText,
  insertTableTemplateText,
  insertTaskListText,
  insertUnorderedListText,
  replaceAllSearchMatches,
  replaceSearchMatch,
  wrapSelectionText,
} from './editor-transforms'

export function getSelectedEditorText(view: EditorView) {
  const selection = view.state.selection.main
  return getSelectionText(view.state.doc.toString(), {
    from: selection.from,
    to: selection.to,
  }).trim()
}

export function wrapEditorSelection(
  view: EditorView,
  before: string,
  after = before,
  placeholder = '文本',
) {
  dispatchEditorTransform(view, (source, selection) =>
    wrapSelectionText(source, selection, before, after, placeholder),
  )
}

export function insertHeading(view: EditorView, level: 1 | 2 | 3) {
  dispatchEditorTransform(view, (source, selection) =>
    insertHeadingText(source, selection, level),
  )
}

export function insertUnorderedList(view: EditorView) {
  dispatchEditorTransform(view, insertUnorderedListText)
}

export function insertOrderedList(view: EditorView) {
  dispatchEditorTransform(view, insertOrderedListText)
}

export function insertTaskList(view: EditorView) {
  dispatchEditorTransform(view, insertTaskListText)
}

export function insertQuote(view: EditorView) {
  dispatchEditorTransform(view, insertQuoteText)
}

export function insertHorizontalRule(view: EditorView) {
  dispatchEditorTransform(view, insertHorizontalRuleText)
}

export function insertCodeBlock(view: EditorView) {
  dispatchEditorTransform(view, insertCodeBlockText)
}

export function insertTableTemplate(view: EditorView) {
  dispatchEditorTransform(view, insertTableTemplateText)
}

export function insertLink(view: EditorView, label: string, url: string) {
  dispatchEditorTransform(view, (source, selection) =>
    insertLinkText(source, selection, label, url),
  )
}

export function insertImage(view: EditorView, alt: string, url: string) {
  dispatchEditorTransform(view, (source, selection) =>
    insertImageText(source, selection, alt, url),
  )
}

export function insertPlainTextAtSelection(view: EditorView, nextText: string) {
  dispatchEditorTransform(view, (source, selection) =>
    insertPlainText(source, selection, nextText),
  )
}

export function selectSearchMatch(
  view: EditorView,
  query: string,
  options: SearchOptions,
) {
  const selection = view.state.selection.main
  const source = view.state.doc.toString()
  const match = findNextMatch(source, query, selection.to, options)

  if (!match) {
    return null
  }

  view.dispatch({
    selection: EditorSelection.range(match.from, match.to),
    scrollIntoView: true,
  })
  view.focus()
  return match
}

export function replaceCurrentMatch(
  view: EditorView,
  query: string,
  replacement: string,
  options: SearchOptions,
) {
  const source = view.state.doc.toString()
  const selection = view.state.selection.main
  const selectedText = source.slice(selection.from, selection.to)
  const normalizedSelected = options.caseSensitive
    ? selectedText
    : selectedText.toLowerCase()
  const normalizedQuery = options.caseSensitive ? query : query.toLowerCase()

  const activeMatch =
    normalizedSelected === normalizedQuery
      ? { from: selection.from, to: selection.to, query }
      : findNextMatch(source, query, selection.from, options)

  if (!activeMatch) {
    return null
  }

  const nextState = replaceSearchMatch(source, activeMatch, replacement)
  view.dispatch({
    changes: {
      from: 0,
      to: source.length,
      insert: nextState.text,
    },
    selection: EditorSelection.range(
      nextState.selection.from,
      nextState.selection.to,
    ),
    scrollIntoView: true,
  })
  view.focus()
  return activeMatch
}

export function replaceAllMatches(
  view: EditorView,
  query: string,
  replacement: string,
  options: SearchOptions,
) {
  const source = view.state.doc.toString()
  const result = replaceAllSearchMatches(source, query, replacement, options)

  if (result.count === 0) {
    return 0
  }

  view.dispatch({
    changes: {
      from: 0,
      to: source.length,
      insert: result.text,
    },
    selection: EditorSelection.range(
      result.selection.from,
      result.selection.to,
    ),
    scrollIntoView: true,
  })
  view.focus()
  return result.count
}

export function getSearchMatchCount(
  view: EditorView,
  query: string,
  options: SearchOptions,
) {
  return countSearchMatches(view.state.doc.toString(), query, options)
}

export function replaceEditorDocument(
  view: EditorView,
  nextDocument: string,
  selectionFrom = 0,
) {
  view.dispatch({
    changes: {
      from: 0,
      to: view.state.doc.length,
      insert: nextDocument,
    },
    selection: EditorSelection.cursor(selectionFrom),
  })
}

export function scrollEditorToLine(view: EditorView, lineNumber: number) {
  const safeLine = clampLineNumber(view, lineNumber)
  const position = view.state.doc.line(safeLine).from
  const block = view.lineBlockAt(position)
  view.scrollDOM.scrollTop = Math.max(block.top - 24, 0)
}

export function getFirstVisibleEditorLine(view: EditorView) {
  const firstBlock = view.viewportLineBlocks[0]
  if (!firstBlock) {
    return 1
  }

  return view.state.doc.lineAt(firstBlock.from).number
}

function dispatchEditorTransform(
  view: EditorView,
  transform: (
    source: string,
    selection: { from: number; to: number },
  ) => TextTransformResult,
) {
  const source = view.state.doc.toString()
  const selection = view.state.selection.main
  const nextState = transform(source, {
    from: selection.from,
    to: selection.to,
  })

  view.dispatch({
    changes: {
      from: 0,
      to: source.length,
      insert: nextState.text,
    },
    selection: EditorSelection.range(
      nextState.selection.from,
      nextState.selection.to,
    ),
    scrollIntoView: true,
  })

  view.focus()
}

function clampLineNumber(view: EditorView, lineNumber: number) {
  return Math.min(
    Math.max(1, lineNumber),
    view.state.doc.lines || 1,
  )
}
