import {
  DEFAULT_DOCUMENT_NAME,
  DEFAULT_EDITOR_PREFERENCES,
  MAX_HISTORY_ITEMS,
  SAMPLE_IMAGE_URLS,
  STORAGE_KEYS,
} from './constants'
import { migrateInlineMarkdownImageAssets } from './image-assets'
import type {
  DraftSaveReason,
  DraftSnapshot,
  DraftStore,
  EditorPreferences,
} from '../types/editor'

type DraftWriteInput = {
  markdown: string
  documentName: string
  reason: DraftSaveReason
}

export function readDraftStore(): DraftStore {
  const parsed = readJsonStorage<DraftStore>(STORAGE_KEYS.draftStore)

  if (!parsed || !Array.isArray(parsed.history)) {
    return {
      current: null,
      history: [],
    }
  }

  const nextStore: DraftStore = {
    current: isDraftSnapshot(parsed.current)
      ? migrateDraftSnapshot(parsed.current)
      : null,
    history: parsed.history
      .filter(isDraftSnapshot)
      .map(migrateDraftSnapshot)
      .slice(0, MAX_HISTORY_ITEMS),
  }

  if (JSON.stringify(parsed) !== JSON.stringify(nextStore)) {
    writeJsonStorage(STORAGE_KEYS.draftStore, nextStore)
  }

  return nextStore
}

export function writeDraftStore(input: DraftWriteInput, existing = readDraftStore()) {
  const nextSnapshot: DraftSnapshot = {
    id: createSnapshotId(),
    markdown: input.markdown,
    documentName: input.documentName || DEFAULT_DOCUMENT_NAME,
    savedAt: Date.now(),
    reason: input.reason,
  }

  const history = [...existing.history]
  if (
    existing.current &&
    existing.current.markdown.trim() &&
    existing.current.markdown !== input.markdown
  ) {
    history.unshift(existing.current)
  }

  const dedupedHistory = dedupeHistory(history, nextSnapshot.markdown).slice(
    0,
    MAX_HISTORY_ITEMS,
  )

  const nextStore: DraftStore = {
    current: nextSnapshot,
    history: dedupedHistory,
  }

  writeJsonStorage(STORAGE_KEYS.draftStore, nextStore)
  return nextStore
}

export function restoreDraftSnapshot(
  snapshotId: string,
  existing = readDraftStore(),
) {
  const snapshot = existing.history.find((item) => item.id === snapshotId)

  if (!snapshot) {
    return existing
  }

  const nextCurrent: DraftSnapshot = {
    ...snapshot,
    id: createSnapshotId(),
    savedAt: Date.now(),
    reason: 'history-restore',
  }

  const nextHistory = dedupeHistory(
    [
      ...(existing.current ? [existing.current] : []),
      ...existing.history.filter((item) => item.id !== snapshotId),
    ],
    nextCurrent.markdown,
  ).slice(0, MAX_HISTORY_ITEMS)

  const nextStore: DraftStore = {
    current: nextCurrent,
    history: nextHistory,
  }

  writeJsonStorage(STORAGE_KEYS.draftStore, nextStore)
  return nextStore
}

export function clearDraftStore() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(STORAGE_KEYS.draftStore)
}

export function clearDraftHistory(existing = readDraftStore()) {
  const nextStore: DraftStore = {
    current: existing.current,
    history: [],
  }

  writeJsonStorage(STORAGE_KEYS.draftStore, nextStore)
  return nextStore
}

export function readEditorPreferences() {
  const parsed = readJsonStorage<EditorPreferences>(STORAGE_KEYS.preferences)

  if (!parsed) {
    return DEFAULT_EDITOR_PREFERENCES
  }

  return {
    ...DEFAULT_EDITOR_PREFERENCES,
    ...parsed,
  }
}

export function writeEditorPreferences(preferences: EditorPreferences) {
  writeJsonStorage(STORAGE_KEYS.preferences, preferences)
}

function readJsonStorage<T>(key: string) {
  if (typeof window === 'undefined') {
    return null
  }

  const value = window.localStorage.getItem(key)
  if (!value) {
    return null
  }

  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

function writeJsonStorage(key: string, value: unknown) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(key, JSON.stringify(value))
}

function dedupeHistory(history: DraftSnapshot[], currentMarkdown: string) {
  const seen = new Set<string>([currentMarkdown])

  return history.filter((snapshot) => {
    const key = `${snapshot.documentName}::${snapshot.markdown}`
    if (seen.has(key) || snapshot.markdown === currentMarkdown) {
      return false
    }

    seen.add(key)
    return true
  })
}

function isDraftSnapshot(value: unknown): value is DraftSnapshot {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.markdown === 'string' &&
    typeof candidate.documentName === 'string' &&
    typeof candidate.savedAt === 'number' &&
    typeof candidate.reason === 'string'
  )
}

function createSnapshotId() {
  return `snapshot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function migrateDraftSnapshot(snapshot: DraftSnapshot): DraftSnapshot {
  const nextMarkdown = migrateInlineMarkdownImageAssets(
    migrateSampleImageUrls(snapshot.markdown),
  )

  if (nextMarkdown === snapshot.markdown) {
    return snapshot
  }

  return {
    ...snapshot,
    markdown: nextMarkdown,
  }
}

function migrateSampleImageUrls(markdown: string) {
  return SAMPLE_IMAGE_URLS.legacy.reduce(
    (currentMarkdown, legacyUrl) =>
      currentMarkdown.replaceAll(legacyUrl, SAMPLE_IMAGE_URLS.current),
    markdown,
  )
}
