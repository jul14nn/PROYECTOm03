import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { news } from '../data/news'
import { CATEGORY_LABELS, type Category } from '../types'
import { NewsCard } from '../components/NewsCard'

const categories = Object.keys(CATEGORY_LABELS) as Category[]

export function NewsPage() {
  const [activeCategory, setActiveCategory] = useState<Category | 'todas'>('todas')
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    const sorted = [...news].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
    const byCategory =
      activeCategory === 'todas' ? sorted : sorted.filter((n) => n.category === activeCategory)

    const q = query.trim().toLowerCase()
    if (!q) return byCategory

    return byCategory.filter((n) =>
      [n.title, n.summary, n.source, n.region, ...n.tags].some((field) =>
        field.toLowerCase().includes(q),
      ),
    )
  }, [activeCategory, query])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-100 sm:text-3xl">Noticias económicas relevantes</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-400">
          Un resumen curado de lo que está moviendo la economía global hoy. Cada noticia con proyección incluye un
          análisis de hacia dónde podría derivar la situación.
        </p>
      </div>

      <div className="mb-4">
        <div className="relative max-w-md">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-500"
          >
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por título, fuente, región o etiqueta…"
            className="w-full rounded-lg border border-ink-700 bg-ink-900 py-2 pr-3 pl-9 text-sm text-gray-200 placeholder:text-gray-600 focus:border-signal-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory('todas')}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
            activeCategory === 'todas'
              ? 'bg-signal-500 text-white'
              : 'bg-ink-800 text-gray-400 hover:text-gray-200'
          }`}
        >
          Todas
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              activeCategory === cat
                ? 'bg-signal-500 text-white'
                : 'bg-ink-800 text-gray-400 hover:text-gray-200'
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      <p className="mb-4 text-xs text-gray-500">
        {filtered.length} {filtered.length === 1 ? 'noticia encontrada' : 'noticias encontradas'}
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.map((article) => (
          <NewsCard
            key={article.id}
            article={article}
            onViewForecast={(forecastId) => navigate(`/proyecciones#${forecastId}`)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-10 text-center text-sm text-gray-500">No se encontraron noticias con esos criterios.</p>
      )}
    </div>
  )
}
