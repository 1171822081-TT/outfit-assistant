import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import type { Clothing, Slot } from '@/lib/types'
import { useWardrobeStore } from '@/stores/wardrobeStore'
import { useOutfitStore } from '@/stores/outfitStore'
import { supabase } from '@/lib/supabase'
import { SLOT_DEFAULT_LAYER } from '@/lib/constants'

const SLOTS: { key: Slot; label: string; layer: number }[] = [
  { key: 'dress', label: '连衣裙', layer: 4 },
  { key: 'top', label: '上衣', layer: 3 },
  { key: 'bottom', label: '下装', layer: 2 },
  { key: 'outerwear', label: '外套', layer: 5 },
  { key: 'shoes', label: '鞋子', layer: 1 },
  { key: 'accessory', label: '配饰', layer: 6 },
]

interface OutfitEditorProps {
  onDone: () => void
}

function ItemThumbnail({ item }: { item: Clothing }) {
  const [imgError, setImgError] = useState(false)

  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-border)]/20">
      {item.image_original && !imgError ? (
        <img
          src={item.image_original}
          alt={item.name}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="text-xs">👗</span>
      )}
    </div>
  )
}

export default function OutfitEditor({ onDone }: OutfitEditorProps) {
  const { items: wardrobeItems, fetchItems, isLoading: wardrobeLoading } = useWardrobeStore()
  const { fetchOutfits } = useOutfitStore()
  const [selections, setSelections] = useState<Partial<Record<Slot, string>>>({})
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const nameEditedRef = useRef(false)

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const itemsBySlot = useMemo(() => {
    const map: Partial<Record<Slot, Clothing[]>> = {}
    for (const item of wardrobeItems) {
      const slot = item.category as unknown as Slot
      if (!map[slot]) map[slot] = []
      map[slot]!.push(item)
    }
    return map
  }, [wardrobeItems])

  const hasDress = !!selections.dress

  const selectedItems = useMemo(() => {
    const result: Clothing[] = []
    for (const [, id] of Object.entries(selections)) {
      if (!id) continue
      const item = wardrobeItems.find((i) => i.id === id)
      if (item) result.push(item)
    }
    return result
  }, [selections, wardrobeItems])

  const missingRequired = hasDress ? !selections.shoes : (!selections.top || !selections.bottom || !selections.shoes)

  const autoName = useCallback((sel: Partial<Record<Slot, string>>) => {
    const items: string[] = []
    for (const [, id] of Object.entries(sel)) {
      if (!id) continue
      const item = wardrobeItems.find((i) => i.id === id)
      if (item) items.push(item.name)
    }
    return items.length > 0 ? items.join(' + ') : ''
  }, [wardrobeItems])

  const handleSlotSelect = (slot: Slot, clothingId: string) => {
    setError(null)
    setSelections((prev) => {
      const next = { ...prev }

      // Toggle if already selected
      if (next[slot] === clothingId) {
        delete next[slot]
        if (!nameEditedRef.current) {
          setName(autoName(next))
        }
        return next
      }

      // Dress is mutually exclusive with top/bottom
      if (slot === 'dress') {
        delete next.top
        delete next.bottom
      }
      if (slot === 'top' || slot === 'bottom') {
        delete next.dress
      }

      next[slot] = clothingId

      // Auto-name only if user hasn't manually edited
      if (!nameEditedRef.current) {
        setName(autoName(next))
      }

      return next
    })
  }

  const handleNameChange = (value: string) => {
    nameEditedRef.current = true
    setName(value)
  }

  const handleSave = async () => {
    if (missingRequired) {
      setError('请至少选择上衣+下装+鞋子（或连衣裙+鞋子）')
      return
    }

    setSaving(true)
    setError(null)

    let outfitId: string | undefined

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('未登录')

      const slots = Object.entries(selections).filter(([_, id]) => !!id) as [Slot, string][]

      const { data: outfit, error: outfitErr } = await supabase
        .from('outfit')
        .insert({
          name: name || '自定义搭配',
          is_recommended: false,
          weather_condition: null,
          is_favorite: false,
          style: null,
          user_id: user.id,
        })
        .select()
        .single()

      if (outfitErr || !outfit) throw outfitErr
      outfitId = outfit.id

      const items = slots.map(([slot, clothingId]) => ({
        outfit_id: outfit.id,
        clothing_id: clothingId,
        slot,
        layer_order: SLOT_DEFAULT_LAYER[slot],
      }))

      const { error: itemsErr } = await supabase
        .from('outfit_item')
        .insert(items)

      if (itemsErr) throw itemsErr

      // Refresh list in background — don't block navigation
      fetchOutfits()
      onDone()
    } catch (err) {
      // Clean up orphan outfit row if item insert failed
      if (outfitId) {
        supabase.from('outfit').delete().eq('id', outfitId).then(
          () => {},
          () => {},
        )
      }
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <h3 className="text-base font-semibold">自由搭配</h3>

      {/* Slot selectors */}
      {SLOTS.map(({ key, label }) => {
        const slotItems = itemsBySlot[key] ?? []
        const selectedId = selections[key]

        // Hide bottom/top slot if has dress (mutually exclusive)
        if ((key === 'bottom' || key === 'top') && hasDress) return null

        return (
          <div key={key}>
            <div className="mb-1.5 flex items-center gap-2">
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">
                {label}
              </label>
              {key === 'shoes' && (
                <span className="text-xs text-[var(--color-accent)]">*必选</span>
              )}
            </div>
            {wardrobeLoading ? (
              <div className="h-10 animate-pulse rounded-[var(--radius-sm)] bg-[var(--color-surface-alt)]" />
            ) : slotItems.length === 0 ? (
              <p className="py-2 text-xs text-[var(--color-border)]">暂无{label}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slotItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSlotSelect(key, item.id)}
                    className={`rounded-[var(--radius-md)] border px-3 py-2 transition-colors ${
                      selectedId === item.id
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
                        : 'border-[var(--color-border)] hover:border-[var(--color-accent)]/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ItemThumbnail item={item} />
                      <div className="min-w-0 text-left">
                        <p className="truncate text-sm">{item.name}</p>
                        <p className="text-xs text-[var(--color-text-secondary)]">{item.color}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Selected preview */}
      {selectedItems.length > 0 && (
        <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] p-3">
          <p className="mb-2 text-xs font-medium text-[var(--color-text-secondary)]">
            已选 {selectedItems.length} 件
          </p>
          <div className="flex flex-wrap gap-1.5">
            {selectedItems.map((item) => (
              <span
                key={item.id}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--color-surface-alt)] px-2.5 py-1 text-xs"
              >
                {item.name}
                <button
                  onClick={() => {
                    const slot = Object.entries(selections).find(([_, id]) => id === item.id)?.[0] as Slot | undefined
                    if (slot) handleSlotSelect(slot, item.id)
                  }}
                  className="ml-0.5 text-[var(--color-text-secondary)] hover:text-[var(--color-danger)]"
                  aria-label={`移除${item.name}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Name */}
      <div>
        <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
          搭配名称
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="给这套搭配起个名字..."
          maxLength={50}
          className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2.5 text-sm placeholder:text-[var(--color-border)] focus:border-[var(--color-accent)] focus:outline-none"
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-[var(--color-danger)]">{error}</p>
      )}

      {/* Missing required hint */}
      {missingRequired && (
        <p className="text-xs text-[var(--color-warning)]">
          至少选择 {hasDress ? '连衣裙 + 鞋子' : '上衣 + 下装 + 鞋子'}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onDone}
          className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] py-3 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-alt)]"
        >
          取消
        </button>
        <button
          onClick={handleSave}
          disabled={missingRequired || saving}
          className="flex-1 rounded-[var(--radius-md)] bg-[var(--color-accent)] py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
        >
          {saving ? '保存中...' : '保存搭配'}
        </button>
      </div>
    </div>
  )
}
