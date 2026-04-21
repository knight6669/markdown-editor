import { describe, expect, it } from 'vitest'
import { STORAGE_KEYS } from './constants'
import {
  migrateInlineMarkdownImageAssets,
  resolveMarkdownImageAssets,
} from './image-assets'

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
    const imageStore = window.localStorage.getItem(STORAGE_KEYS.imageAssets)

    expect(imageStore).toContain('data:image/png;base64,BBBB')
    expect(resolveMarkdownImageAssets(stored)).toContain('data:image/png;base64,BBBB')
  })
})
