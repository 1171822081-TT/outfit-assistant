import { useState, useMemo, useEffect, useCallback } from 'react'
import type { Diary, OutfitWithItems } from '@/lib/types'
import { useOutfitStore } from '@/stores/outfitStore'

interface DayCell {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  diary: Diary | undefined
}

function toDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getMonthDays(year: number, month: number, diaries: Diary[]): DayCell[] {
  const today = new Date()
  const todayStr = toDateStr(today)
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPad = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1 // Monday start

  const diaryMap = new Map<string, Diary>()
  for (const d of diaries) {
    diaryMap.set(d.date, d)
  }

  const days: DayCell[] = []

  // Previous month padding
  const prevLast = new Date(year, month, 0).getDate()
  for (let i = startPad - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevLast - i)
    const dateStr = toDateStr(date)
    days.push({
      date,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      diary: undefined,
    })
  }

  // Current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d)
    const dateStr = toDateStr(date)
    days.push({
      date,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      diary: diaryMap.get(dateStr),
    })
  }

  // Next month padding to fill 6 rows
  const remaining = 42 - days.length
  for (let d = 1; d <= remaining; d++) {
    const date = new Date(year, month + 1, d)
    const dateStr = toDateStr(date)
    days.push({
      date,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      diary: undefined,
    })
  }

  return days
}

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

const RATING_LABELS = ['', '很差', '一般', '不错', '很好', '超赞']

interface DiaryModalProps {
  date: string
  existingDiary: Diary | null
  outfits: OutfitWithItems[]
  onSave: (data: { outfit_id: string | null; rating: number; note: string }) => Promise<void>
  onClose: () => void
}

function DiaryModal({ date, existingDiary, outfits, onSave, onClose }: DiaryModalProps) {
  const [outfitId, setOutfitId] = useState<string | null>(existingDiary?.outfit_id ?? null)
  const [rating, setRating] = useState(existingDiary?.rating ?? 0)
  const [note, setNote] = useState(existingDiary?.note ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await onSave({ outfit_id: outfitId, rating, note })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const dateLabel = new Date(date).toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-[var(--radius-lg)] bg-[var(--color-surface)] p-5 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold">{dateLabel}</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)]"
            aria-label="关闭"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Outfit selector */}
        <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
          选择搭配
        </label>
        <select
          value={outfitId ?? ''}
          onChange={(e) => setOutfitId(e.target.value || null)}
          className="mb-4 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2.5 text-sm focus:border-[var(--color-accent)] focus:outline-none"
        >
          <option value="">不选搭配</option>
          {outfits.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>

        {/* Rating */}
        <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
          评分
        </label>
        <div className="mb-4 flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className={`text-2xl transition-colors ${
                star <= rating ? 'text-yellow-400' : 'text-[var(--color-border)]'
              }`}
              aria-label={`${star} 星`}
            >
              ★
            </button>
          ))}
          <span className="ml-2 self-center text-xs text-[var(--color-text-secondary)]">
            {rating > 0 ? RATING_LABELS[rating] : ''}
          </span>
        </div>

        {/* Notes */}
        <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
          备注
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="今天穿这身感觉怎么样..."
          rows={3}
          maxLength={200}
          className="mb-4 w-full resize-none rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2.5 text-sm placeholder:text-[var(--color-border)] focus:border-[var(--color-accent)] focus:outline-none"
        />

        {/* Error */}
        {error && (
          <p className="mb-3 text-xs text-[var(--color-danger)]">{error}</p>
        )}

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-[var(--radius-md)] bg-[var(--color-accent)] py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
        >
          {saving ? '保存中...' : existingDiary ? '更新日记' : '保存日记'}
        </button>
      </div>
    </div>
  )
}

export default function OutfitCalendar() {
  const {
    diaries, outfits,
    outfitsLoading, outfitsError,
    diariesLoading, diariesError,
    fetchDiaries, fetchOutfits, addDiary, updateDiary,
  } = useOutfitStore()
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  const [modalDate, setModalDate] = useState<string | null>(null)

  useEffect(() => {
    fetchDiaries()
    fetchOutfits()
  }, [fetchDiaries, fetchOutfits])

  const days = useMemo(
    () => getMonthDays(currentMonth.year, currentMonth.month, diaries),
    [currentMonth, diaries],
  )

  const prevMonth = useCallback(() => {
    setCurrentMonth((m) =>
      m.month === 0 ? { year: m.year - 1, month: 11 } : { year: m.year, month: m.month - 1 },
    )
  }, [])

  const nextMonth = useCallback(() => {
    setCurrentMonth((m) =>
      m.month === 11 ? { year: m.year + 1, month: 0 } : { year: m.year, month: m.month + 1 },
    )
  }, [])

  const handleDateClick = useCallback((day: DayCell) => {
    if (!day.isCurrentMonth) return
    const dateStr = toDateStr(day.date)
    setModalDate(dateStr)
  }, [])

  const handleSaveDiary = useCallback(
    async (data: { outfit_id: string | null; rating: number; note: string }) => {
      if (!modalDate) return

      const existingDiary = diaries.find((d) => d.date === modalDate)

      if (existingDiary) {
        await updateDiary(existingDiary.id, {
          outfit_id: data.outfit_id,
          rating: data.rating,
          note: data.note || null,
          weather_info: null,
        })
      } else {
        await addDiary({
          date: modalDate,
          outfit_id: data.outfit_id,
          weather_info: null,
          rating: data.rating,
          note: data.note || null,
        })
      }
    },
    [modalDate, diaries, addDiary, updateDiary],
  )

  const existingDiary = modalDate ? diaries.find((d) => d.date === modalDate) ?? null : null

  const monthLabel = `${currentMonth.year}年 ${currentMonth.month + 1}月`

  const isLoading = outfitsLoading || diariesLoading
  const error = outfitsError || diariesError

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="text-5xl">⚠️</span>
        <p className="mt-4 text-sm font-medium text-[var(--color-text-secondary)]">加载失败</p>
        <p className="mt-1 text-xs text-[var(--color-border)]">{error}</p>
        <button
          onClick={() => { fetchDiaries(); fetchOutfits() }}
          className="mt-3 text-sm font-medium text-[var(--color-accent)]"
        >
          重试
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Month header */}
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)]"
          aria-label="上个月"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h3 className="text-base font-semibold">{monthLabel}</h3>
        <button
          onClick={nextMonth}
          className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)]"
          aria-label="下个月"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-1">
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-1 text-center text-xs text-[var(--color-text-secondary)]">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 42 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square animate-pulse rounded-[var(--radius-sm)] bg-[var(--color-surface-alt)]"
              />
            ))}
          </div>
        </div>
      ) : (
        <div>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-1 text-center text-xs font-medium text-[var(--color-text-secondary)]">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) => (
              <button
                key={i}
                onClick={() => handleDateClick(day)}
                disabled={!day.isCurrentMonth}
                className={`relative flex aspect-square items-center justify-center rounded-[var(--radius-sm)] text-sm transition-colors ${
                  !day.isCurrentMonth
                    ? 'cursor-default text-transparent'
                    : day.isToday
                      ? 'bg-[var(--color-accent)] font-semibold text-white'
                      : 'hover:bg-[var(--color-surface-alt)]'
                }`}
              >
                {day.date.getDate()}
                {day.diary && (
                  <span
                    className={`absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${
                      day.isToday ? 'bg-white' : 'bg-[var(--color-accent)]'
                    }`}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Diary count */}
      <p className="mt-3 text-center text-xs text-[var(--color-text-secondary)]">
        {diaries.length > 0 ? `本月 ${diaries.length} 条日记` : '还没有穿搭日记，点击日期开始记录'}
      </p>

      {/* Diary Modal */}
      {modalDate && (
        <DiaryModal
          date={modalDate}
          existingDiary={existingDiary}
          outfits={outfits}
          onSave={handleSaveDiary}
          onClose={() => setModalDate(null)}
        />
      )}
    </div>
  )
}
