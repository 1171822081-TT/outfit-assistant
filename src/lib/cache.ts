import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants'

const DB_NAME = 'outfit-cache'
const DB_VERSION = 1
const STORE_NAME = 'canvases'
const MAX_CACHE_ENTRIES = 50

interface CacheEntry {
  id: string
  blob: Blob
  timestamp: number
}

let dbPromise: Promise<IDBDatabase | null> | null = null

function openDB(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
      }

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => {
        console.warn('[cache] IndexedDB unavailable, caching disabled')
        resolve(null)
      }
    } catch {
      console.warn('[cache] IndexedDB unavailable, caching disabled')
      resolve(null)
    }
  })

  return dbPromise
}

function txComplete(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export function cacheKey(outfitId: string): string {
  return `outfit_${outfitId}_${CANVAS_WIDTH}x${CANVAS_HEIGHT}`
}

export async function cacheCanvas(id: string, canvas: HTMLCanvasElement): Promise<void> {
  try {
    const db = await openDB()
    if (!db) return

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/png')
    })
    if (!blob) return

    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.put({ id, blob, timestamp: Date.now() } satisfies CacheEntry)

    await txComplete(tx)

    // Evict oldest entries if over capacity
    const countTx = db.transaction(STORE_NAME, 'readwrite')
    const countStore = countTx.objectStore(STORE_NAME)
    const allKeys = await new Promise<string[]>((resolve, reject) => {
      const req = countStore.getAllKeys()
      req.onsuccess = () => resolve(req.result as string[])
      req.onerror = () => reject(req.error)
    })

    if (allKeys.length > MAX_CACHE_ENTRIES) {
      const evictTx = db.transaction(STORE_NAME, 'readwrite')
      const evictStore = evictTx.objectStore(STORE_NAME)
      // Fetch all entries to sort by timestamp
      const allEntries = await new Promise<CacheEntry[]>((resolve, reject) => {
        const req = evictStore.getAll()
        req.onsuccess = () => resolve(req.result as CacheEntry[])
        req.onerror = () => reject(req.error)
      })
      allEntries.sort((a, b) => a.timestamp - b.timestamp)
      const toEvict = allEntries.slice(0, allEntries.length - MAX_CACHE_ENTRIES)
      const evictTx2 = db.transaction(STORE_NAME, 'readwrite')
      const evictStore2 = evictTx2.objectStore(STORE_NAME)
      for (const entry of toEvict) {
        evictStore2.delete(entry.id)
      }
      await txComplete(evictTx2)
    }
  } catch {
    // Silently degrade — caching is a performance optimization
  }
}

export async function getCachedCanvas(id: string): Promise<ImageBitmap | null> {
  try {
    const db = await openDB()
    if (!db) return null

    const blob = await new Promise<Blob | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.get(id)
      request.onsuccess = () => {
        const entry = request.result as CacheEntry | undefined
        resolve(entry?.blob)
      }
      request.onerror = () => reject(request.error)
    })

    if (!blob) return null
    return createImageBitmap(blob)
  } catch {
    return null
  }
}

export async function clearCache(): Promise<void> {
  try {
    const db = await openDB()
    if (!db) return
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).clear()
    await txComplete(tx)
  } catch {
    // ignore
  }
}
