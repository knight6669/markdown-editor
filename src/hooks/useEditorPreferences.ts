import { useEffect, useState } from 'react'
import {
  readEditorPreferences,
  writeEditorPreferences,
} from '../lib/storage'
import type { EditorPreferences } from '../types/editor'

export function useEditorPreferences() {
  const [preferences, setPreferences] = useState(() => readEditorPreferences())

  useEffect(() => {
    writeEditorPreferences(preferences)
  }, [preferences])

  const updatePreferences = (patch: Partial<EditorPreferences>) => {
    setPreferences((current) => ({
      ...current,
      ...patch,
    }))
  }

  return {
    preferences,
    setPreferences,
    updatePreferences,
  }
}
