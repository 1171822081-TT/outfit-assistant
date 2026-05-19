import type { Style } from '@/lib/types'
import { STYLES, STYLE_LABELS } from '@/lib/constants'

interface FilterBarProps {
  selected: Style[]
  onToggle: (style: Style) => void
}

export default function FilterBar({ selected, onToggle }: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {STYLES.map((style) => {
        const active = selected.includes(style)
        return (
          <button
            key={style}
            onClick={() => onToggle(style)}
            className={`shrink-0 rounded-[var(--radius-sm)] border px-3 py-1.5 text-xs font-medium transition-all duration-[var(--duration-fast)] ${
              active
                ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5 text-[var(--color-accent)]'
                : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]/40'
            }`}
          >
            {STYLE_LABELS[style]}
          </button>
        )
      })}
    </div>
  )
}
