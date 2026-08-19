import type { NewsArticle } from '../types'
import { CATEGORY_LABELS } from '../types'
import { Badge } from './Badge'

const sentimentTone = {
  positivo: 'rise',
  negativo: 'fall',
  neutral: 'neutral',
} as const

const sentimentLabel = {
  positivo: 'Impacto positivo',
  negativo: 'Impacto negativo',
  neutral: 'Impacto mixto',
} as const

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
  })
}

export function NewsCard({
  article,
  onViewForecast,
}: {
  article: NewsArticle
  onViewForecast?: (forecastId: string) => void
}) {
  return (
    <article className="group flex flex-col gap-3 rounded-xl border border-ink-700 bg-ink-900 p-5 transition hover:border-ink-600">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="signal">{CATEGORY_LABELS[article.category]}</Badge>
        <Badge tone={sentimentTone[article.sentiment]}>{sentimentLabel[article.sentiment]}</Badge>
        <span className="ml-auto text-xs text-gray-500">{formatDate(article.publishedAt)}</span>
      </div>

      <h3 className="text-left text-lg leading-snug font-semibold text-gray-100">{article.title}</h3>
      <p className="text-left text-sm leading-relaxed text-gray-400">{article.summary}</p>

      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
        <span className="font-medium text-gray-400">{article.source}</span>
        <span>·</span>
        <span>{article.region}</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {article.tags.map((tag) => (
          <span key={tag} className="rounded-md bg-ink-800 px-2 py-0.5 text-[11px] text-gray-500">
            #{tag}
          </span>
        ))}
      </div>

      {article.forecastId && onViewForecast && (
        <button
          onClick={() => onViewForecast(article.forecastId!)}
          className="mt-1 flex items-center gap-1.5 self-start rounded-lg border border-signal-500/30 bg-signal-500/10 px-3 py-1.5 text-xs font-medium text-signal-400 transition hover:bg-signal-500/20"
        >
          Ver proyección de futuro
          <span aria-hidden>→</span>
        </button>
      )}
    </article>
  )
}
