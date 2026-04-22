import { STORAGE_KEYS } from './constants'

const IMAGE_ASSET_PREFIX = 'knight-image://'
const IMAGE_DB_NAME = 'knight-markdown-image-assets'
const IMAGE_DB_VERSION = 1
const IMAGE_STORE_NAME = 'assets'
const INLINE_IMAGE_PATTERN =
  /!\[([^\]]*)\]\((data:image\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=\r\n]+)\)/giu

type ImageAssetStore = Record<string, string>
type ImageAssetRecord = {
  dataUrl: string
  id: string
  updatedAt: number
}

const runtimeImageAssets = new Map<string, string>()
const changeListeners = new Set<() => void>()
let hydrationPromise: Promise<void> | null = null
let hasHydratedCache = false

export function saveImageAssetDataUrl(dataUrl: string) {
  if (typeof window === 'undefined') {
    return dataUrl
  }

  const normalizedDataUrl = dataUrl.replace(/\s+/gu, '')
  const nextId = `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  cacheRuntimeAsset(nextId, normalizedDataUrl)
  notifyImageAssetListeners()
  void persistImageAsset(nextId, normalizedDataUrl)
  return `${IMAGE_ASSET_PREFIX}${nextId}`
}

export function resolveImageAssetUrl(url: string) {
  if (!url.startsWith(IMAGE_ASSET_PREFIX) || typeof window === 'undefined') {
    return url
  }

  const assetId = url.slice(IMAGE_ASSET_PREFIX.length)
  return (
    runtimeImageAssets.get(assetId) ??
    readLegacyImageAssetStore()[assetId] ??
    url
  )
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

export function subscribeToImageAssetChanges(listener: () => void) {
  changeListeners.add(listener)
  return () => {
    changeListeners.delete(listener)
  }
}

export function ensureImageAssetCacheHydrated() {
  if (typeof window === 'undefined' || hasHydratedCache) {
    return Promise.resolve()
  }

  if (hydrationPromise) {
    return hydrationPromise
  }

  hydrationPromise = hydrateImageAssetCache().finally(() => {
    hasHydratedCache = true
    hydrationPromise = null
  })

  return hydrationPromise
}

export function resetImageAssetRuntimeStateForTests() {
  runtimeImageAssets.clear()
  changeListeners.clear()
  hydrationPromise = null
  hasHydratedCache = false
}

function cacheRuntimeAsset(assetId: string, dataUrl: string) {
  runtimeImageAssets.set(assetId, dataUrl)
}

async function hydrateImageAssetCache() {
  const legacyStore = readLegacyImageAssetStore()
  let didChange = mergeAssetStoreIntoRuntime(legacyStore)

  const database = await openImageAssetDatabase()
  if (!database) {
    if (didChange) {
      notifyImageAssetListeners()
    }
    return
  }

  try {
    const persistedRecords = await readAllImageAssetRecords(database)
    didChange =
      mergeAssetStoreIntoRuntime(
        Object.fromEntries(
          persistedRecords.map((record) => [record.id, record.dataUrl]),
        ),
      ) || didChange

    if (Object.keys(legacyStore).length > 0) {
      clearLegacyImageAssetStore()
      await Promise.all(
        Object.entries(legacyStore).map(([id, dataUrl]) =>
          writeImageAssetRecord(database, {
            dataUrl,
            id,
            updatedAt: Date.now(),
          }),
        ),
      )
    }
  } finally {
    database.close()
  }

  if (didChange) {
    notifyImageAssetListeners()
  }
}

function mergeAssetStoreIntoRuntime(store: ImageAssetStore) {
  let didChange = false

  Object.entries(store).forEach(([assetId, dataUrl]) => {
    if (runtimeImageAssets.get(assetId) === dataUrl) {
      return
    }

    runtimeImageAssets.set(assetId, dataUrl)
    didChange = true
  })

  return didChange
}

async function persistImageAsset(assetId: string, dataUrl: string) {
  const database = await openImageAssetDatabase()
  if (database) {
    try {
      await writeImageAssetRecord(database, {
        dataUrl,
        id: assetId,
        updatedAt: Date.now(),
      })
      return
    } catch {
      // Fall through to the legacy fallback when IndexedDB is temporarily
      // unavailable.
    } finally {
      database.close()
    }
  }

  try {
    const nextStore = {
      ...readLegacyImageAssetStore(),
      [assetId]: dataUrl,
    }
    window.localStorage.setItem(
      STORAGE_KEYS.imageAssets,
      JSON.stringify(nextStore),
    )
  } catch {
    // Keep the asset available in memory for the current session even if
    // persistent storage is unavailable or out of quota.
  }
}

function notifyImageAssetListeners() {
  changeListeners.forEach((listener) => listener())
}

function readLegacyImageAssetStore(): ImageAssetStore {
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

function clearLegacyImageAssetStore() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(STORAGE_KEYS.imageAssets)
}

function openImageAssetDatabase(): Promise<IDBDatabase | null> {
  if (
    typeof window === 'undefined' ||
    typeof window.indexedDB?.open !== 'function'
  ) {
    return Promise.resolve(null)
  }

  return new Promise((resolve) => {
    const request = window.indexedDB.open(IMAGE_DB_NAME, IMAGE_DB_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(IMAGE_STORE_NAME)) {
        database.createObjectStore(IMAGE_STORE_NAME, {
          keyPath: 'id',
        })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => resolve(null)
    request.onblocked = () => resolve(null)
  })
}

function readAllImageAssetRecords(database: IDBDatabase) {
  return new Promise<ImageAssetRecord[]>((resolve) => {
    const transaction = database.transaction(IMAGE_STORE_NAME, 'readonly')
    const store = transaction.objectStore(IMAGE_STORE_NAME)
    const request = store.getAll()

    request.onsuccess = () => {
      resolve(
        (request.result as unknown[]).filter(isImageAssetRecord),
      )
    }
    request.onerror = () => resolve([])
  })
}

function writeImageAssetRecord(database: IDBDatabase, record: ImageAssetRecord) {
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(IMAGE_STORE_NAME, 'readwrite')
    const store = transaction.objectStore(IMAGE_STORE_NAME)
    store.put(record)

    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}

function isImageAssetRecord(value: unknown): value is ImageAssetRecord {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.dataUrl === 'string' &&
    typeof candidate.updatedAt === 'number'
  )
}

if (typeof window !== 'undefined') {
  void ensureImageAssetCacheHydrated()
}
