import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { forecasts } from '../data/forecasts'
import { ForecastPanel } from '../components/ForecastPanel'

export function ForecastsPage() {
  const location = useLocation()

  useEffect(() => {
    const id = location.hash.replace('#', '')
    if (!id) return
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [location.hash])

  const sorted = [...forecasts].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-100 sm:text-3xl">Proyecciones económicas</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-400">
          Para cada situación relevante combinamos tres capas: la lectura de la noticia, un análisis automatizado de
          señales y la interpretación de analistas profesionales sobre los eventos que podrían seguir.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {sorted.map((forecast) => (
          <ForecastPanel key={forecast.id} forecast={forecast} />
        ))}
      </div>
    </div>
  )
}
