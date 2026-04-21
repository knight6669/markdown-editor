import { useState } from 'react'
import {
  clearDraftHistory,
  clearDraftStore,
  readDraftStore,
  restoreDraftSnapshot,
  writeDraftStore,
} from '../lib/storage'
import type { DraftSaveReason } from '../types/editor'

type PersistDraftInput = {
  markdown: string
  documentName: string
  reason: DraftSaveReason
}

export function useDraftHistory() {
  const [draftStore, setDraftStore] = useState(() => readDraftStore())

  const persistDraft = (input: PersistDraftInput) => {
    const nextStore = writeDraftStore(input, draftStore)
    setDraftStore(nextStore)
    return nextStore
  }

  const restoreSnapshot = (snapshotId: string) => {
    const nextStore = restoreDraftSnapshot(snapshotId, draftStore)
    setDraftStore(nextStore)
    return nextStore
  }

  const resetDrafts = () => {
    clearDraftStore()
    setDraftStore({
      current: null,
      history: [],
    })
  }

  const wipeHistory = () => {
    const nextStore = clearDraftHistory(draftStore)
    setDraftStore(nextStore)
    return nextStore
  }

  return {
    draftStore,
    persistDraft,
    restoreSnapshot,
    resetDrafts,
    wipeHistory,
  }
}
