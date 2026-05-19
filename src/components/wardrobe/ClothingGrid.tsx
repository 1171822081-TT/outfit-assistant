import type { Clothing } from '@/lib/types'
import { CATEGORY_LABELS, STYLE_LABELS } from '@/lib/constants'

interface ClothingGridProps {
  items: Clothing[]
  isLoading: boolean
  onEdit: (item: Clothing) => void
  onDelete: (id: string) => void
}

function Skeleton() {
  return (
    <div className="animate-pulse rounded-[var(--radius-md)] bg-[var(--color-surface-alt)]">
      <div className="aspect-[3/4] w-full rounded-[var(--radius-md)] bg-[var(--color-border)]/30" />
      <div className="space-y-2 p-3">
        <div className="h-3 w-2/3 rounded bg-[var(--color-border)]/30" />
        <div className="h-2.5 w-1/2 rounded bg-[var(--color-border)]/20" />
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <svg className="mb-4 h-12 w-12 text-[var(--color-border)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
      <p className="text-sm font-medium text-[var(--color-text-secondary)]">衣柜空空如也</p>
      <p className="mt-1 text-xs text-[var(--color-border)]">添加你的第一件衣服吧</p>
    </div>
  )
}

export default function ClothingGrid({ items, isLoading, onEdit, onDelete }: ClothingGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="group relative overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-surface-alt)] transition-shadow hover:shadow-md"
        >
          <button
            onClick={() => onEdit(item)}
            className="block w-full text-left"
          >
            <div className="aspect-[3/4] w-full bg-[var(--color-border)]/20">
              {item.image_original ? (
                <img
                  src={item.image_original}
                  alt={item.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <svg className="h-8 w-8 text-[var(--color-border)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0L21 15m-18 3.75h16.5A2.25 2.25 0 0021.75 16.5V7.5A2.25 2.25 0 0019.5 5.25H4.5A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="truncate text-sm font-medium">{item.name}</h3>
              <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                {CATEGORY_LABELS[item.category]} · {STYLE_LABELS[item.style]}
              </p>
            </div>
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity hover:bg-red-500 group-hover:opacity-100"
            aria-label={`删除${item.name}`}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}
