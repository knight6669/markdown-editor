import { startTransition, useEffect, useState } from 'react'
import { PREVIEW_DEBOUNCE } from '../lib/constants'
import { renderMarkdownDocument } from '../lib/markdown'
import {
  ensureImageAssetCacheHydrated,
  subscribeToImageAssetChanges,
} from '../lib/image-assets'
import { useDebouncedValue } from './useDebouncedValue'

export function useMarkdownPreview(markdownText: string) {
  const debouncedMarkdown = useDebouncedValue(markdownText, PREVIEW_DEBOUNCE)
  const [imageAssetVersion, setImageAssetVersion] = useState(0)
  const [renderedDocument, setRenderedDocument] = useState(() =>
    renderMarkdownDocument(markdownText),
  )

  useEffect(() => {
    void ensureImageAssetCacheHydrated()

    return subscribeToImageAssetChanges(() => {
      setImageAssetVersion((current) => current + 1)
    })
  }, [])

  useEffect(() => {
    startTransition(() => {
      setRenderedDocument(renderMarkdownDocument(debouncedMarkdown))
    })
  }, [debouncedMarkdown, imageAssetVersion])

  return renderedDocument
}
