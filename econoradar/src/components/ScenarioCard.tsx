import type { Scenario } from '../types'
import { HORIZON_LABELS } from '../types'
import { Badge } from './Badge'

export function ScenarioCard({ scenario }: { scenario: Scenario }) {
  const pct = Math.round(scenario.probability * 100)

  return (
    <div className="rounded-lg border border-ink-700 bg-ink-900 p-4 text-left">
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-sm font-semibold text-gray-100">{scenario.label}</h4>
        <span className="shrink-0 text-sm font-semibold text-signal-400">{pct}%</span>
      </div>

      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink-700">
        <div className="h-full rounded-full bg-signal-500" style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-2.5">
        <Badge tone="neutral">{HORIZON_LABELS[scenario.horizon]}</Badge>
      </div>

      <p className="mt-2.5 text-sm leading-relaxed text-gray-400">{scenario.description}</p>

      <ul className="mt-2.5 space-y-1">
        {scenario.impacts.map((impact, i) => (
          <li key={i} className="flex gap-2 text-xs text-gray-500">
            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-gray-600" />
            {impact}
          </li>
        ))}
      </ul>
    </div>
  )
}
