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
    expect(rendered.html).toContain('data-source-line-end="1"')
    expect(rendered.html).toContain('data-heading-slug="title"')
  })

  it('builds a standalone html export with outline links and styles', () => {
    const html = buildStandaloneHtml(
      '# Demo\n\n## Section\n\n### Detail',
      'demo-doc',
      DEFAULT_EDITOR_PREFERENCES,
    )

    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('demo-doc')
    expect(html).toContain('standalone-outline__count')
    expect(html).toContain('standalone-outline__groups')
    expect(html).toContain('standalone-outline__group-label')
    expect(html).toContain('href="#demo"')
    expect(html).toContain('href="#section"')
    expect(html).toContain('href="#detail"')
    expect(html).toContain(
      'document.querySelectorAll(\'.standalone-outline__link[href^="#"]\')',
    )
    expect(html).toContain('Copyright©2026 Knight | 贺.AllRights Reserved')
  })
})
