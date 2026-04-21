import { startTransition, useEffect, useState } from 'react'
import { PREVIEW_DEBOUNCE } from '../lib/constants'
import { renderMarkdownDocument } from '../lib/markdown'
import { useDebouncedValue } from './useDebouncedValue'

export function useMarkdownPreview(markdownText: string) {
  const debouncedMarkdown = useDebouncedValue(markdownText, PREVIEW_DEBOUNCE)
  const [renderedDocument, setRenderedDocument] = useState(() =>
    renderMarkdownDocument(markdownText),
  )

  useEffect(() => {
    startTransition(() => {
      setRenderedDocument(renderMarkdownDocument(debouncedMarkdown))
    })
  }, [debouncedMarkdown])

  return renderedDocument
}
