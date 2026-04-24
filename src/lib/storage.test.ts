import { describe, expect, it } from 'vitest'
import { SAMPLE_IMAGE_URLS } from './constants'
import {
  clearDraftStore,
  readDraftStore,
  restoreDraftSnapshot,
  writeDraftStore,
  writeEditorPreferences,
  readEditorPreferences,
} from './storage'

describe('draft storage', () => {
  it('persists the current draft and pushes previous content into history', () => {
    writeDraftStore({
      markdown: 'alpha',
      documentName: 'first-doc',
      reason: 'manual',
    })

    const nextStore = writeDraftStore({
      markdown: 'beta',
      documentName: 'second-doc',
      reason: 'manual',
    })

    expect(nextStore.current?.markdown).toBe('beta')
    expect(nextStore.history[0]?.markdown).toBe('alpha')
  })

  it('restores a historical snapshot as the current draft', () => {
    const store = writeDraftStore({
      markdown: 'alpha',
      documentName: 'alpha-doc',
      reason: 'manual',
    })

    const updatedStore = writeDraftStore({
      markdown: 'beta',
      documentName: 'beta-doc',
      reason: 'manual',
    })

    const restored = restoreDraftSnapshot(updatedStore.history[0]?.id ?? '')
    expect(restored.current?.markdown).toBe(store.current?.markdown)
  })

  it('reads and writes editor preferences', () => {
    writeEditorPreferences({
      ...readEditorPreferences(),
      desktopViewMode: 'editor',
      mobileViewMode: 'preview',
      lineNumbers: false,
    })

    const preferences = readEditorPreferences()
    expect(preferences.desktopViewMode).toBe('editor')
    expect(preferences.mobileViewMode).toBe('preview')
    expect(preferences.lineNumbers).toBe(false)
  })

  it('clears the draft store', () => {
    writeDraftStore({
      markdown: 'hello',
      documentName: 'doc',
      reason: 'manual',
    })
    clearDraftStore()
    expect(readDraftStore().current).toBeNull()
  })

  it('migrates legacy sample image urls when reading stored drafts', () => {
    window.localStorage.setItem(
      'knight.markdown-editor.drafts.v2',
      JSON.stringify({
        current: {
          id: 'snapshot-old',
          markdown: `![old](${SAMPLE_IMAGE_URLS.legacy[0]})`,
          documentName: 'doc',
          savedAt: Date.now(),
          reason: 'manual',
        },
        history: [],
      }),
    )

    const store = readDraftStore()
    expect(store.current?.markdown).toContain(SAMPLE_IMAGE_URLS.current)
    expect(store.current?.markdown).not.toContain(SAMPLE_IMAGE_URLS.legacy[0])
  })
})
