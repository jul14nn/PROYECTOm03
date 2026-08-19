import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { news } from '../data/news'
import { CATEGORY_LABELS, type Category } from '../types'
import { NewsCard } from '../components/NewsCard'

const categories = Object.keys(CATEGORY_LABELS) as Category[]

export function NewsPage() {
  const [activeCategory, setActiveCategory] = useState<Category | 'todas'>('todas')
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    const sorted = [...news].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
    if (activeCategory === 'todas') return sorted
    return sorted.filter((n) => n.category === activeCategory)
  }, [activeCategory])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-100 sm:text-3xl">Noticias económicas relevantes</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-400">
          Un resumen curado de lo que está moviendo la economía global hoy. Cada noticia con proyección incluye un
          análisis de hacia dónde podría derivar la situación.
        </p>
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
        <p className="mt-10 text-center text-sm text-gray-500">No hay noticias en esta categoría por ahora.</p>
      )}
    </div>
  )
}
