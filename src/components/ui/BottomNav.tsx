import { NavLink } from 'react-router-dom'

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-lg border-t border-[var(--color-border)] bg-[var(--color-surface)] pb-[env(safe-area-inset-bottom,0px)]">
      <div className="flex h-14">
        {[
          { to: '/', label: '推荐' },
          { to: '/wardrobe', label: '衣柜' },
          { to: '/outfits', label: '搭配' },
        ].map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-1 items-center justify-center text-sm font-medium ${
                isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)]'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
