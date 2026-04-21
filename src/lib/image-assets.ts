import { STORAGE_KEYS } from './constants'

const IMAGE_ASSET_PREFIX = 'knight-image://'
const INLINE_IMAGE_PATTERN =
  /!\[([^\]]*)\]\((data:image\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=\r\n]+)\)/giu

type ImageAssetStore = Record<string, string>

export function saveImageAssetDataUrl(dataUrl: string) {
  if (typeof window === 'undefined') {
    return dataUrl
  }

  const normalizedDataUrl = dataUrl.replace(/\s+/gu, '')
  const nextId = `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const nextStore = {
    ...readImageAssetStore(),
    [nextId]: normalizedDataUrl,
  }

  window.localStorage.setItem(
    STORAGE_KEYS.imageAssets,
    JSON.stringify(nextStore),
  )

  return `${IMAGE_ASSET_PREFIX}${nextId}`
}

export function resolveImageAssetUrl(url: string) {
  if (!url.startsWith(IMAGE_ASSET_PREFIX) || typeof window === 'undefined') {
    return url
  }

  const assetId = url.slice(IMAGE_ASSET_PREFIX.length)
  return readImageAssetStore()[assetId] ?? url
}

export function resolveMarkdownImageAssets(markdown: string) {
  return markdown.replace(
    /knight-image:\/\/[a-z0-9-]+/giu,
    (match) => resolveImageAssetUrl(match),
  )
}

export function migrateInlineMarkdownImageAssets(markdown: string) {
  return markdown.replace(
    INLINE_IMAGE_PATTERN,
    (_match, altText: string, dataUrl: string) =>
      `![${altText}](${saveImageAssetDataUrl(dataUrl)})`,
  )
}

function readImageAssetStore(): ImageAssetStore {
  if (typeof window === 'undefined') {
    return {}
  }

  const value = window.localStorage.getItem(STORAGE_KEYS.imageAssets)
  if (!value) {
    return {}
  }

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>
    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string',
      ),
    )
  } catch {
    return {}
  }
}
