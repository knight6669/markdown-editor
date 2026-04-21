import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App'
import { STORAGE_KEYS } from './lib/constants'

function mockMatchMedia(matchesByQuery: Record<string, boolean>) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: matchesByQuery[query] ?? false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

describe('App mobile layout', () => {
  it('persists the selected mobile view mode', async () => {
    mockMatchMedia({
      '(max-width: 767px)': true,
      '(prefers-color-scheme: dark)': false,
    })

    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '预览' }))

    await waitFor(() => {
      const stored = window.localStorage.getItem(STORAGE_KEYS.preferences)
      expect(stored).toBeTruthy()
      expect(JSON.parse(stored ?? '{}').mobileViewMode).toBe('preview')
    })

    await waitFor(() => {
      expect(screen.queryByLabelText('Markdown 编辑区')).not.toBeInTheDocument()
      expect(screen.getByLabelText('实时预览区')).toBeInTheDocument()
    })
  })
})

describe('App outline navigation', () => {
  it('scrolls the preview panel to the matching heading when an outline item is clicked', async () => {
    mockMatchMedia({
      '(max-width: 767px)': false,
      '(prefers-color-scheme: dark)': false,
    })

    const user = userEvent.setup()
    const { container } = render(<App />)

    const outlineItems = container.querySelectorAll<HTMLButtonElement>('.outline-item')
    const previewHeadings = container.querySelectorAll<HTMLElement>(
      '.preview-scroll [data-heading-slug]',
    )
    const previewScroll = container.querySelector<HTMLElement>('.preview-scroll')

    expect(outlineItems.length).toBeGreaterThan(2)
    expect(previewHeadings.length).toBeGreaterThan(2)
    expect(previewScroll).toBeTruthy()

    const targetOutlineItem = outlineItems[2]
    const targetHeading = previewHeadings[2]
    const scrollIntoViewMock = vi.fn()
    const scrollToMock = vi.fn()

    Object.defineProperty(targetHeading, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoViewMock,
    })

    Object.defineProperty(previewScroll as HTMLElement, 'scrollTo', {
      configurable: true,
      value: scrollToMock,
    })

    await user.click(targetOutlineItem)

    expect(scrollIntoViewMock).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest',
    })
    expect(scrollToMock).not.toHaveBeenCalledWith({
      top: expect.any(Number),
      behavior: 'smooth',
    })
  })
})
