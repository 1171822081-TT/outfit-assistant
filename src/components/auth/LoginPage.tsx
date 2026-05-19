import { useState, useRef, useEffect, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

type Mode = 'password' | 'otp' | 'reset'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    signIn,
    signInWithPhone,
    sendEmailOtp,
    verifyEmailOtp,
    resetPassword,
    updatePassword,
    checkOnboarding,
  } = useAuthStore()

  const prefilledEmail = (location.state as { email?: string })?.email ?? ''

  const [mode, setMode] = useState<Mode>('password')
  const [identifier, setIdentifier] = useState(prefilledEmail)
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetStep, setResetStep] = useState<'send' | 'verify'>('send')
  const [error, setError] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const otpRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (mode === 'otp' || (mode === 'reset' && resetStep === 'verify')) {
      otpRef.current?.focus()
    }
  }, [mode, resetStep])

  const isEmail = (val: string) => val.includes('@')

  const handlePasswordLogin = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!identifier.trim()) {
      setError('请输入邮箱或手机号')
      return
    }
    if (password.length < 6) {
      setError('密码至少6位')
      return
    }

    setIsSubmitting(true)
    try {
      if (isEmail(identifier)) {
        await signIn(identifier.trim(), password)
      } else {
        const clean = identifier.replace(/\s/g, '')
        await signInWithPhone(clean, password)
      }
      const needsOnboarding = await checkOnboarding()
      navigate(needsOnboarding ? '/onboarding' : '/')
    } catch (err) {
      const msg = err instanceof Error ? err.message : '登录失败'
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!isEmail(identifier)) {
      setError('请输入正确的邮箱地址')
      return
    }
    setIsSending(true)
    try {
      await sendEmailOtp(identifier.trim())
      setError('')
    } catch {
      setError('验证码发送失败，请稍后重试')
    } finally {
      setIsSending(false)
    }
  }

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault()
    if (otp.length < 6) {
      setError('请输入6位验证码')
      return
    }
    setError('')
    setIsSubmitting(true)
    try {
      await verifyEmailOtp(identifier.trim(), otp)
      const needsOnboarding = await checkOnboarding()
      navigate(needsOnboarding ? '/onboarding' : '/')
    } catch {
      setError('验证码错误，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSendResetOtp = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!isEmail(identifier)) {
      setError('请输入正确的邮箱地址')
      return
    }
    setIsSending(true)
    try {
      await resetPassword(identifier.trim())
      setResetStep('verify')
    } catch {
      setError('发送失败，请检查邮箱是否正确')
    } finally {
      setIsSending(false)
    }
  }

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault()
    if (otp.length < 6) {
      setError('请输入6位验证码')
      return
    }
    if (newPassword.length < 6) {
      setError('新密码至少6位')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }
    setError('')
    setIsSubmitting(true)
    try {
      await updatePassword(identifier.trim(), otp, newPassword)
      navigate('/')
    } catch {
      setError('重置失败，请检查验证码是否正确')
    } finally {
      setIsSubmitting(false)
    }
  }

  const switchTo = (m: Mode) => {
    setMode(m)
    setError('')
    setOtp('')
  }

  return (
    <div className="flex min-h-dvh flex-col justify-center px-6">
      <div className="mb-12 text-center">
        <h1 className="text-[2.25rem] font-bold tracking-tight text-[var(--color-text)]">
          穿搭助手
        </h1>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          每天一套，穿出好心情
        </p>
      </div>

      {/* Mode tabs */}
      <div className="mb-6 flex rounded-[var(--radius-md)] bg-[var(--color-surface-alt)] p-1">
        {([
          ['password', '密码登录'],
          ['otp', '验证码登录'],
        ] as const).map(([m, label]) => (
          <button
            key={m}
            type="button"
            onClick={() => switchTo(m as Mode)}
            className={`flex-1 rounded-[var(--radius-sm)] py-2.5 text-sm font-medium transition-all duration-[var(--duration-fast)] ${
              mode === m
                ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Password login */}
      {mode === 'password' && (
        <form onSubmit={handlePasswordLogin} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]">
              邮箱或手机号
            </label>
            <input
              type="text"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="hello@example.com 或 手机号"
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-3.5 text-[var(--color-text)] outline-none transition-colors focus:border-[var(--color-accent)] placeholder:text-[var(--color-border)]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]">
              密码
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少6位"
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-3.5 text-[var(--color-text)] outline-none transition-colors focus:border-[var(--color-accent)] placeholder:text-[var(--color-border)]"
            />
          </div>

          {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-[var(--radius-md)] bg-[var(--color-accent)] py-3.5 text-base font-semibold text-white transition-all duration-[var(--duration-fast)] hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? '登录中...' : '登录'}
          </button>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="font-medium text-[var(--color-accent)] hover:underline"
            >
              去注册
            </button>
            <button
              type="button"
              onClick={() => {
                switchTo('reset')
                setResetStep('send')
              }}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
            >
              忘记密码？
            </button>
          </div>
        </form>
      )}

      {/* Email OTP login */}
      {mode === 'otp' && (
        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]">
              邮箱地址
            </label>
            <input
              type="email"
              autoComplete="email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="hello@example.com"
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-3.5 text-[var(--color-text)] outline-none transition-colors focus:border-[var(--color-accent)] placeholder:text-[var(--color-border)]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]">
              验证码
            </label>
            <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-3.5 focus-within:border-[var(--color-accent)]">
              <input
                ref={otpRef}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="输入6位验证码"
                className="flex-1 bg-transparent text-center text-lg tracking-[0.3em] text-[var(--color-text)] outline-none placeholder:tracking-normal placeholder:text-[var(--color-border)]"
              />
            </div>
          </div>

          {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting || otp.length < 6}
            className="w-full rounded-[var(--radius-md)] bg-[var(--color-accent)] py-3.5 text-base font-semibold text-white transition-all duration-[var(--duration-fast)] hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? '验证中...' : '登录'}
          </button>

          <button
            type="button"
            onClick={handleSendOtp}
            disabled={isSending}
            className="w-full py-2 text-sm text-[var(--color-accent)] hover:underline disabled:opacity-50"
          >
            {isSending ? '发送中...' : '获取验证码'}
          </button>
        </form>
      )}

      {/* Password reset */}
      {mode === 'reset' && resetStep === 'send' && (
        <form onSubmit={handleSendResetOtp} className="space-y-5">
          <div className="text-center">
            <p className="text-sm text-[var(--color-text-secondary)]">
              输入注册邮箱，我们将发送验证码
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]">
              邮箱地址
            </label>
            <input
              type="email"
              autoComplete="email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="hello@example.com"
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-3.5 text-[var(--color-text)] outline-none transition-colors focus:border-[var(--color-accent)] placeholder:text-[var(--color-border)]"
            />
          </div>

          {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

          <button
            type="submit"
            disabled={isSending}
            className="w-full rounded-[var(--radius-md)] bg-[var(--color-accent)] py-3.5 text-base font-semibold text-white transition-all duration-[var(--duration-fast)] hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          >
            {isSending ? '发送中...' : '获取验证码'}
          </button>

          <button
            type="button"
            onClick={() => switchTo('password')}
            className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
          >
            返回登录
          </button>
        </form>
      )}

      {mode === 'reset' && resetStep === 'verify' && (
        <form onSubmit={handleResetPassword} className="space-y-5">
          <div className="text-center">
            <p className="text-sm text-[var(--color-text-secondary)]">
              验证码已发送至
            </p>
            <p className="mt-1 font-medium text-[var(--color-text)]">{identifier}</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]">
              验证码
            </label>
            <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-3.5 focus-within:border-[var(--color-accent)]">
              <input
                ref={otpRef}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="输入6位验证码"
                className="flex-1 bg-transparent text-center text-lg tracking-[0.3em] text-[var(--color-text)] outline-none placeholder:tracking-normal placeholder:text-[var(--color-border)]"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]">
              新密码
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="至少6位"
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-3.5 text-[var(--color-text)] outline-none transition-colors focus:border-[var(--color-accent)] placeholder:text-[var(--color-border)]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]">
              确认新密码
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再次输入新密码"
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-3.5 text-[var(--color-text)] outline-none transition-colors focus:border-[var(--color-accent)] placeholder:text-[var(--color-border)]"
            />
          </div>

          {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-[var(--radius-md)] bg-[var(--color-accent)] py-3.5 text-base font-semibold text-white transition-all duration-[var(--duration-fast)] hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? '重置中...' : '重置密码'}
          </button>

          <button
            type="button"
            onClick={() => {
              switchTo('password')
              setResetStep('send')
            }}
            className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
          >
            返回登录
          </button>
        </form>
      )}

      <p className="mt-10 text-center text-xs text-[var(--color-text-secondary)]/60">
        登录即代表同意服务条款与隐私政策
      </p>
    </div>
  )
}
