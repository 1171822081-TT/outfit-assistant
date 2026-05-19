import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { signUp } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.includes('@')) {
      setError('请输入正确的邮箱地址')
      return
    }
    if (password.length < 6) {
      setError('密码至少6位')
      return
    }
    if (password !== confirm) {
      setError('两次输入的密码不一致')
      return
    }
    setError('')
    setIsSubmitting(true)
    try {
      await signUp(email, password)
      navigate('/login', { state: { email } })
    } catch (err) {
      const msg = err instanceof Error ? err.message : '注册失败'
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col justify-center px-6">
      <div className="mb-12 text-center">
        <h1 className="text-[2.25rem] font-bold tracking-tight text-[var(--color-text)]">
          注册账号
        </h1>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          使用邮箱注册
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]">
            邮箱地址
          </label>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="hello@example.com"
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-3.5 text-[var(--color-text)] outline-none transition-colors focus:border-[var(--color-accent)] placeholder:text-[var(--color-border)]"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]">
            设置密码
          </label>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="至少6位"
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-3.5 text-[var(--color-text)] outline-none transition-colors focus:border-[var(--color-accent)] placeholder:text-[var(--color-border)]"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]">
            确认密码
          </label>
          <input
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="再次输入密码"
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-3.5 text-[var(--color-text)] outline-none transition-colors focus:border-[var(--color-accent)] placeholder:text-[var(--color-border)]"
          />
        </div>

        {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-[var(--radius-md)] bg-[var(--color-accent)] py-3.5 text-base font-semibold text-white transition-all duration-[var(--duration-fast)] hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
        >
          {isSubmitting ? '注册中...' : '注册'}
        </button>

        <p className="text-center text-sm text-[var(--color-text-secondary)]">
          已有账号？
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="font-medium text-[var(--color-accent)] hover:underline"
          >
            去登录
          </button>
        </p>
      </form>
    </div>
  )
}
