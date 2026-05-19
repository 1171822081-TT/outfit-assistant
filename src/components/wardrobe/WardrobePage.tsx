import { useState, useEffect, useCallback } from 'react'
import type { Clothing, Style } from '@/lib/types'
import { useWardrobeStore, uploadImage } from '@/stores/wardrobeStore'
import { supabase } from '@/lib/supabase'
import { recoverStaleQueue } from '@/lib/imageQueue'
import CategoryTabs from './CategoryTabs'
import FilterBar from './FilterBar'
import ClothingGrid from './ClothingGrid'
import ClothingForm from './ClothingForm'
import type { ClothingFormData } from './ClothingForm'

export default function WardrobePage() {
  const {
    items,
    isLoading,
    error,
    selectedCategory,
    selectedStyles,
    fetchItems,
    addItem,
    updateItem,
    deleteItem,
    setCategory,
    setStyles,
  } = useWardrobeStore()

  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Clothing | null>(null)

  useEffect(() => {
    fetchItems()
    recoverStaleQueue()
  }, [fetchItems])

  const handleToggleStyle = useCallback(
    (style: Style) => {
      const next = selectedStyles.includes(style)
        ? selectedStyles.filter((s) => s !== style)
        : [...selectedStyles, style]
      setStyles(next)
    },
    [selectedStyles, setStyles],
  )

  const handleEdit = useCallback((item: Clothing) => {
    setEditingItem(item)
    setFormOpen(true)
  }, [])

  const handleAdd = useCallback(() => {
    setEditingItem(null)
    setFormOpen(true)
  }, [])

  const handleCloseForm = useCallback(() => {
    setFormOpen(false)
    setEditingItem(null)
  }, [])

  const handleDelete = useCallback(
    async (id: string) => {
      if (!window.confirm('确定删除这件衣物吗？')) return
      await deleteItem(id)
    },
    [deleteItem],
  )

  const handleSubmit = useCallback(
    async (formData: ClothingFormData) => {
      const { imageFile, imagePreviewUrl, ...base } = formData
      const clothingData = {
        ...base,
        image_original: imagePreviewUrl ?? null,
        image_naked: null,
        anchor_x: 0.5,
        anchor_y: 0.5,
        scale_x: 1,
        scale_y: 1,
        status: 'active' as const,
      }

      let targetId = editingItem?.id
      if (editingItem) {
        await updateItem(editingItem.id, clothingData)
      } else {
        const inserted = await addItem(clothingData)
        targetId = inserted.id
      }

      if (imageFile && targetId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const url = await uploadImage(user.id, targetId, imageFile, 'clothing-images')
          await updateItem(targetId, { image_original: url })
        }
      }

      handleCloseForm()
    },
    [editingItem, addItem, updateItem, handleCloseForm],
  )

  return (
    <div className="min-h-dvh bg-[var(--color-surface)]">
      <header className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold">我的衣柜</h1>
          <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
            {items.length} 件衣物
          </p>
        </div>
        <div className="px-4 pb-3">
          <CategoryTabs selected={selectedCategory} onSelect={setCategory} />
        </div>
        <div className="px-4 pb-3">
          <FilterBar selected={selectedStyles} onToggle={handleToggleStyle} />
        </div>
      </header>

      {error && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-[var(--radius-md)] bg-red-50 px-4 py-3 text-sm text-red-600">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className="p-4">
        <ClothingGrid
          items={items}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      <button
        onClick={handleAdd}
        className="fixed bottom-6 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent)] text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        aria-label="添加衣物"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>

      {formOpen && (
        <ClothingForm
          item={editingItem}
          onSubmit={handleSubmit}
          onClose={handleCloseForm}
        />
      )}
    </div>
  )
}
