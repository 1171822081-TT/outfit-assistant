import { useCallback, useState } from 'react'
import type { WeatherData } from '@/lib/types'

interface WeatherCardProps {
  weather: WeatherData | null
  isLoading: boolean
  error: string | null
  onRefresh: () => void
}

function weatherEmoji(type: string): string {
  const t = type.toLowerCase()
  if (t.includes('晴')) return '☀️'
  if (t.includes('多云')) return '⛅'
  if (t.includes('阴')) return '☁️'
  if (t.includes('雨') || t.includes('rain')) return '🌧️'
  if (t.includes('雪') || t.includes('snow')) return '❄️'
  if (t.includes('风') || t.includes('wind')) return '💨'
  return '🌤️'
}

function windLabel(level: number): string {
  if (level <= 2) return '微风'
  if (level <= 4) return '和风'
  if (level <= 6) return '强风'
  return '大风'
}

export default function WeatherCard({ weather, isLoading, error, onRefresh }: WeatherCardProps) {
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    onRefresh()
    setTimeout(() => setRefreshing(false), 1000)
  }, [onRefresh])

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-alt)] p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-[var(--color-border)]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 rounded bg-[var(--color-border)]" />
            <div className="h-3 w-32 rounded bg-[var(--color-border)]" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !weather) {
    return (
      <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface-alt)] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌤️</span>
            <span className="text-sm text-[var(--color-text-secondary)]">
              {error ?? '天气数据加载失败'}
            </span>
          </div>
          <button
            onClick={handleRefresh}
            className="rounded-full bg-[var(--color-accent)] px-4 py-1.5 text-xs font-medium text-white"
          >
            重试
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface-alt)] p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{weatherEmoji(weather.weather_type)}</span>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold">{weather.temp_high}°</span>
              <span className="text-sm text-[var(--color-text-secondary)]">
                / {weather.temp_low}°
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {weather.weather_type} · {windLabel(weather.wind_level)} · 湿度{weather.humidity}%
            </p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className={`rounded-full p-2 text-[var(--color-text-secondary)] transition-all ${
            refreshing ? 'animate-spin' : ''
          }`}
          aria-label="刷新天气"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 4v6h6M23 20v-6h-6" />
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
          </svg>
        </button>
      </div>
      {weather.precip_probability > 50 && (
        <div className="mt-3 flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-accent)]/10 px-3 py-1.5">
          <span className="text-xs">🌂</span>
          <p className="text-xs font-medium text-[var(--color-accent)]">
            降水概率 {weather.precip_probability}%，建议携带雨具
          </p>
        </div>
      )}
    </div>
  )
}
