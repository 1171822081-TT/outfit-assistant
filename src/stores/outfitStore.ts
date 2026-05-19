import { create } from 'zustand'
import type { OutfitWithItems, Diary, WeatherData } from '@/lib/types'
import type { OutfitCandidate } from '@/lib/recommendation'
import { supabase } from '@/lib/supabase'
import { SLOT_DEFAULT_LAYER, CATEGORY_LABELS } from '@/lib/constants'

interface OutfitState {
  outfits: OutfitWithItems[]
  outfitsLoading: boolean
  outfitsError: string | null
  diaries: Diary[]
  diariesLoading: boolean
  diariesError: string | null
  fetchOutfits: () => Promise<void>
  fetchDiaries: () => Promise<void>
  toggleFavorite: (id: string) => Promise<void>
  addDiary: (diary: Omit<Diary, 'id' | 'created_at' | 'user_id'>) => Promise<void>
  updateDiary: (id: string, diary: Partial<Omit<Diary, 'id' | 'created_at' | 'user_id'>>) => Promise<void>
  saveRecommendations: (candidates: OutfitCandidate[], weather: WeatherData) => Promise<OutfitWithItems[]>
  fetchTodayRecommendations: () => Promise<OutfitWithItems[]>
}

function slotLabel(slot: string): string {
  return CATEGORY_LABELS[slot as keyof typeof CATEGORY_LABELS] ?? slot
}

function toDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export const useOutfitStore = create<OutfitState>((set, get) => ({
  outfits: [],
  outfitsLoading: false,
  outfitsError: null,
  diaries: [],
  diariesLoading: false,
  diariesError: null,

  fetchOutfits: async () => {
    set({ outfitsLoading: true, outfitsError: null })
    try {
      const { data: outfits, error } = await supabase
        .from('outfit')
        .select('*, items:outfit_item(*, clothing:clothing(*))')
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ outfits: (outfits as OutfitWithItems[]) ?? [], outfitsLoading: false })
    } catch (err) {
      set({
        outfitsLoading: false,
        outfitsError: err instanceof Error ? err.message : '加载搭配失败',
      })
    }
  },

  fetchDiaries: async () => {
    set({ diariesLoading: true, diariesError: null })
    try {
      const { data, error } = await supabase
        .from('diary')
        .select('*')
        .order('date', { ascending: false })

      if (error) throw error
      set({ diaries: (data as Diary[]) ?? [], diariesLoading: false })
    } catch (err) {
      set({
        diariesLoading: false,
        diariesError: err instanceof Error ? err.message : '加载日记失败',
      })
    }
  },

  toggleFavorite: async (id: string) => {
    const outfit = get().outfits.find((o) => o.id === id)
    if (!outfit) return

    const newFav = !outfit.is_favorite

    const { error } = await supabase
      .from('outfit')
      .update({ is_favorite: newFav })
      .eq('id', id)

    if (error) throw error

    set((state) => ({
      outfits: state.outfits.map((o) =>
        o.id === id ? { ...o, is_favorite: newFav } : o,
      ),
    }))

    // Update user_profile preference counts when favoriting
    if (newFav && !outfit.is_favorite) {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
          .from('user_profile')
          .select('fav_style_counts, fav_category_counts, fav_color_counts, fav_patterns')
          .eq('user_id', user.id)
          .single()

        if (!profile) return

        const styleCounts = (profile.fav_style_counts as Record<string, number>) ?? {}
        const catCounts = (profile.fav_category_counts as Record<string, number>) ?? {}
        const colorCounts = (profile.fav_color_counts as Record<string, number>) ?? {}

        for (const item of outfit.items) {
          const c = item.clothing
          styleCounts[c.style] = (styleCounts[c.style] ?? 0) + 1
          catCounts[c.category] = (catCounts[c.category] ?? 0) + 1
          colorCounts[c.color] = (colorCounts[c.color] ?? 0) + 1
        }

        const slots = outfit.items.map((i) => i.slot).sort()
        const patterns = (profile.fav_patterns as { slots: string[]; count: number }[]) ?? []
        const existing = patterns.find(
          (p) => p.slots.length === slots.length && p.slots.every((s, i) => s === slots[i]),
        )
        if (existing) {
          existing.count += 1
        } else {
          patterns.push({ slots, count: 1 })
        }

        await supabase
          .from('user_profile')
          .update({
            fav_style_counts: styleCounts,
            fav_category_counts: catCounts,
            fav_color_counts: colorCounts,
            fav_patterns: patterns,
          })
          .eq('user_id', user.id)
      } catch {
        // Non-critical — preference update failing shouldn't block favorite toggle
        console.error('Preference update failed for outfit', id)
      }
    }
  },

  addDiary: async (diary) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const { data: inserted, error } = await supabase
      .from('diary')
      .insert({ ...diary, user_id: user.id } as any)
      .select()
      .single()

    if (error) throw error

    set((state) => ({
      diaries: [inserted as Diary, ...state.diaries],
    }))
  },

  updateDiary: async (id, diary) => {
    const { data: updated, error } = await supabase
      .from('diary')
      .update(diary as any)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    set((state) => ({
      diaries: state.diaries.map((d) => (d.id === id ? { ...d, ...(updated as Diary) } : d)),
    }))
  },

  saveRecommendations: async (candidates, weather) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    // Delete today's old recommendations
    const today = toDateStr(new Date())
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = toDateStr(tomorrow)

    const { data: oldOutfits } = await supabase
      .from('outfit')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_recommended', true)
      .gte('created_at', today)
      .lt('created_at', tomorrowStr)

    if (oldOutfits && oldOutfits.length > 0) {
      const oldIds = oldOutfits.map((o) => o.id)
      await supabase.from('outfit_item').delete().in('outfit_id', oldIds)
      await supabase.from('outfit').delete().in('id', oldIds)
    }

    const results: OutfitWithItems[] = []

    for (const candidate of candidates) {
      const slots: { slot: string; clothing: { id: string } }[] = []
      if (candidate.dress) slots.push({ slot: 'dress', clothing: candidate.dress })
      if (candidate.top) slots.push({ slot: 'top', clothing: candidate.top })
      if (candidate.bottom) slots.push({ slot: 'bottom', clothing: candidate.bottom })
      if (candidate.outerwear) slots.push({ slot: 'outerwear', clothing: candidate.outerwear })
      if (candidate.shoes) slots.push({ slot: 'shoes', clothing: candidate.shoes })
      if (candidate.accessory) slots.push({ slot: 'accessory', clothing: candidate.accessory })

      const name = slots.map((s) => slotLabel(s.slot)).join('+')

      const { data: outfit, error: outfitErr } = await supabase
        .from('outfit')
        .insert({
          name,
          is_recommended: true,
          weather_condition: weather as unknown as import('@/lib/database.types').Json,
          is_favorite: false,
          style: candidate.dress?.style ?? candidate.top?.style ?? null,
          user_id: user.id,
        })
        .select()
        .single()

      if (outfitErr || !outfit) continue

      const items = slots.map((s) => ({
        outfit_id: outfit.id,
        clothing_id: s.clothing.id,
        slot: s.slot,
        layer_order: SLOT_DEFAULT_LAYER[s.slot as keyof typeof SLOT_DEFAULT_LAYER] ?? 3,
      }))

      const { data: insertedItems } = await supabase
        .from('outfit_item')
        .insert(items)
        .select('*, clothing:clothing(*)')

      results.push({
        ...outfit,
        items: (insertedItems as OutfitWithItems['items']) ?? [],
      } as OutfitWithItems)
    }

    return results
  },

  fetchTodayRecommendations: async () => {
    const today = toDateStr(new Date())
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = toDateStr(tomorrow)

    const { data, error } = await supabase
      .from('outfit')
      .select('*, items:outfit_item(*, clothing:clothing(*))')
      .eq('is_recommended', true)
      .gte('created_at', today)
      .lt('created_at', tomorrowStr)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data as OutfitWithItems[]) ?? []
  },
}))
