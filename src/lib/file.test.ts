import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_EDITOR_PREFERENCES } from './constants'
import { openPrintWindow } from './file'

describe('print export', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('renders the printable document into a hidden iframe and triggers print', () => {
    const originalCreateElement = document.createElement.bind(document)
    const iframe = originalCreateElement('iframe')
    const focusMock = vi.fn()
    const printMock = vi.fn()
    const removeMock = vi.fn()

    Object.defineProperty(iframe, 'contentWindow', {
      configurable: true,
      value: {
        focus: focusMock,
        print: printMock,
        addEventListener: vi.fn(),
      },
    })

    Object.defineProperty(iframe, 'remove', {
      configurable: true,
      value: removeMock,
    })

    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation(((tagName: string) => {
        if (tagName.toLowerCase() === 'iframe') {
          return iframe
        }

        return originalCreateElement(tagName)
      }) as typeof document.createElement)

    const appendSpy = vi.spyOn(document.body, 'appendChild')

    const didOpen = openPrintWindow(
      '# Demo',
      'demo-doc',
      DEFAULT_EDITOR_PREFERENCES,
    )

    expect(didOpen).toBe(true)
    expect(createElementSpy).toHaveBeenCalledWith('iframe')
    expect(appendSpy).toHaveBeenCalledWith(iframe)
    expect(iframe.getAttribute('sandbox')).toBe('allow-modals allow-same-origin')
    expect(iframe.srcdoc).toContain('<!DOCTYPE html>')
    expect(iframe.srcdoc).toContain('demo-doc')

    iframe.dispatchEvent(new Event('load'))
    vi.advanceTimersByTime(181)

    expect(focusMock).toHaveBeenCalledTimes(1)
    expect(printMock).toHaveBeenCalledTimes(1)
  })
})
