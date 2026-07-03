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

  it('keeps strong emphasis when content ends with Chinese punctuation', () => {
    const rendered = renderMarkdownDocument(
      '如**123、**，**我们，** **我们？** **我们！**',
    )

    expect(rendered.html).toContain('<strong>123、</strong>')
    expect(rendered.html).toContain('<strong>我们，</strong>')
    expect(rendered.html).toContain('<strong>我们？</strong>')
    expect(rendered.html).toContain('<strong>我们！</strong>')
  })

  it('renders strong emphasis when markers are adjacent to Chinese text', () => {
    const rendered = renderMarkdownDocument('覆盖经营主体**类型、**行业门类')

    expect(rendered.html).toContain('覆盖经营主体<strong>类型、</strong>行业门类')
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
