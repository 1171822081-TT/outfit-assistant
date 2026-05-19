import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { WeatherData } from '@/lib/types'

const mockInvoke = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
}))

const WEATHER_CACHE_KEY = 'weather_cache_v1'

function makeWeather(overrides: Partial<WeatherData> = {}): WeatherData {
  return {
    temp_high: 25,
    temp_low: 15,
    weather_type: '晴',
    wind_level: 2,
    precip_probability: 10,
    humidity: 50,
    fetched_at: new Date().toISOString(),
    ...overrides,
  }
}

describe('useWeather', () => {
  beforeEach(() => {
    localStorage.clear()
    mockInvoke.mockReset()
  })

  it('returns cached weather when valid and same-day', async () => {
    const weather = makeWeather()
    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({
      data: weather,
      lat: 39.9,
      lon: 116.4,
    }))

    const { useWeather } = await import('./useWeather')
    const { result } = renderHook(() => useWeather(39.9, 116.4))

    expect(result.current.weather).toEqual(weather)
    expect(result.current.isLoading).toBe(false)
    expect(mockInvoke).not.toHaveBeenCalled()
  })

  it('ignores stale cache from a different day', async () => {
    const oldWeather = makeWeather({
      fetched_at: '2020-01-01T12:00:00.000Z',
    })
    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({
      data: oldWeather,
      lat: 39.9,
      lon: 116.4,
    }))

    mockInvoke.mockResolvedValueOnce({
      data: { success: true, data: makeWeather() },
      error: null,
    })

    const { useWeather } = await import('./useWeather')
    renderHook(() => useWeather(39.9, 116.4))

    expect(mockInvoke).toHaveBeenCalled()
  })

  it('ignores cache when location differs by >= 0.5 degrees', async () => {
    const weather = makeWeather()
    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({
      data: weather,
      lat: 39.9,
      lon: 116.4,
    }))

    mockInvoke.mockResolvedValueOnce({
      data: { success: true, data: makeWeather() },
      error: null,
    })

    const { useWeather } = await import('./useWeather')
    renderHook(() => useWeather(40.5, 117.0))

    expect(mockInvoke).toHaveBeenCalled()
  })

  it('fetches weather from edge function on cache miss', async () => {
    const weather = makeWeather()
    mockInvoke.mockResolvedValueOnce({
      data: { success: true, data: weather },
      error: null,
    })

    const { useWeather } = await import('./useWeather')
    const { result } = renderHook(() => useWeather(39.9, 116.4))

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.weather).toEqual(weather)
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('sets error when edge function returns unsuccessful', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { success: false, error: '天气数据获取失败' },
      error: null,
    })

    const { useWeather } = await import('./useWeather')
    const { result } = renderHook(() => useWeather(39.9, 116.4))

    await waitFor(() => {
      expect(result.current.error).toBe('天气数据获取失败')
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('sets error when edge function throws', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: null,
      error: new Error('Network error'),
    })

    const { useWeather } = await import('./useWeather')
    const { result } = renderHook(() => useWeather(39.9, 116.4))

    await waitFor(() => {
      expect(result.current.error).toBe('Network error')
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('refetch calls edge function when cache is cleared', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { success: true, data: makeWeather({ temp_high: 30 }) },
      error: null,
    })

    const { useWeather } = await import('./useWeather')
    const { result } = renderHook(() => useWeather(39.9, 116.4))

    // First call — no cache, fetches from edge function
    await waitFor(() => {
      expect(result.current.weather?.temp_high).toBe(30)
    })

    // Clear cache so refetch actually hits the edge function
    localStorage.removeItem(WEATHER_CACHE_KEY)
    mockInvoke.mockResolvedValueOnce({
      data: { success: true, data: makeWeather({ temp_high: 22 }) },
      error: null,
    })

    result.current.refetch()

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledTimes(2)
    })
  })
})
