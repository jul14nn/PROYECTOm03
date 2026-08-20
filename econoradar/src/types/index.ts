export type Category =
  | 'mercados'
  | 'inflacion'
  | 'politica-monetaria'
  | 'empleo'
  | 'comercio'
  | 'energia'
  | 'tecnologia'
  | 'fiscal'
  | 'cripto'
  | 'vivienda'

export type Sentiment = 'positivo' | 'negativo' | 'neutral'

export type Horizon = 'corto' | 'medio' | 'largo'

export interface NewsArticle {
  id: string
  title: string
  summary: string
  source: string
  publishedAt: string
  category: Category
  region: string
  sentiment: Sentiment
  tags: string[]
  forecastId?: string
}

export interface Analyst {
  id: string
  name: string
  role: string
  institution: string
  initials: string
  specialty: Category[]
  bio: string
  accuracyScore: number
}

export interface Scenario {
  id: string
  label: string
  probability: number
  horizon: Horizon
  description: string
  impacts: string[]
}

export interface ExpertOpinion {
  analystId: string
  opinion: string
  confidence: 1 | 2 | 3 | 4 | 5
  horizon: Horizon
  predictedEvents: string[]
  publishedAt: string
}

export interface AutoAnalysis {
  summary: string
  signals: string[]
  generatedAt: string
}

export interface Forecast {
  id: string
  title: string
  category: Category
  situation: string
  relatedNewsIds: string[]
  autoAnalysis: AutoAnalysis
  expertOpinions: ExpertOpinion[]
  scenarios: Scenario[]
  updatedAt: string
}

export const CATEGORY_LABELS: Record<Category, string> = {
  mercados: 'Mercados',
  inflacion: 'Inflación',
  'politica-monetaria': 'Política Monetaria',
  empleo: 'Empleo',
  comercio: 'Comercio Internacional',
  energia: 'Energía',
  tecnologia: 'Tecnología',
  fiscal: 'Política Fiscal',
  cripto: 'Criptomonedas',
  vivienda: 'Vivienda',
}

export const HORIZON_LABELS: Record<Horizon, string> = {
  corto: 'Corto plazo (0–3 meses)',
  medio: 'Medio plazo (3–12 meses)',
  largo: 'Largo plazo (+1 año)',
}
