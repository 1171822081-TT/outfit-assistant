import { useCallback, useState } from 'react'

interface OutfitActionsProps {
  isFavorite: boolean
  onToggleFavorite: () => Promise<void>
  onRefresh: () => Promise<void>
  onCustomEdit: () => void
  isLoading: boolean
  hasOutfit: boolean
}

export default function OutfitActions({
  isFavorite,
  onToggleFavorite,
  onRefresh,
  onCustomEdit,
  isLoading,
  hasOutfit,
}: OutfitActionsProps) {
  const [favoriting, setFavoriting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const handleFavorite = useCallback(async () => {
    setFavoriting(true)
    try {
      await onToggleFavorite()
    } finally {
      setFavoriting(false)
    }
  }, [onToggleFavorite])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setRefreshing(false)
    }
  }, [onRefresh])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 py-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-10 w-20 animate-pulse rounded-[var(--radius-full)] bg-[var(--color-border)]"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center gap-3 py-1">
      <button
        onClick={handleFavorite}
        disabled={!hasOutfit || favoriting}
        className="inline-flex items-center gap-1.5 rounded-[var(--radius-full)] bg-[var(--color-surface-alt)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition-all hover:bg-[var(--color-border)] disabled:opacity-40 disabled:cursor-default"
        aria-label={isFavorite ? '取消收藏' : '收藏搭配'}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={isFavorite ? 'var(--color-accent)' : 'none'}
          stroke={isFavorite ? 'var(--color-accent)' : 'currentColor'}
          strokeWidth="2"
          className={favoriting ? 'animate-pulse' : ''}
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        <span className="hidden sm:inline">{isFavorite ? '已收藏' : '收藏'}</span>
      </button>

      <button
        onClick={handleRefresh}
        disabled={refreshing}
        className="inline-flex items-center gap-1.5 rounded-[var(--radius-full)] bg-[var(--color-accent)] px-5 py-2 text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-60"
        aria-label="换一批搭配"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={refreshing ? 'animate-spin' : ''}
        >
          <path d="M1 4v6h6M23 20v-6h-6" />
          <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
        </svg>
        <span className="hidden sm:inline">换一批</span>
      </button>

      <button
        onClick={onCustomEdit}
        disabled={!hasOutfit}
        className="inline-flex items-center gap-1.5 rounded-[var(--radius-full)] bg-[var(--color-surface-alt)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition-all hover:bg-[var(--color-border)] disabled:opacity-40 disabled:cursor-default"
        aria-label="自由搭配"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
        <span className="hidden sm:inline">自由搭配</span>
      </button>
    </div>
  )
}
