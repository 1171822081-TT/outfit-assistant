interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

export default function EmptyState({ icon = '📦', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="text-4xl">{icon}</span>
        <h3 className="text-lg font-medium">{title}</h3>
        {description && (
          <p className="text-sm text-[var(--color-text-secondary)]">{description}</p>
        )}
        {action && (
          <button
            onClick={action.onClick}
            className="mt-2 rounded-full bg-[var(--color-accent)] px-6 py-2 text-sm font-medium text-white"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  )
}
