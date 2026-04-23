import { describe, expect, it } from 'vitest'
import {
  findPreviewAnchorForLine,
  getPreviewTargetTopForLine,
  type PreviewAnchor,
} from './preview-sync'

function createAnchor(
  lineStart: number,
  lineEnd: number,
  depth: number,
  order: number,
): PreviewAnchor {
  return {
    element: document.createElement('div'),
    lineStart,
    lineEnd,
    slug: null,
    depth,
    order,
  }
}

describe('preview sync anchor matching', () => {
  it('prefers the most specific block that contains the active source line', () => {
    const section = createAnchor(107, 112, 0, 0)
    const listItem = createAnchor(109, 112, 1, 1)
    const paragraph = createAnchor(109, 110, 2, 2)

    const match = findPreviewAnchorForLine([section, listItem, paragraph], 110)

    expect(match).toBe(paragraph)
  })

  it('falls back to the closest previous block when the source line is a spacer line', () => {
    const first = createAnchor(12, 14, 0, 0)
    const second = createAnchor(16, 18, 0, 1)

    const match = findPreviewAnchorForLine([first, second], 15)

    expect(match).toBe(first)
  })

  it('interpolates preview target top between neighboring anchors for smoother scroll follow', () => {
    const container = document.createElement('div')
    Object.defineProperty(container, 'scrollTop', {
      configurable: true,
      value: 0,
      writable: true,
    })
    Object.defineProperty(container, 'getBoundingClientRect', {
      configurable: true,
      value: () =>
        ({
          top: 100,
          left: 0,
          right: 600,
          bottom: 900,
          width: 600,
          height: 800,
          x: 0,
          y: 100,
          toJSON: () => ({}),
        }) satisfies DOMRect,
    })

    const first = createAnchor(10, 14, 0, 0)
    const second = createAnchor(20, 24, 0, 1)

    Object.defineProperty(first.element, 'getBoundingClientRect', {
      configurable: true,
      value: () =>
        ({
          top: 160,
          left: 0,
          right: 560,
          bottom: 220,
          width: 560,
          height: 60,
          x: 0,
          y: 160,
          toJSON: () => ({}),
        }) satisfies DOMRect,
    })

    Object.defineProperty(second.element, 'getBoundingClientRect', {
      configurable: true,
      value: () =>
        ({
          top: 360,
          left: 0,
          right: 560,
          bottom: 420,
          width: 560,
          height: 60,
          x: 0,
          y: 360,
          toJSON: () => ({}),
        }) satisfies DOMRect,
    })

    const targetTop = getPreviewTargetTopForLine(
      container,
      [first, second],
      15,
    )

    expect(targetTop).toBe(142)
  })
})
