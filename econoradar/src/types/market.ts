export type MarketGroup = 'indices' | 'divisas' | 'commodities' | 'tasas'

export interface MarketQuote {
  id: string
  symbol: string
  name: string
  group: MarketGroup
  value: string
  change: number
}
