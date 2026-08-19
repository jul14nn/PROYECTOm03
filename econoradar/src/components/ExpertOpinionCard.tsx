import type { ExpertOpinion } from '../types'
import { HORIZON_LABELS } from '../types'
import { getAnalyst } from '../data/analysts'
import { Badge } from './Badge'

export function ExpertOpinionCard({ opinion }: { opinion: ExpertOpinion }) {
  const analyst = getAnalyst(opinion.analystId)
  if (!analyst) return null

  return (
    <div className="rounded-lg border border-ink-700 bg-ink-800/60 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-signal-500/15 text-xs font-semibold text-signal-400">
          {analyst.initials}
        </div>
        <div className="min-w-0 flex-1 text-left">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-sm font-semibold text-gray-100">{analyst.name}</span>
            <span className="text-xs text-gray-500">
              {analyst.role} · {analyst.institution}
            </span>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-0.5" title={`Confianza: ${opinion.confidence}/5`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-3 rounded-full ${
                    i < opinion.confidence ? 'bg-signal-400' : 'bg-ink-600'
                  }`}
                />
              ))}
            </div>
            <Badge tone="neutral">{HORIZON_LABELS[opinion.horizon]}</Badge>
          </div>

          <p className="mt-2.5 text-sm leading-relaxed text-gray-300">“{opinion.opinion}”</p>

          <div className="mt-3">
            <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">Eventos que anticipa</p>
            <ul className="mt-1.5 space-y-1">
              {opinion.predictedEvents.map((event, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-400">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gray-600" />
                  {event}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
