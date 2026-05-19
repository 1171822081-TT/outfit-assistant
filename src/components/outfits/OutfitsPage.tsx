import { useState, useCallback } from 'react'
import OutfitList from './OutfitList'
import OutfitCalendar from './OutfitCalendar'
import OutfitEditor from './OutfitEditor'

type Section = 'list' | 'calendar' | 'editor'

const SECTIONS: { key: Section; label: string }[] = [
  { key: 'list', label: '搭配列表' },
  { key: 'calendar', label: '穿搭日历' },
  { key: 'editor', label: '自由搭配' },
]

export default function OutfitsPage() {
  const [activeSection, setActiveSection] = useState<Section>('list')

  const handleCreateCustom = useCallback(() => setActiveSection('editor'), [])
  const handleEditorDone = useCallback(() => setActiveSection('list'), [])

  return (
    <div className="flex flex-col gap-4 px-4 pb-6 pt-4">
      {/* Section tabs */}
      <div role="tablist" aria-label="搭配管理" className="flex rounded-[var(--radius-md)] bg-[var(--color-surface-alt)] p-0.5">
        {SECTIONS.map((section) => (
          <button
            key={section.key}
            role="tab"
            aria-selected={activeSection === section.key}
            onClick={() => setActiveSection(section.key)}
            tabIndex={activeSection === section.key ? 0 : -1}
            className={`flex-1 rounded-[calc(var(--radius-md)-1px)] py-2 text-center text-sm font-medium transition-colors ${
              activeSection === section.key
                ? 'bg-[var(--color-surface)] text-[var(--color-accent)] shadow-sm'
                : 'text-[var(--color-text-secondary)]'
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* Content — keep-alive: hide instead of unmount to avoid redundant fetches */}
      <div role="tabpanel" aria-label={SECTIONS.find((s) => s.key === activeSection)?.label}>
        <div style={{ display: activeSection === 'list' ? undefined : 'none' }}>
          <OutfitList onCreateCustom={handleCreateCustom} />
        </div>
        <div style={{ display: activeSection === 'calendar' ? undefined : 'none' }}>
          <OutfitCalendar />
        </div>
        <div style={{ display: activeSection === 'editor' ? undefined : 'none' }}>
          <OutfitEditor onDone={handleEditorDone} />
        </div>
      </div>
    </div>
  )
}
