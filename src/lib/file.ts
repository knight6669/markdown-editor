import {
  buildStandaloneHtml,
  renderMarkdownDocument,
} from './markdown'
import type { EditorPreferences } from '../types/editor'

export async function readTextFile(file: File) {
  return file.text()
}

export async function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function isMarkdownFile(file: File) {
  return (
    /\.md$/i.test(file.name) ||
    file.type === 'text/markdown' ||
    file.type === 'text/plain'
  )
}

export function isImageFile(file: File) {
  return file.type.startsWith('image/')
}

export function normalizeDocumentName(rawName: string) {
  const nextName = rawName.replace(/\.[^.]+$/u, '').trim()
  return nextName || 'knight-markdown'
}

export function isLikelyUrl(value: string) {
  return /^https?:\/\//iu.test(value.trim())
}

export function isLikelyImageUrl(value: string) {
  const normalized = value.trim()
  return (
    /^data:image\//iu.test(normalized) ||
    /^https?:\/\/.+\.(png|jpe?g|gif|webp|svg|bmp|avif)(\?.*)?$/iu.test(
      normalized,
    )
  )
}

export async function detectImageUrl(value: string) {
  if (isLikelyImageUrl(value)) {
    return true
  }

  if (!isLikelyUrl(value)) {
    return false
  }

  return new Promise<boolean>((resolve) => {
    const image = new Image()
    const timeout = window.setTimeout(() => {
      cleanup()
      resolve(false)
    }, 1500)

    const cleanup = () => {
      window.clearTimeout(timeout)
      image.onload = null
      image.onerror = null
    }

    image.onload = () => {
      cleanup()
      resolve(true)
    }

    image.onerror = () => {
      cleanup()
      resolve(false)
    }

    image.src = value
  })
}

export function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename
  link.click()
  URL.revokeObjectURL(objectUrl)
}

export async function copyTextToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}

export function openPrintWindow(
  markdown: string,
  documentTitle: string,
  preferences: EditorPreferences,
) {
  const standaloneHtml = buildStandaloneHtml(markdown, documentTitle, preferences)
  const iframe = document.createElement('iframe')
  let printTimer: number | null = null
  let cleanupTimer: number | null = null

  const cleanup = () => {
    if (printTimer) {
      window.clearTimeout(printTimer)
      printTimer = null
    }

    if (cleanupTimer) {
      window.clearTimeout(cleanupTimer)
      cleanupTimer = null
    }

    iframe.remove()
  }

  iframe.setAttribute('aria-hidden', 'true')
  iframe.setAttribute('sandbox', 'allow-modals allow-same-origin')
  iframe.tabIndex = -1
  iframe.style.position = 'fixed'
  iframe.style.inlineSize = '0'
  iframe.style.blockSize = '0'
  iframe.style.opacity = '0'
  iframe.style.pointerEvents = 'none'
  iframe.style.border = '0'
  iframe.style.inset = '0'

  iframe.addEventListener(
    'load',
    () => {
      const printTarget = iframe.contentWindow
      if (!printTarget) {
        cleanup()
        return
      }

      printTarget.addEventListener?.('afterprint', cleanup, { once: true })

      printTimer = window.setTimeout(() => {
        try {
          printTarget.focus?.()
          printTarget.print?.()
        } catch {
          cleanup()
        }
      }, 180)

      cleanupTimer = window.setTimeout(cleanup, 60_000)
    },
    { once: true },
  )

  document.body.appendChild(iframe)
  iframe.srcdoc = standaloneHtml
  return true
}

export function createHtmlFragment(markdown: string) {
  return renderMarkdownDocument(markdown).html
}
