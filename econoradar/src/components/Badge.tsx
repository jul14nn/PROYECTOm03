import type { ReactNode } from 'react'

type Tone = 'neutral' | 'rise' | 'fall' | 'signal' | 'amber'

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-ink-700 text-gray-300 ring-1 ring-inset ring-ink-600',
  rise: 'bg-rise-500/10 text-rise-400 ring-1 ring-inset ring-rise-500/30',
  fall: 'bg-fall-500/10 text-fall-400 ring-1 ring-inset ring-fall-500/30',
  signal: 'bg-signal-500/10 text-signal-400 ring-1 ring-inset ring-signal-500/30',
  amber: 'bg-amber-400/10 text-amber-400 ring-1 ring-inset ring-amber-400/30',
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${toneClasses[tone]}`}
    >
      {children}
    </span>
  )
}
