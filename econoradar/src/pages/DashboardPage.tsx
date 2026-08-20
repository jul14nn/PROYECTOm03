import { Link } from 'react-router-dom'
import { news } from '../data/news'
import { forecasts } from '../data/forecasts'
import { analysts } from '../data/analysts'
import { CATEGORY_LABELS } from '../types'
import { Badge } from '../components/Badge'
import { ConsensusBadge } from '../components/ConsensusBadge'
import { NewsCard } from '../components/NewsCard'
import { InflationTrendChart } from '../components/charts/InflationTrendChart'
import { CategoryBarChart } from '../components/charts/CategoryBarChart'

function StatTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-ink-700 bg-ink-900 p-4 text-left">
      <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-100">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{hint}</p>
    </div>
  )
}

export function DashboardPage() {
  const latestNews = [...news].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1)).slice(0, 4)
  const topForecasts = [...forecasts].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)).slice(0, 3)

  return (
    <div>
      <section className="mb-10 rounded-2xl border border-ink-700 bg-gradient-to-br from-ink-900 to-ink-950 p-6 sm:p-8">
        <Badge tone="signal">Panorama en vivo</Badge>
        <h1 className="mt-3 max-w-2xl text-left text-2xl font-semibold text-gray-100 sm:text-3xl">
          Qué está pasando en la economía y hacia dónde podría ir
        </h1>
        <p className="mt-3 max-w-2xl text-left text-sm leading-relaxed text-gray-400">
          EconoRadar sigue las noticias económicas relevantes del día y las convierte en proyecciones: qué señales
          detecta el análisis automatizado y qué eventos futuros anticipan los analistas profesionales que las
          interpretan.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            to="/noticias"
            className="rounded-lg bg-signal-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-signal-400"
          >
            Ver noticias
          </Link>
          <Link
            to="/proyecciones"
            className="rounded-lg border border-ink-600 px-4 py-2 text-sm font-medium text-gray-200 transition hover:border-ink-500"
          >
            Ver proyecciones
          </Link>
        </div>
      </section>

      <div className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile
          label="Noticias activas"
          value={String(news.length)}
          hint={`Cubriendo ${Object.keys(CATEGORY_LABELS).length} categorías económicas`}
        />
        <StatTile
          label="Proyecciones abiertas"
          value={String(forecasts.length)}
          hint="Con análisis automatizado + lectura experta"
        />
        <StatTile
          label="Analistas contribuyendo"
          value={String(analysts.length)}
          hint="Especializados en distintas áreas"
        />
      </div>

      <section className="mb-10">
        <h2 className="mb-4 text-left text-lg font-semibold text-gray-100">Tendencias</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <InflationTrendChart />
          <CategoryBarChart />
        </div>
      </section>

      <section className="mb-10">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-left text-lg font-semibold text-gray-100">Últimas noticias</h2>
          <Link to="/noticias" className="text-sm text-signal-400 hover:text-signal-300">
            Ver todas →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {latestNews.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-left text-lg font-semibold text-gray-100">Proyecciones destacadas</h2>
          <Link to="/proyecciones" className="text-sm text-signal-400 hover:text-signal-300">
            Ver todas →
          </Link>
        </div>
        <div className="flex flex-col gap-3">
          {topForecasts.map((forecast) => (
            <Link
              key={forecast.id}
              to={`/proyecciones#${forecast.id}`}
              className="rounded-xl border border-ink-700 bg-ink-900 p-4 text-left transition hover:border-ink-600 sm:p-5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="signal">{CATEGORY_LABELS[forecast.category]}</Badge>
              </div>
              <h3 className="mt-2 text-base font-semibold text-gray-100">{forecast.title}</h3>
              <p className="mt-1.5 line-clamp-2 text-sm text-gray-400">{forecast.situation}</p>
              <div className="mt-3">
                <ConsensusBadge forecast={forecast} />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
