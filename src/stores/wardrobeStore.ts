import { create } from 'zustand'
import type { Clothing, Category, Style } from '@/lib/types'
import { supabase } from '@/lib/supabase'

interface WardrobeState {
  items: Clothing[]
  isLoading: boolean
  error: string | null
  selectedCategory: Category | null
  selectedStyles: Style[]
  fetchItems: () => Promise<void>
  addItem: (data: Omit<Clothing, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Clothing>
  updateItem: (id: string, data: Partial<Clothing>) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  setCategory: (category: Category | null) => void
  setStyles: (styles: Style[]) => void
}

async function uploadImage(userId: string, clothingId: string, file: File, bucket: string): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${userId}/${clothingId}.${ext}`
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  })
  if (error) throw error
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)
  return urlData.publicUrl
}

export const useWardrobeStore = create<WardrobeState>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,
  selectedCategory: null,
  selectedStyles: [],

  fetchItems: async () => {
    set({ isLoading: true, error: null })
    try {
      const { selectedCategory, selectedStyles } = get()

      let query = supabase
        .from('clothing')
        .select('*')
        .order('created_at', { ascending: false })

      if (selectedCategory) {
        query = query.eq('category', selectedCategory)
      }
      if (selectedStyles.length > 0) {
        query = query.in('style', selectedStyles)
      }

      const { data, error } = await query
      if (error) throw error
      set({ items: (data as Clothing[]) ?? [], isLoading: false })
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : '加载失败' })
    }
  },

  addItem: async (data) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const { data: inserted, error } = await supabase
      .from('clothing')
      .insert({ ...data, user_id: user.id })
      .select()
      .single()

    if (error) throw error
    const item = inserted as Clothing
    set((state) => ({ items: [item, ...state.items] }))
    return item
  },

  updateItem: async (id, data) => {
    const { error } = await supabase
      .from('clothing')
      .update(data)
      .eq('id', id)

    if (error) throw error
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, ...data } : item
      ),
    }))
  },

  deleteItem: async (id) => {
    const { error } = await supabase
      .from('clothing')
      .delete()
      .eq('id', id)

    if (error) throw error
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    }))
  },

  setCategory: (category) => {
    set({ selectedCategory: category })
    get().fetchItems()
  },

  setStyles: (styles) => {
    set({ selectedStyles: styles })
    get().fetchItems()
  },
}))

export { uploadImage }
