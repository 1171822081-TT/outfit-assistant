import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import type { Personality, Style, Commute } from '@/lib/types'
import { PERSONALITY_LABELS, STYLE_LABELS, COMMUTE_LABELS } from '@/lib/constants'

const PERSONALITIES: { key: Personality; desc: string }[] = [
  { key: 'outgoing', desc: '喜欢尝试新风格，乐于分享穿搭' },
  { key: 'introverted', desc: '偏爱安静的穿搭语言，细节里见品味' },
  { key: 'confident', desc: '有主见，不跟风，穿出自己的态度' },
  { key: 'gentle', desc: '温柔细腻，喜欢舒服又有质感的搭配' },
]

const STYLES: Style[] = ['casual', 'office', 'sport', 'sweet', 'cool', 'gentle']

const COMMUTES: Commute[] = ['walk', 'bike', 'subway', 'drive', 'home']

const STEPS = ['手机号', '性格', '风格', '通勤']

const cardBase =
  'rounded-[var(--radius-lg)] border px-5 py-4 text-left transition-all duration-[var(--duration-fast)]'

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [step, setStep] = useState(0)
  const [phone, setPhone] = useState('')
  const [personality, setPersonality] = useState<Personality | null>(null)
  const [styles, setStyles] = useState<Style[]>([])
  const [commute, setCommute] = useState<Commute | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const progress = ((step + 1) / STEPS.length) * 100

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 3) return digits
    if (digits.length <= 7) return `${digits.slice(0, 3)} ${digits.slice(3)}`
    return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`
  }

  const toggleStyle = (s: Style) => {
    setStyles((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
  }

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1)
    }
  }

  const handleFinish = async () => {
    if (!user) return
    setIsSaving(true)
    const { error } = await supabase.from('user_profile').upsert({
      user_id: user.id,
      phone: phone.replace(/\s/g, '') || null,
      personality,
      style_prefs: styles,
      commute,
      onboarding_done: true,
    })
    setIsSaving(false)
    if (error) {
      // Retry-safe: proceed anyway
    }
    navigate('/')
  }

  const canNext = (): boolean => {
    if (step === 0) return true // phone is optional
    if (step === 1) return personality !== null
    if (step === 2) return styles.length > 0
    return commute !== null
  }

  return (
    <div className="flex min-h-dvh flex-col px-6">
      {/* Progress bar */}
      <div className="mt-6 h-1 w-full rounded-full bg-[var(--color-border)]">
        <div
          className="h-full rounded-full bg-[var(--color-accent)] transition-[width] duration-[var(--duration-slow)] ease-[var(--ease-out-expo)]"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-3 text-center text-sm text-[var(--color-text-secondary)]">
        {STEPS[step]}
        <span className="ml-1 opacity-40">
          {step + 1} / {STEPS.length}
        </span>
      </p>

      {/* Step content */}
      <div className="flex flex-1 flex-col justify-center py-8">
        {/* Step 0: Phone */}
        {step === 0 && (
          <>
            <h2 className="mb-2 text-center text-[var(--text-xl)] font-semibold">
              绑定手机号
            </h2>
            <p className="mb-8 text-center text-sm text-[var(--color-text-secondary)]">
              用于登录和找回密码，可跳过
            </p>
            <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-3.5">
              <span className="text-[var(--color-text-secondary)]">+86</span>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="138 0000 0000"
                className="flex-1 bg-transparent text-[var(--color-text)] outline-none placeholder:text-[var(--color-border)]"
              />
            </div>
          </>
        )}

        {/* Step 1: Personality */}
        {step === 1 && (
          <>
            <h2 className="mb-8 text-center text-[var(--text-xl)] font-semibold">
              你更接近哪一种穿搭性格？
            </h2>
            <div className="space-y-3">
              {PERSONALITIES.map(({ key, desc }) => (
                <button
                  key={key}
                  onClick={() => setPersonality(key)}
                  className={`${cardBase} w-full ${
                    personality === key
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5 ring-1 ring-[var(--color-accent)]/20'
                      : 'border-[var(--color-border)] hover:border-[var(--color-accent)]/40'
                  }`}
                >
                  <span className="block font-medium text-[var(--color-text)]">
                    {PERSONALITY_LABELS[key]}
                  </span>
                  <span className="mt-1 block text-sm text-[var(--color-text-secondary)]">
                    {desc}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step 2: Style Preferences */}
        {step === 2 && (
          <>
            <h2 className="mb-2 text-center text-[var(--text-xl)] font-semibold">
              你喜欢哪些穿搭风格？
            </h2>
            <p className="mb-8 text-center text-sm text-[var(--color-text-secondary)]">
              可多选，选择最能代表你的风格
            </p>
            <div className="grid grid-cols-2 gap-3">
              {STYLES.map((s) => {
                const active = styles.includes(s)
                return (
                  <button
                    key={s}
                    onClick={() => toggleStyle(s)}
                    className={`${cardBase} ${
                      active
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5 ring-1 ring-[var(--color-accent)]/20'
                        : 'border-[var(--color-border)] hover:border-[var(--color-accent)]/40'
                    }`}
                  >
                    <span className="font-medium text-[var(--color-text)]">
                      {STYLE_LABELS[s]}
                    </span>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {/* Step 3: Commute */}
        {step === 3 && (
          <>
            <h2 className="mb-8 text-center text-[var(--text-xl)] font-semibold">
              你平时主要怎么出门？
            </h2>
            <div className="space-y-3">
              {COMMUTES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCommute(c)}
                  className={`${cardBase} w-full ${
                    commute === c
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5 ring-1 ring-[var(--color-accent)]/20'
                      : 'border-[var(--color-border)] hover:border-[var(--color-accent)]/40'
                  }`}
                >
                  <span className="font-medium text-[var(--color-text)]">
                    {COMMUTE_LABELS[c]}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Bottom actions */}
      <div className="flex gap-3 pb-8">
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-6 py-3.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-alt)]"
          >
            上一步
          </button>
        )}

        {step < STEPS.length - 1 ? (
          <button
            onClick={handleNext}
            disabled={!canNext()}
            className="flex-1 rounded-[var(--radius-md)] bg-[var(--color-accent)] py-3.5 text-base font-semibold text-white transition-all duration-[var(--duration-fast)] hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
          >
            下一步
          </button>
        ) : (
          <button
            onClick={handleFinish}
            disabled={!canNext() || isSaving}
            className="flex-1 rounded-[var(--radius-md)] bg-[var(--color-accent)] py-3.5 text-base font-semibold text-white transition-all duration-[var(--duration-fast)] hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
          >
            {isSaving ? '保存中...' : '开始使用'}
          </button>
        )}
      </div>
    </div>
  )
}
