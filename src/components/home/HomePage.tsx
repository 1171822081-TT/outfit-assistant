import { useEffect, useState, useCallback, useRef } from 'react'
import type { OutfitWithItems, Compliment, Personality } from '@/lib/types'
import { useWeather } from '@/hooks/useWeather'
import { useOutfitStore } from '@/stores/outfitStore'
import { useWardrobeStore } from '@/stores/wardrobeStore'
import { useAuthStore } from '@/stores/authStore'
import { recommend } from '@/lib/recommendation'
import { matchPraise } from '@/lib/praise'
import { supabase } from '@/lib/supabase'
import WeatherCard from './WeatherCard'
import PraiseBanner from './PraiseBanner'
import ModelViewer from './ModelViewer'
import OutfitSwitcher from './OutfitSwitcher'
import OutfitActions from './OutfitActions'

const DEFAULT_LAT = 39.9
const DEFAULT_LON = 116.4

type LoadingPhase = 'initial' | 'generating' | 'ready' | 'empty'

export default function HomePage() {
  const [recommendedOutfits, setRecommendedOutfits] = useState<OutfitWithItems[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState<LoadingPhase>('initial')
  const [generating, setGenerating] = useState(false)
  const loadedRef = useRef(false)

  // Praise state
  const [praiseText, setPraiseText] = useState<string | null>(null)
  const [personality, setPersonality] = useState<Personality | null>(null)
  const [compliments, setCompliments] = useState<Compliment[]>([])

  // Stores
  const { user } = useAuthStore()
  const { items: wardrobeItems, fetchItems: fetchWardrobe } = useWardrobeStore()
  const { fetchTodayRecommendations, saveRecommendations, toggleFavorite } = useOutfitStore()

  // Weather
  const { weather, isLoading: weatherLoading, error: weatherError, refetch: refetchWeather } = useWeather(
    DEFAULT_LAT,
    DEFAULT_LON,
  )

  // Fetch wardrobe, profile, and compliments on mount
  useEffect(() => {
    fetchWardrobe()
    supabase
      .from('compliments')
      .select('*')
      .then(({ data }) => {
        if (data) setCompliments(data as Compliment[])
      })

    if (user) {
      supabase
        .from('user_profile')
        .select('personality, style_prefs, commute, fav_style_counts, fav_category_counts')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setPersonality(data.personality as Personality)
          }
        })
    }
  }, [fetchWardrobe, user])

  // Load today's recommendations or generate new ones
  useEffect(() => {
    if (weatherLoading || generating) return
    if (loadedRef.current && recommendedOutfits.length > 0) return

    async function loadRecommendations() {
      try {
        const todayOutfits = await fetchTodayRecommendations()
        if (todayOutfits.length > 0) {
          setRecommendedOutfits(todayOutfits)
          setPhase('ready')
          loadedRef.current = true
          return
        }
      } catch {
        // Fetch failed, will try to generate
      }

      if (wardrobeItems.length === 0) {
        setPhase('empty')
        return
      }

      if (!weather) return

      setGenerating(true)
      setPhase('generating')
      try {
        const { data: profile } = await supabase
          .from('user_profile')
          .select('style_prefs, commute, fav_style_counts, fav_category_counts')
          .eq('user_id', user?.id)
          .single()

        const result = recommend(wardrobeItems, weather, {
          style_prefs: (profile?.style_prefs as string[]) ?? [],
          commute: profile?.commute ?? 'walk',
          fav_style_counts: (profile?.fav_style_counts as Record<string, number>) ?? {},
          fav_category_counts: (profile?.fav_category_counts as Record<string, number>) ?? {},
        })

        if (result.outfits.length === 0) {
          setPhase('empty')
          return
        }

        const saved = await saveRecommendations(result.outfits, weather)
        if (saved.length > 0) {
          setRecommendedOutfits(saved)
          setPhase('ready')
          loadedRef.current = true
        } else {
          setPhase('empty')
        }
      } catch {
        setPhase('empty')
      } finally {
        setGenerating(false)
      }
    }

    loadRecommendations()
  }, [weather, weatherLoading, wardrobeItems, generating, fetchTodayRecommendations, saveRecommendations, user])

  // Update praise when current outfit changes
  useEffect(() => {
    const outfit = recommendedOutfits[currentIndex]
    if (!outfit || !personality) {
      setPraiseText(null)
      return
    }

    const clothing = outfit.items.map((i) => i.clothing)
    try {
      const praise = matchPraise(clothing, personality, compliments)
      setPraiseText(praise.text)
    } catch {
      setPraiseText(null)
    }
  }, [currentIndex, recommendedOutfits, personality, compliments])

  const handleSwitch = useCallback((index: number) => {
    setCurrentIndex(index)
  }, [])

  const handleToggleFavorite = useCallback(async () => {
    const outfit = recommendedOutfits[currentIndex]
    if (!outfit) return
    await toggleFavorite(outfit.id)
    setRecommendedOutfits((prev) =>
      prev.map((o) =>
        o.id === outfit.id ? { ...o, is_favorite: !o.is_favorite } : o,
      ),
    )
  }, [currentIndex, recommendedOutfits, toggleFavorite])

  const handleRefresh = useCallback(async () => {
    if (!weather || wardrobeItems.length === 0) return

    setGenerating(true)
    try {
      const { data: profile } = await supabase
        .from('user_profile')
        .select('style_prefs, commute, fav_style_counts, fav_category_counts')
        .eq('user_id', user?.id)
        .single()

      const result = recommend(wardrobeItems, weather, {
        style_prefs: (profile?.style_prefs as string[]) ?? [],
        commute: profile?.commute ?? 'walk',
        fav_style_counts: (profile?.fav_style_counts as Record<string, number>) ?? {},
        fav_category_counts: (profile?.fav_category_counts as Record<string, number>) ?? {},
      })

      if (result.outfits.length === 0) return

      const saved = await saveRecommendations(result.outfits, weather)
      if (saved.length > 0) {
        setRecommendedOutfits(saved)
        setCurrentIndex(0)
        refetchWeather()
      }
    } finally {
      setGenerating(false)
    }
  }, [weather, wardrobeItems, user, saveRecommendations, refetchWeather])

  const handleCustomEdit = useCallback(() => {
    // Phase 6: navigate to outfit editor
  }, [])

  const currentOutfit = recommendedOutfits[currentIndex] ?? null
  const isInitial = phase === 'initial' || weatherLoading
  const isReady = phase === 'ready' && !isInitial

  return (
    <div className="flex flex-col gap-4 px-4 pb-6 pt-4">
      {/* Weather Card */}
      <WeatherCard
        weather={weather}
        isLoading={weatherLoading}
        error={weatherError}
        onRefresh={refetchWeather}
      />

      {/* Praise Banner */}
      <PraiseBanner text={praiseText} personality={personality} />

      {/* Model Viewer */}
      <ModelViewer outfit={isReady ? currentOutfit : null} isLoading={isInitial || generating} />

      {/* Outfit Switcher */}
      <OutfitSwitcher
        outfits={recommendedOutfits}
        currentIndex={currentIndex}
        onSwitch={handleSwitch}
        isLoading={isInitial || generating}
      />

      {/* Outfit Actions */}
      <OutfitActions
        isFavorite={currentOutfit?.is_favorite ?? false}
        onToggleFavorite={handleToggleFavorite}
        onRefresh={handleRefresh}
        onCustomEdit={handleCustomEdit}
        isLoading={isInitial || generating}
        hasOutfit={isReady}
      />

      {/* Generating Pulse */}
      {generating && (
        <div className="flex flex-col items-center gap-2 py-4">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-2 w-2 animate-bounce rounded-full bg-[var(--color-accent)]"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">正在搭配...</p>
        </div>
      )}

      {/* Empty State */}
      {phase === 'empty' && !generating && !isInitial && (
        <div className="flex flex-col items-center gap-4 py-12">
          <span className="text-5xl">👗</span>
          <div className="text-center">
            <p className="text-sm font-medium text-[var(--color-text)]">暂无推荐搭配</p>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
              {wardrobeItems.length === 0
                ? '先去衣柜添加几件衣物吧'
                : '当前天气下没有合适的搭配，请添加更多衣物'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
