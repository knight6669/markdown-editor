import { describe, expect, it } from 'vitest'
import { DEFAULT_EDITOR_PREFERENCES } from './constants'
import { buildStandaloneHtml, renderMarkdownDocument } from './markdown'

describe('markdown rendering', () => {
  it('extracts outline items and source line markers', () => {
    const rendered = renderMarkdownDocument('# Title\n\n## Section\n\nParagraph')

    expect(rendered.outline).toEqual([
      {
        level: 1,
        text: 'Title',
        slug: 'title',
        lineStart: 1,
      },
      {
        level: 2,
        text: 'Section',
        slug: 'section',
        lineStart: 3,
      },
    ])

    expect(rendered.html).toContain('data-source-line="1"')
    expect(rendered.html).toContain('data-heading-slug="title"')
  })

  it('builds a standalone html export with copyright and styles', () => {
    const html = buildStandaloneHtml(
      '# Demo',
      'demo-doc',
      DEFAULT_EDITOR_PREFERENCES,
    )

    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('demo-doc')
    expect(html).toContain('Copyright©2026 Knight | 贺.AllRights Reserved')
  })
})
