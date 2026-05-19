import { useState, useEffect, useCallback } from 'react'
import type { WeatherData } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { WEATHER_CACHE_KEY } from '@/lib/constants'

interface WeatherCache {
  data: WeatherData
  lat: number
  lon: number
}

const CN_DATE_FORMATTER = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function getTodayKey(): string {
  return CN_DATE_FORMATTER.format(new Date()).replace(/\//g, '-')
}

function formatDateCN(iso: string): string {
  return CN_DATE_FORMATTER.format(new Date(iso)).replace(/\//g, '-')
}

function isValidWeatherData(data: unknown): data is WeatherData {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  return (
    typeof d.temp_high === 'number' &&
    typeof d.temp_low === 'number' &&
    typeof d.weather_type === 'string' &&
    typeof d.precip_probability === 'number' &&
    typeof d.fetched_at === 'string'
  )
}

function readCache(lat: number, lon: number): WeatherData | null {
  try {
    const raw = localStorage.getItem(WEATHER_CACHE_KEY)
    if (!raw) return null
    const cache: unknown = JSON.parse(raw)
    if (!cache || typeof cache !== 'object') return null
    const { data, lat: cLat, lon: cLon } = cache as WeatherCache
    if (!isValidWeatherData(data)) return null
    if (formatDateCN(data.fetched_at) !== getTodayKey()) return null
    if (Math.abs(cLat - lat) >= 0.5 || Math.abs(cLon - lon) >= 0.5) return null
    return data
  } catch {
    return null
  }
}

function writeCache(lat: number, lon: number, data: WeatherData): void {
  try {
    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({ data, lat, lon } satisfies WeatherCache))
  } catch {
    // localStorage full or unavailable
  }
}

interface UseWeatherReturn {
  weather: WeatherData | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useWeather(lat: number, lon: number): UseWeatherReturn {
  const [weather, setWeather] = useState<WeatherData | null>(() => readCache(lat, lon))
  const [isLoading, setIsLoading] = useState(!weather)
  const [error, setError] = useState<string | null>(null)

  const fetchWeather = useCallback(async () => {
    setError(null)
    const cached = readCache(lat, lon)
    if (cached) {
      setWeather(cached)
      return
    }

    setIsLoading(true)
    try {
      const { data, error: fnError } = await supabase.functions.invoke<{
        success: boolean
        data?: WeatherData
        error?: string
      }>('weather', {
        body: { lat, lon },
      })

      if (fnError) throw fnError
      if (!data?.success || !data.data) {
        throw new Error(data?.error ?? '天气数据获取失败')
      }

      setWeather(data.data)
      writeCache(lat, lon, data.data)
    } catch (err) {
      const message = err instanceof Error ? err.message : '天气服务异常'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [lat, lon])

  useEffect(() => {
    fetchWeather()
  }, [fetchWeather])

  return { weather, isLoading, error, refetch: fetchWeather }
}
