import type { Category, NewsArticle, Sentiment } from '../types'

interface RawArticle {
  title: string | null
  description: string | null
  url: string
  source: { name: string | null }
  publishedAt: string
  content?: string | null
}

interface NewsApiResponse {
  status: 'ok' | 'error'
  articles?: RawArticle[]
  message?: string
}

const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  inflacion: ['inflación', 'precios al consumidor', 'ipc', 'cpi'],
  'politica-monetaria': ['banco central', 'tasas de interés', 'fed', 'bce', 'tipos de interés'],
  empleo: ['empleo', 'desempleo', 'nómina', 'salarios', 'mercado laboral'],
  comercio: ['aranceles', 'comercio', 'exportaciones', 'importaciones', 'cadena de suministro'],
  energia: ['petróleo', 'opep', 'gas natural', 'energía', 'crudo'],
  tecnologia: ['inteligencia artificial', 'tecnología', 'semiconductores', 'ia'],
  fiscal: ['gasto público', 'déficit fiscal', 'impuestos', 'presupuesto'],
  cripto: ['bitcoin', 'criptomoneda', 'cripto', 'stablecoin', 'ethereum'],
  vivienda: ['vivienda', 'hipoteca', 'inmobiliario', 'construcción'],
  mercados: ['bolsa', 'acciones', 'mercados', 'índice', 'wall street'],
}

function inferCategory(text: string): Category {
  const lower = text.toLowerCase()
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [Category, string[]][]) {
    if (keywords.some((kw) => lower.includes(kw))) return category
  }
  return 'mercados'
}

function inferSentiment(text: string): Sentiment {
  const lower = text.toLowerCase()
  const positive = ['crece', 'sube', 'repunta', 'mejora', 'recupera', 'impulsa']
  const negative = ['cae', 'baja', 'crisis', 'recesión', 'desploma', 'debilita', 'riesgo']
  const hasPositive = positive.some((w) => lower.includes(w))
  const hasNegative = negative.some((w) => lower.includes(w))
  if (hasPositive && !hasNegative) return 'positivo'
  if (hasNegative && !hasPositive) return 'negativo'
  return 'neutral'
}

function mapArticle(raw: RawArticle, index: number): NewsArticle | null {
  if (!raw.title || raw.title === '[Removed]') return null
  const text = `${raw.title} ${raw.description ?? ''}`
  return {
    id: `live-${index}-${raw.publishedAt}`,
    title: raw.title,
    summary: raw.description ?? 'Sin resumen disponible.',
    source: raw.source.name ?? 'Fuente desconocida',
    publishedAt: raw.publishedAt.slice(0, 10),
    category: inferCategory(text),
    region: 'Global',
    sentiment: inferSentiment(text),
    tags: [],
  }
}

/** True when a real news API key has been configured via VITE_NEWS_API_KEY. */
export function isLiveNewsConfigured(): boolean {
  return Boolean(import.meta.env.VITE_NEWS_API_KEY)
}

/**
 * Fetches live economic news from a NewsAPI.org-compatible endpoint.
 *
 * Requires VITE_NEWS_API_KEY (see .env.example). NewsAPI's free tier only
 * allows browser-side requests from localhost — in production this call
 * should go through a small backend proxy that holds the key server-side.
 * Returns null (never throws) when no key is configured or the request
 * fails, so callers can fall back to local data without extra handling.
 */
export async function fetchLiveNews(query = 'economía OR inflación OR mercados'): Promise<NewsArticle[] | null> {
  const apiKey = import.meta.env.VITE_NEWS_API_KEY
  if (!apiKey) return null

  const baseUrl = import.meta.env.VITE_NEWS_API_BASE_URL ?? 'https://newsapi.org/v2'
  const url = `${baseUrl}/everything?q=${encodeURIComponent(query)}&language=es&sortBy=publishedAt&pageSize=20&apiKey=${apiKey}`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.warn(`EconoRadar: la API de noticias respondió ${response.status}, usando datos locales.`)
      return null
    }
    const data: NewsApiResponse = await response.json()
    if (data.status !== 'ok' || !data.articles) {
      console.warn('EconoRadar: respuesta inesperada de la API de noticias, usando datos locales.', data.message)
      return null
    }
    return data.articles.map(mapArticle).filter((a): a is NewsArticle => a !== null)
  } catch (error) {
    console.warn('EconoRadar: no se pudo contactar la API de noticias, usando datos locales.', error)
    return null
  }
}
