import type {
  SearchMatch,
  SearchOptions,
  TextRange,
  TextTransformResult,
} from '../types/editor'

export function getSelectionText(source: string, selection: TextRange) {
  return source.slice(selection.from, selection.to)
}

export function wrapSelectionText(
  source: string,
  selection: TextRange,
  before: string,
  after = before,
  placeholder = '文本',
) {
  return replaceSelection(source, selection, (selected) => {
    const content = selected || placeholder
    return {
      text: `${before}${content}${after}`,
      selection: {
        from: before.length,
        to: before.length + content.length,
      },
    }
  })
}

export function insertHeadingText(
  source: string,
  selection: TextRange,
  level: 1 | 2 | 3,
) {
  return updateSelectedLines(source, selection, (line) => {
    const content = line.replace(/^\s{0,3}#{1,6}\s+/u, '')
    return `${'#'.repeat(level)} ${content || '标题'}`
  })
}

export function insertUnorderedListText(source: string, selection: TextRange) {
  return updateSelectedLines(source, selection, (line) => `- ${line || '列表项'}`)
}

export function insertOrderedListText(source: string, selection: TextRange) {
  return updateSelectedLines(source, selection, (line, index) =>
    `${index + 1}. ${line || '列表项'}`,
  )
}

export function insertTaskListText(source: string, selection: TextRange) {
  return updateSelectedLines(source, selection, (line) => `- [ ] ${line || '待办事项'}`)
}

export function insertQuoteText(source: string, selection: TextRange) {
  return updateSelectedLines(source, selection, (line) => `> ${line || '引用内容'}`)
}

export function insertHorizontalRuleText(source: string, selection: TextRange) {
  return replaceSelection(source, selection, () => ({
    text: '\n---\n',
    selection: { from: 5, to: 5 },
  }))
}

export function insertCodeBlockText(source: string, selection: TextRange) {
  return replaceSelection(source, selection, (selected) => {
    const content = selected || '在这里输入代码'
    const header = `\`\`\`${selected ? '' : 'text'}\n`
    const footer = '\n```'

    return {
      text: `${header}${content}${footer}`,
      selection: {
        from: header.length,
        to: header.length + content.length,
      },
    }
  })
}

export function insertTableTemplateText(source: string, selection: TextRange) {
  const tableTemplate = [
    '| 列 1 | 列 2 | 列 3 |',
    '| --- | --- | --- |',
    '| 内容 | 内容 | 内容 |',
    '| 内容 | 内容 | 内容 |',
    '| 内容 | 内容 | 内容 |',
  ].join('\n')

  return replaceSelection(source, selection, () => ({
    text: tableTemplate,
    selection: {
      from: 2,
      to: 4,
    },
  }))
}

export function insertLinkText(
  source: string,
  selection: TextRange,
  label: string,
  url: string,
) {
  const text = label.trim() || getSelectionText(source, selection).trim() || '链接文字'
  return replaceSelection(source, selection, () => ({
    text: `[${text}](${url.trim()})`,
    selection: {
      from: text.length + url.trim().length + 4,
      to: text.length + url.trim().length + 4,
    },
  }))
}

export function insertImageText(
  source: string,
  selection: TextRange,
  alt: string,
  url: string,
) {
  const text = alt.trim() || '图片说明'
  return replaceSelection(source, selection, () => ({
    text: `![${text}](${url.trim()})`,
    selection: {
      from: text.length + url.trim().length + 5,
      to: text.length + url.trim().length + 5,
    },
  }))
}

export function insertPlainText(
  source: string,
  selection: TextRange,
  nextText: string,
) {
  return replaceSelection(source, selection, () => ({
    text: nextText,
    selection: {
      from: nextText.length,
      to: nextText.length,
    },
  }))
}

export function countSearchMatches(
  source: string,
  query: string,
  options: SearchOptions,
) {
  return findAllMatches(source, query, options).length
}

export function findNextMatch(
  source: string,
  query: string,
  fromIndex: number,
  options: SearchOptions,
) {
  if (!query) {
    return null
  }

  const haystack = options.caseSensitive ? source : source.toLowerCase()
  const needle = options.caseSensitive ? query : query.toLowerCase()

  const nextIndex = haystack.indexOf(needle, fromIndex)
  const fallbackIndex = haystack.indexOf(needle, 0)
  const matchIndex = nextIndex >= 0 ? nextIndex : fallbackIndex

  if (matchIndex < 0) {
    return null
  }

  return {
    from: matchIndex,
    to: matchIndex + query.length,
    query,
  }
}

export function replaceSearchMatch(
  source: string,
  match: SearchMatch,
  replacement: string,
) {
  return {
    text: `${source.slice(0, match.from)}${replacement}${source.slice(match.to)}`,
    selection: {
      from: match.from,
      to: match.from + replacement.length,
    },
  }
}

export function replaceAllSearchMatches(
  source: string,
  query: string,
  replacement: string,
  options: SearchOptions,
) {
  const matches = findAllMatches(source, query, options)

  if (matches.length === 0) {
    return {
      text: source,
      count: 0,
      selection: {
        from: 0,
        to: 0,
      },
    }
  }

  let cursor = 0
  let nextText = ''

  for (const match of matches) {
    nextText += source.slice(cursor, match.from)
    nextText += replacement
    cursor = match.to
  }

  nextText += source.slice(cursor)

  return {
    text: nextText,
    count: matches.length,
    selection: {
      from: matches[0].from,
      to: matches[0].from + replacement.length,
    },
  }
}

function replaceSelection(
  source: string,
  selection: TextRange,
  buildReplacement: (selected: string) => {
    text: string
    selection: TextRange
  },
): TextTransformResult {
  const selected = getSelectionText(source, selection)
  const replacement = buildReplacement(selected)
  const nextText =
    source.slice(0, selection.from) + replacement.text + source.slice(selection.to)

  return {
    text: nextText,
    selection: {
      from: selection.from + replacement.selection.from,
      to: selection.from + replacement.selection.to,
    },
  }
}

function updateSelectedLines(
  source: string,
  selection: TextRange,
  mapper: (lineText: string, index: number) => string,
): TextTransformResult {
  const lineStart = source.lastIndexOf('\n', Math.max(0, selection.from - 1)) + 1
  const lineEndIndex = source.indexOf('\n', selection.to)
  const blockEnd = lineEndIndex === -1 ? source.length : lineEndIndex
  const target = source.slice(lineStart, blockEnd)
  const replacement = target
    .split('\n')
    .map((line, index) => mapper(line, index))
    .join('\n')

  return {
    text: source.slice(0, lineStart) + replacement + source.slice(blockEnd),
    selection: {
      from: lineStart,
      to: lineStart + replacement.length,
    },
  }
}

function findAllMatches(
  source: string,
  query: string,
  options: SearchOptions,
) {
  if (!query) {
    return []
  }

  const haystack = options.caseSensitive ? source : source.toLowerCase()
  const needle = options.caseSensitive ? query : query.toLowerCase()
  const matches: SearchMatch[] = []

  let cursor = 0
  while (cursor < haystack.length) {
    const nextIndex = haystack.indexOf(needle, cursor)
    if (nextIndex < 0) {
      break
    }

    matches.push({
      from: nextIndex,
      to: nextIndex + query.length,
      query,
    })

    cursor = nextIndex + Math.max(query.length, 1)
  }

  return matches
}
