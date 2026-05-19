import { useRef, useEffect, useState, useCallback } from 'react'
import type { OutfitWithItems, Clothing } from '@/lib/types'
import type { OutfitItem } from '@/lib/types'
import { CANVAS_WIDTH, CANVAS_HEIGHT, SLOT_ANCHOR_DEFAULTS } from '@/lib/constants'
import { cacheKey, getCachedCanvas, cacheCanvas } from '@/lib/cache'

interface ModelViewerProps {
  outfit: OutfitWithItems | null
  isLoading: boolean
}

type ClothingItem = OutfitItem & { clothing: Clothing }

function loadImage(src: string, cache: Map<string, HTMLImageElement>): Promise<HTMLImageElement> {
  const cached = cache.get(src)
  if (cached) return Promise.resolve(cached)

  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      cache.set(src, img)
      resolve(img)
    }
    img.onerror = () => {
      console.warn(`[ModelViewer] Failed to load image: ${src}`)
      resolve(img)
    }
    img.src = src
  })
}

function drawOutfit(
  ctx: CanvasRenderingContext2D,
  modelBase: HTMLImageElement,
  items: ClothingItem[],
  imageMap: Map<string, HTMLImageElement>,
): void {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  ctx.drawImage(modelBase, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  const sorted = [...items].sort((a, b) => a.layer_order - b.layer_order)

  for (const item of sorted) {
    const url = item.clothing.image_naked
    if (!url) continue

    const img = imageMap.get(url)
    if (!img || img.naturalWidth === 0) continue

    const anchorX = item.clothing.anchor_x || (SLOT_ANCHOR_DEFAULTS[item.slot]?.anchor_x ?? 0.5)
    const anchorY = item.clothing.anchor_y || (SLOT_ANCHOR_DEFAULTS[item.slot]?.anchor_y ?? 0.5)
    const scaleX = item.clothing.scale_x || 1
    const scaleY = item.clothing.scale_y || 1

    const drawW = img.naturalWidth * scaleX
    const drawH = img.naturalHeight * scaleY
    const x = CANVAS_WIDTH * anchorX - drawW / 2
    const y = CANVAS_HEIGHT * anchorY - drawH / 2

    ctx.drawImage(img, x, y, drawW, drawH)
  }
}

export default function ModelViewer({ outfit, isLoading }: ModelViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map())
  const [rendering, setRendering] = useState(true)

  const render = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    if (!outfit) {
      setRendering(false)
      return
    }

    setRendering(true)

    // Check IndexedDB cache first
    const cached = await getCachedCanvas(cacheKey(outfit.id))
    if (cached) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        const dpr = window.devicePixelRatio || 1
        canvas.width = CANVAS_WIDTH * dpr
        canvas.height = CANVAS_HEIGHT * dpr
        canvas.style.width = `${CANVAS_WIDTH}px`
        canvas.style.height = `${CANVAS_HEIGHT}px`
        ctx.scale(dpr, dpr)
        ctx.drawImage(cached, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
        setRendering(false)
        return
      }
    }

    // Collect image URLs
    const urls: string[] = ['/models/model-base.svg']
    for (const item of outfit.items) {
      if (item.clothing.image_naked) {
        urls.push(item.clothing.image_naked)
      }
    }

    // Preload all images
    const imageMap = new Map<string, HTMLImageElement>()
    await Promise.all(urls.map((url) => loadImage(url, imageCacheRef.current).then((img) => {
      imageMap.set(url, img)
    })))

    // Draw
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = CANVAS_WIDTH * dpr
    canvas.height = CANVAS_HEIGHT * dpr
    canvas.style.width = `${CANVAS_WIDTH}px`
    canvas.style.height = `${CANVAS_HEIGHT}px`
    ctx.scale(dpr, dpr)

    const modelBase = imageMap.get('/models/model-base.svg')
    if (modelBase && modelBase.naturalWidth > 0) {
      drawOutfit(ctx, modelBase, outfit.items, imageMap)
    }

    // Cache the rendered result
    cacheCanvas(cacheKey(outfit.id), canvas)

    setRendering(false)
  }, [outfit])

  useEffect(() => {
    render()
  }, [render])

  // Responsive scaling
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width
        setScale(Math.min(1, w / CANVAS_WIDTH))
      }
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  const showLoading = isLoading || rendering

  return (
    <div ref={containerRef} className="relative mx-auto max-w-full" style={{ maxWidth: CANVAS_WIDTH }}>
      {showLoading ? (
        <div
          className="animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-alt)] flex items-center justify-center"
          style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, maxWidth: '100%' }}
        >
          <span className="text-sm text-[var(--color-text-secondary)]">正在加载模特...</span>
        </div>
      ) : !outfit ? (
        <div
          className="flex items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-surface-alt)]"
          style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, maxWidth: '100%' }}
        >
          <span className="text-4xl">👗</span>
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          className="mx-auto rounded-[var(--radius-lg)]"
          style={{
            width: CANVAS_WIDTH * scale,
            height: CANVAS_HEIGHT * scale,
          }}
        />
      )}
    </div>
  )
}
