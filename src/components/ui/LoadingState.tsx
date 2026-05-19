interface LoadingStateProps {
  text?: string
}

export default function LoadingState({ text = '加载中...' }: LoadingStateProps) {
  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)]" />
        <span className="text-sm text-[var(--color-text-secondary)]">{text}</span>
      </div>
    </div>
  )
}
