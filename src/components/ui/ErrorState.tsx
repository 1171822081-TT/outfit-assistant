interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export default function ErrorState({
  message = '出了点问题',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="text-4xl">😿</span>
        <h3 className="text-lg font-medium">出错了</h3>
        <p className="text-sm text-[var(--color-text-secondary)]">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 rounded-full bg-[var(--color-accent)] px-6 py-2 text-sm font-medium text-white"
          >
            重试
          </button>
        )}
      </div>
    </div>
  )
}
