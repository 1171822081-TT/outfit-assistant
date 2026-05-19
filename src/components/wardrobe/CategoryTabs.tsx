import type { Category } from '@/lib/types'
import { CATEGORIES, CATEGORY_LABELS } from '@/lib/constants'

interface CategoryTabsProps {
  selected: Category | null
  onSelect: (category: Category | null) => void
}

export default function CategoryTabs({ selected, onSelect }: CategoryTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      <button
        onClick={() => onSelect(null)}
        className={`shrink-0 rounded-[var(--radius-full)] px-4 py-2 text-sm font-medium transition-all duration-[var(--duration-fast)] ${
          selected === null
            ? 'bg-[var(--color-accent)] text-white'
            : 'bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]'
        }`}
      >
        全部
      </button>
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`shrink-0 rounded-[var(--radius-full)] px-4 py-2 text-sm font-medium transition-all duration-[var(--duration-fast)] ${
            selected === cat
              ? 'bg-[var(--color-accent)] text-white'
              : 'bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]'
          }`}
        >
          {CATEGORY_LABELS[cat]}
        </button>
      ))}
    </div>
  )
}
