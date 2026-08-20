import { useState } from 'react'
import type { Forecast } from '../types'
import { CATEGORY_LABELS } from '../types'
import { news } from '../data/news'
import { Badge } from './Badge'
import { ConsensusBadge } from './ConsensusBadge'
import { ExpertOpinionCard } from './ExpertOpinionCard'
import { ScenarioCard } from './ScenarioCard'

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function ForecastPanel({ forecast }: { forecast: Forecast }) {
  const [tab, setTab] = useState<'auto' | 'expertos' | 'escenarios'>('auto')
  const relatedNews = forecast.relatedNewsIds
    .map((id) => news.find((n) => n.id === id))
    .filter((n): n is NonNullable<typeof n> => Boolean(n))

  return (
    <section
      id={forecast.id}
      className="scroll-mt-24 rounded-2xl border border-ink-700 bg-ink-900 p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="signal">{CATEGORY_LABELS[forecast.category]}</Badge>
        <span className="text-xs text-gray-500">Actualizado el {formatDate(forecast.updatedAt)}</span>
      </div>

      <h2 className="mt-2 text-left text-xl font-semibold text-gray-100 sm:text-2xl">{forecast.title}</h2>

      <div className="mt-3">
        <ConsensusBadge forecast={forecast} />
      </div>

      <div className="mt-3 rounded-lg bg-ink-800/60 p-4 text-left">
        <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">Qué está pasando</p>
        <p className="mt-1.5 text-sm leading-relaxed text-gray-300">{forecast.situation}</p>

        {relatedNews.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {relatedNews.map((n) => (
              <span
                key={n.id}
                className="rounded-md border border-ink-600 bg-ink-900 px-2.5 py-1 text-[11px] text-gray-500"
              >
                {n.source}: {n.title}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 flex gap-1 border-b border-ink-700">
        {[
          { id: 'auto' as const, label: 'Análisis automatizado' },
          { id: 'expertos' as const, label: `Lectura de analistas (${forecast.expertOpinions.length})` },
          { id: 'escenarios' as const, label: 'Escenarios futuros' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-3 py-2.5 text-sm font-medium transition ${
              tab === t.id
                ? 'border-signal-500 text-gray-100'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === 'auto' && (
          <div className="rounded-lg border border-ink-700 bg-ink-800/40 p-4 text-left">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-400/10 text-amber-400">
                <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                  <path
                    d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="text-xs font-medium tracking-wide text-amber-400 uppercase">
                Generado automáticamente a partir de la señal de noticias
              </span>
            </div>
            <p className="text-sm leading-relaxed text-gray-300">{forecast.autoAnalysis.summary}</p>
            <ul className="mt-3 space-y-1.5">
              {forecast.autoAnalysis.signals.map((signal, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-400">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-400/70" />
                  {signal}
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === 'expertos' && (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {forecast.expertOpinions.map((op) => (
              <ExpertOpinionCard key={op.analystId} opinion={op} />
            ))}
          </div>
        )}

        {tab === 'escenarios' && (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {[...forecast.scenarios]
              .sort((a, b) => b.probability - a.probability)
              .map((s) => (
                <ScenarioCard key={s.id} scenario={s} />
              ))}
          </div>
        )}
      </div>
    </section>
  )
}
