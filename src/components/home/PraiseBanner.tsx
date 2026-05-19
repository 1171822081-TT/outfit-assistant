import type { Personality } from '@/lib/types'

interface PraiseBannerProps {
  text: string | null
  personality: Personality | null
}

const PERSONALITY_GRADIENT: Record<Personality, string> = {
  outgoing: 'from-amber-500/10 to-orange-500/5',
  introverted: 'from-slate-400/10 to-zinc-400/5',
  confident: 'from-rose-500/10 to-red-500/5',
  gentle: 'from-sky-400/10 to-blue-400/5',
}

const PERSONALITY_ACCENT: Record<Personality, string> = {
  outgoing: 'text-amber-600',
  introverted: 'text-slate-500',
  confident: 'text-rose-600',
  gentle: 'text-sky-600',
}

export default function PraiseBanner({ text, personality }: PraiseBannerProps) {
  if (!text) return null

  const gradient = personality ? PERSONALITY_GRADIENT[personality] : PERSONALITY_GRADIENT.gentle
  const accent = personality ? PERSONALITY_ACCENT[personality] : PERSONALITY_ACCENT.gentle

  return (
    <div className={`rounded-[var(--radius-md)] bg-gradient-to-r ${gradient} px-4 py-3`}>
      <p className={`text-sm leading-relaxed ${accent}`}>
        <span className="mr-1.5" aria-hidden="true">✨</span>
        {text}
      </p>
    </div>
  )
}
