import type { Forecast } from '../types'
import { averageConfidence, dominantScenario } from '../lib/forecastStats'

export function ConsensusBadge({ forecast }: { forecast: Forecast }) {
  const avg = averageConfidence(forecast)
  const top = dominantScenario(forecast)
  const pct = Math.round(top.probability * 100)

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg border border-ink-700 bg-ink-800/40 px-3.5 py-2 text-xs">
      <div className="flex items-center gap-1.5">
        <span className="text-gray-500">Confianza promedio</span>
        <div className="flex items-center gap-0.5" title={`${avg.toFixed(1)}/5`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-3 rounded-full ${i < Math.round(avg) ? 'bg-signal-400' : 'bg-ink-600'}`}
            />
          ))}
        </div>
      </div>
      <span className="text-ink-600">|</span>
      <div className="flex items-center gap-1.5">
        <span className="text-gray-500">Escenario más probable</span>
        <span className="font-medium text-gray-300">
          {top.label} <span className="text-signal-400">({pct}%)</span>
        </span>
      </div>
    </div>
  )
}
