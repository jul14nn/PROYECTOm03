import type { Forecast } from '../types'

export function averageConfidence(forecast: Forecast): number {
  const sum = forecast.expertOpinions.reduce((acc, op) => acc + op.confidence, 0)
  return sum / forecast.expertOpinions.length
}

export function dominantScenario(forecast: Forecast) {
  return [...forecast.scenarios].sort((a, b) => b.probability - a.probability)[0]
}
