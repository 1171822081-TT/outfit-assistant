import { useEffect, useState } from 'react'
import type { OutfitWithItems } from '@/lib/types'
import { useOutfitStore } from '@/stores/outfitStore'
import { STYLE_LABELS } from '@/lib/constants'
import type { Style } from '@/lib/types'

type TabType = 'favorites' | 'custom'

interface OutfitListProps {
  onEditOutfit?: (outfit: OutfitWithItems) => void
  onCreateCustom?: () => void
}

function Skeleton() {
  return (
    <div className="animate-pulse rounded-[var(--radius-md)] bg-[var(--color-surface-alt)] p-4">
      <div className="flex gap-3">
        <div className="h-16 w-16 shrink-0 rounded-[var(--radius-sm)] bg-[var(--color-border)]/30" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/2 rounded bg-[var(--color-border)]/30" />
          <div className="h-3 w-1/3 rounded bg-[var(--color-border)]/20" />
        </div>
      </div>
    </div>
  )
}

function EmptyFavorites() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-5xl">💝</span>
      <p className="mt-4 text-sm font-medium text-[var(--color-text-secondary)]">还没有收藏搭配</p>
      <p className="mt-1 text-xs text-[var(--color-border)]">去首页看看今日推荐，收藏喜欢的搭配吧</p>
    </div>
  )
}

function EmptyCustom({ onCreateCustom }: { onCreateCustom?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-5xl">🎨</span>
      <p className="mt-4 text-sm font-medium text-[var(--color-text-secondary)]">还没有自搭搭配</p>
      <p className="mt-1 text-xs text-[var(--color-border)]">自由组合衣柜中的衣物，创建专属搭配</p>
      {onCreateCustom && (
        <button
          onClick={onCreateCustom}
          className="mt-3 text-sm font-medium text-[var(--color-accent)]"
        >
          立即创建
        </button>
      )}
    </div>
  )
}

function styleLabel(style: string | null): string {
  if (!style) return ''
  return STYLE_LABELS[style as Style] ?? style
}

function OutfitThumbnail({ outfit }: { outfit: OutfitWithItems }) {
  const [imgError, setImgError] = useState(false)
  const src = outfit.items[0]?.clothing?.image_original

  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-border)]/20">
      {src && !imgError ? (
        <img
          src={src}
          alt={outfit.name}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="text-2xl">👗</span>
      )}
    </div>
  )
}

export default function OutfitList({ onEditOutfit, onCreateCustom }: OutfitListProps) {
  const { outfits, outfitsLoading, outfitsError, fetchOutfits, toggleFavorite } = useOutfitStore()
  const [activeTab, setActiveTab] = useState<TabType>('favorites')
  const [favError, setFavError] = useState<string | null>(null)

  useEffect(() => {
    fetchOutfits()
  }, [fetchOutfits])

  const favorites = outfits.filter((o) => o.is_favorite)
  const customs = outfits.filter((o) => !o.is_recommended)
  const displayed = activeTab === 'favorites' ? favorites : customs

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: 'favorites', label: '收藏搭配', count: favorites.length },
    { key: 'custom', label: '我的自搭', count: customs.length },
  ]

  if (outfitsError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="text-5xl">⚠️</span>
        <p className="mt-4 text-sm font-medium text-[var(--color-text-secondary)]">加载失败</p>
        <p className="mt-1 text-xs text-[var(--color-border)]">{outfitsError}</p>
        <button
          onClick={() => fetchOutfits()}
          className="mt-3 text-sm font-medium text-[var(--color-accent)]"
        >
          重试
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Tab bar */}
      <div role="tablist" aria-label="搭配分类" className="flex border-b border-[var(--color-border)]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative flex-1 py-3 text-center text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-[var(--color-accent)]'
                : 'text-[var(--color-text-secondary)]'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-1 text-xs opacity-60">({tab.count})</span>
            )}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full bg-[var(--color-accent)]" />
            )}
          </button>
        ))}
      </div>

      {/* Error banner for favorite toggle failures */}
      {favError && (
        <div className="mt-2 flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-warning)]/10 px-3 py-2 text-xs text-[var(--color-warning)]">
          <span>{favError}</span>
          <button onClick={() => setFavError(null)} className="ml-auto font-medium" aria-label="关闭">
            ×
          </button>
        </div>
      )}

      {/* Content */}
      <div role="tabpanel" aria-label={activeTab === 'favorites' ? '收藏搭配' : '我的自搭'} className="pt-3">
        {outfitsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          activeTab === 'favorites' ? <EmptyFavorites /> : <EmptyCustom onCreateCustom={onCreateCustom} />
        ) : (
          <div className="space-y-3">
            {displayed.map((outfit) => (
              <div
                key={outfit.id}
                className="flex items-center gap-3 rounded-[var(--radius-md)] bg-[var(--color-surface-alt)] p-3 transition-shadow hover:shadow-sm"
              >
                <OutfitThumbnail outfit={outfit} />

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-medium">{outfit.name}</h3>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                    {outfit.style && (
                      <span>{styleLabel(outfit.style)}</span>
                    )}
                    <span>{outfit.items.length} 件</span>
                    {outfit.is_recommended && (
                      <span className="rounded-full bg-[var(--color-accent)]/10 px-1.5 py-px text-[var(--color-accent)]">
                        推荐
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--color-border)]">
                    {new Date(outfit.created_at).toLocaleDateString('zh-CN')}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={async () => {
                      try {
                        await toggleFavorite(outfit.id)
                      } catch {
                        setFavError('收藏操作失败，请重试')
                      }
                    }}
                    className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                      outfit.is_favorite
                        ? 'text-[var(--color-accent)]'
                        : 'text-[var(--color-border)] hover:text-[var(--color-accent)]'
                    }`}
                    aria-label={outfit.is_favorite ? '取消收藏' : '收藏'}
                  >
                    <svg className="h-5 w-5" fill={outfit.is_favorite ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                    </svg>
                  </button>
                  {!outfit.is_recommended && onEditOutfit && (
                    <button
                      onClick={() => onEditOutfit(outfit)}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-border)] transition-colors hover:text-[var(--color-accent)]"
                      aria-label="编辑"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
