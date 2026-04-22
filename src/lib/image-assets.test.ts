import { describe, expect, it, vi } from 'vitest'
import {
  ensureImageAssetCacheHydrated,
  migrateInlineMarkdownImageAssets,
  resolveMarkdownImageAssets,
} from './image-assets'
import { STORAGE_KEYS } from './constants'

describe('image asset references', () => {
  it('replaces inline data urls with short markdown asset references', () => {
    const migrated = migrateInlineMarkdownImageAssets(
      '![demo](data:image/png;base64,AAAA)',
    )

    expect(migrated).toContain('![demo](knight-image://')
    expect(migrated).not.toContain('data:image/png;base64,AAAA')
  })

  it('resolves markdown asset references back to image data urls for rendering', () => {
    const stored = migrateInlineMarkdownImageAssets(
      '![demo](data:image/png;base64,BBBB)',
    )

    expect(resolveMarkdownImageAssets(stored)).toContain('data:image/png;base64,BBBB')
  })

  it('keeps pasted images available even when persistent storage is unavailable', () => {
    const originalIndexedDb = window.indexedDB
    const setItemSpy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new DOMException('quota', 'QuotaExceededError')
      })

    Object.defineProperty(window, 'indexedDB', {
      configurable: true,
      value: undefined,
    })

    const stored = migrateInlineMarkdownImageAssets(
      '![demo](data:image/png;base64,CCCC)',
    )

    expect(resolveMarkdownImageAssets(stored)).toContain('data:image/png;base64,CCCC')

    setItemSpy.mockRestore()
    Object.defineProperty(window, 'indexedDB', {
      configurable: true,
      value: originalIndexedDb,
    })
  })

  it('hydrates legacy localStorage assets into the runtime cache', async () => {
    window.localStorage.setItem(
      STORAGE_KEYS.imageAssets,
      JSON.stringify({
        'img-legacy': 'data:image/png;base64,DDDD',
      }),
    )

    await ensureImageAssetCacheHydrated()

    expect(
      resolveMarkdownImageAssets('![demo](knight-image://img-legacy)'),
    ).toContain('data:image/png;base64,DDDD')
  })
})
