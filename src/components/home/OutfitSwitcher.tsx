import { useRef, useCallback, useState } from 'react'
import type { OutfitWithItems } from '@/lib/types'

interface OutfitSwitcherProps {
  outfits: OutfitWithItems[]
  currentIndex: number
  onSwitch: (index: number) => void
  isLoading: boolean
}

export default function OutfitSwitcher({ outfits, currentIndex, onSwitch, isLoading }: OutfitSwitcherProps) {
  const touchStartX = useRef(0)
  const [swiping, setSwiping] = useState(false)

  const goTo = useCallback(
    (index: number) => {
      if (index >= 0 && index < outfits.length) {
        onSwitch(index)
      }
    },
    [outfits.length, onSwitch],
  )

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    setSwiping(true)
  }, [])

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      setSwiping(false)
      const delta = e.changedTouches[0].clientX - touchStartX.current
      if (Math.abs(delta) < 40) return
      if (delta < 0) {
        goTo(currentIndex + 1)
      } else {
        goTo(currentIndex - 1)
      }
    },
    [currentIndex, goTo],
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-2">
        <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--color-border)]" />
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-border)]" />
          ))}
        </div>
        <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--color-border)]" />
      </div>
    )
  }

  if (outfits.length === 0) return null

  const canGoPrev = currentIndex > 0
  const canGoNext = currentIndex < outfits.length - 1
  const name = outfits[currentIndex]?.name ?? ''

  return (
    <div className="flex items-center justify-between px-2">
      <button
        onClick={() => goTo(currentIndex - 1)}
        disabled={!canGoPrev}
        className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition-all hover:bg-[var(--color-surface-alt)] disabled:opacity-25 disabled:cursor-default"
        aria-label="上一套搭配"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      <div
        className="flex flex-col items-center gap-1.5 select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ transition: swiping ? 'none' : undefined }}
      >
        <span className="text-sm font-medium text-[var(--color-text)]">{name}</span>
        <div className="flex gap-1.5">
          {outfits.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all duration-[var(--duration-fast)] ${
                i === currentIndex
                  ? 'w-5 bg-[var(--color-accent)]'
                  : 'w-2 bg-[var(--color-border)] hover:bg-[var(--color-text-secondary)]'
              }`}
              aria-label={`第${i + 1}套搭配`}
            />
          ))}
        </div>
      </div>

      <button
        onClick={() => goTo(currentIndex + 1)}
        disabled={!canGoNext}
        className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition-all hover:bg-[var(--color-surface-alt)] disabled:opacity-25 disabled:cursor-default"
        aria-label="下一套搭配"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  )
}
