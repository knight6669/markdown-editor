import { describe, expect, it } from 'vitest'
import {
  insertOrderedListText,
  insertTableTemplateText,
  replaceAllSearchMatches,
  wrapSelectionText,
} from './editor-transforms'

describe('editor transforms', () => {
  it('wraps selected text for toolbar actions', () => {
    const result = wrapSelectionText('hello world', { from: 6, to: 11 }, '**')
    expect(result.text).toBe('hello **world**')
    expect(result.selection).toEqual({ from: 8, to: 13 })
  })

  it('turns selected lines into an ordered list', () => {
    const result = insertOrderedListText('alpha\nbeta', { from: 0, to: 10 })
    expect(result.text).toBe('1. alpha\n2. beta')
  })

  it('inserts a 3x3 markdown table template', () => {
    const result = insertTableTemplateText('', { from: 0, to: 0 })
    expect(result.text).toContain('| 列 1 | 列 2 | 列 3 |')
    expect(result.text.split('\n')).toHaveLength(5)
  })

  it('replaces all search matches', () => {
    const result = replaceAllSearchMatches(
      'draft draft draft',
      'draft',
      'note',
      { caseSensitive: true },
    )

    expect(result.count).toBe(3)
    expect(result.text).toBe('note note note')
  })
})
