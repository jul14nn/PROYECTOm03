import { useMemo } from 'react'
import { news } from '../../data/news'
import { CATEGORY_LABELS, type Category } from '../../types'

export function CategoryBarChart() {
  const counts = useMemo(() => {
    const map = new Map<Category, number>()
    for (const article of news) {
      map.set(article.category, (map.get(article.category) ?? 0) + 1)
    }
    return (Object.keys(CATEGORY_LABELS) as Category[])
      .map((cat) => ({ category: cat, count: map.get(cat) ?? 0 }))
      .filter((row) => row.count > 0)
      .sort((a, b) => b.count - a.count)
  }, [])

  const max = Math.max(...counts.map((c) => c.count))

  return (
    <div className="rounded-xl border border-ink-700 bg-ink-900 p-4 sm:p-5">
      <h3 className="text-left text-sm font-semibold text-gray-100">Cobertura de noticias por categoría</h3>
      <p className="mb-4 text-left text-xs text-gray-500">Número de noticias activas por tema</p>

      <div className="flex flex-col gap-2.5">
        {counts.map((row) => (
          <div key={row.category} className="flex items-center gap-3">
            <span className="w-32 shrink-0 text-left text-xs text-gray-400 sm:w-36">
              {CATEGORY_LABELS[row.category]}
            </span>
            <div className="flex h-4 flex-1 items-center">
              <div
                className="h-4 rounded-r bg-signal-500"
                style={{ width: `${Math.max((row.count / max) * 100, 6)}%` }}
              />
              <span className="ml-2 text-xs font-medium text-gray-300">{row.count}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
