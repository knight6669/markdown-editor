import { render, waitFor, within } from '@testing-library/react'
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

function getViewModeSwitch(container: HTMLElement) {
  const viewModeSwitch = container.querySelector(
    '.workspace-summary .workspace-viewbar .segmented-control',
  )
  expect(viewModeSwitch).toBeTruthy()
  return viewModeSwitch as HTMLElement
}

describe('App mobile layout', () => {
  it('defaults to editor mode on mobile', () => {
    mockMatchMedia({
      '(max-width: 767px)': true,
      '(prefers-color-scheme: dark)': false,
    })

    const { container } = render(<App />)

    expect(within(container).getByLabelText('Markdown 编辑区')).toBeInTheDocument()
    expect(
      within(container).queryByLabelText('实时预览区'),
    ).not.toBeInTheDocument()
  })

  it('persists the selected mobile view mode', async () => {
    mockMatchMedia({
      '(max-width: 767px)': true,
      '(prefers-color-scheme: dark)': false,
    })

    const user = userEvent.setup()
    const { container } = render(<App />)

    const viewModeSwitch = getViewModeSwitch(container)
    await user.click(within(viewModeSwitch).getByRole('button', { name: '预览' }))

    await waitFor(() => {
      const stored = window.localStorage.getItem(STORAGE_KEYS.preferences)
      expect(stored).toBeTruthy()
      expect(JSON.parse(stored ?? '{}').mobileViewMode).toBe('preview')
    })

    await waitFor(() => {
      expect(
        within(container).queryByLabelText('Markdown 编辑区'),
      ).not.toBeInTheDocument()
      expect(within(container).getByLabelText('实时预览区')).toBeInTheDocument()
    })
  })
})

describe('App desktop layout', () => {
  it('switches between split, preview and editor modes on desktop', async () => {
    mockMatchMedia({
      '(max-width: 767px)': false,
      '(prefers-color-scheme: dark)': false,
    })

    const user = userEvent.setup()
    const { container } = render(<App />)
    const viewModeSwitch = getViewModeSwitch(container)
    const expectEditorMounted = () => {
      expect(container.querySelector('.editor-host .cm-editor')).toBeTruthy()
    }

    expect(within(container).getByLabelText('Markdown 编辑区')).toBeInTheDocument()
    expect(within(container).getByLabelText('实时预览区')).toBeInTheDocument()
    expectEditorMounted()

    await user.click(within(viewModeSwitch).getByRole('button', { name: '预览' }))

    await waitFor(() => {
      const stored = window.localStorage.getItem(STORAGE_KEYS.preferences)
      expect(stored).toBeTruthy()
      expect(JSON.parse(stored ?? '{}').desktopViewMode).toBe('preview')
      expect(
        within(container).queryByLabelText('Markdown 编辑区'),
      ).not.toBeInTheDocument()
      expect(within(container).getByLabelText('实时预览区')).toBeInTheDocument()
    })

    await user.click(within(viewModeSwitch).getByRole('button', { name: '分屏' }))

    await waitFor(() => {
      expect(within(container).getByLabelText('Markdown 编辑区')).toBeInTheDocument()
      expect(within(container).getByLabelText('实时预览区')).toBeInTheDocument()
      expectEditorMounted()
    })

    await user.click(within(viewModeSwitch).getByRole('button', { name: '编辑' }))

    await waitFor(() => {
      expect(within(container).getByLabelText('Markdown 编辑区')).toBeInTheDocument()
      expect(
        within(container).queryByLabelText('实时预览区'),
      ).not.toBeInTheDocument()
      expectEditorMounted()
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
    const scrollToMock = vi.fn()

    Object.defineProperty(previewScroll as HTMLElement, 'scrollTo', {
      configurable: true,
      value: scrollToMock,
    })

    Object.defineProperty(previewScroll as HTMLElement, 'scrollTop', {
      configurable: true,
      value: 24,
      writable: true,
    })

    Object.defineProperty(previewScroll as HTMLElement, 'getBoundingClientRect', {
      configurable: true,
      value: () =>
        ({
          top: 100,
          left: 0,
          right: 640,
          bottom: 900,
          width: 640,
          height: 800,
          x: 0,
          y: 100,
          toJSON: () => ({}),
        }) satisfies DOMRect,
    })

    Object.defineProperty(targetHeading, 'getBoundingClientRect', {
      configurable: true,
      value: () =>
        ({
          top: 460,
          left: 0,
          right: 620,
          bottom: 520,
          width: 620,
          height: 60,
          x: 0,
          y: 460,
          toJSON: () => ({}),
        }) satisfies DOMRect,
    })

    await user.click(targetOutlineItem)

    expect(scrollToMock).toHaveBeenCalledWith({
      top: 342,
      behavior: 'smooth',
    })
  })
})
