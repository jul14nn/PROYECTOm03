import type { MarketQuote } from '../types/market'

export const marketQuotes: MarketQuote[] = [
  { id: 'sp500', symbol: 'S&P 500', name: 'S&P 500', group: 'indices', value: '5,842.10', change: 0.42 },
  { id: 'nasdaq', symbol: 'NASDAQ', name: 'Nasdaq Composite', group: 'indices', value: '18,930.55', change: -0.18 },
  { id: 'stoxx', symbol: 'STOXX 600', name: 'Euro Stoxx 600', group: 'indices', value: '512.30', change: 0.65 },
  { id: 'ibex', symbol: 'IBEX 35', name: 'IBEX 35', group: 'indices', value: '11,204.80', change: 0.29 },
  { id: 'eurusd', symbol: 'EUR/USD', name: 'Euro / Dólar', group: 'divisas', value: '1.0862', change: -0.12 },
  { id: 'usdmxn', symbol: 'USD/MXN', name: 'Dólar / Peso mexicano', group: 'divisas', value: '18.42', change: 0.34 },
  { id: 'usdbrl', symbol: 'USD/BRL', name: 'Dólar / Real brasileño', group: 'divisas', value: '5.31', change: 0.51 },
  { id: 'wti', symbol: 'WTI', name: 'Petróleo WTI', group: 'commodities', value: '$84.20', change: 2.1 },
  { id: 'gold', symbol: 'ORO', name: 'Oro (onza)', group: 'commodities', value: '$2,478.60', change: 0.27 },
  { id: 'copper', symbol: 'COBRE', name: 'Cobre', group: 'commodities', value: '$4.32', change: -0.44 },
  { id: 'fed', symbol: 'FED', name: 'Tasa Fed (EE. UU.)', group: 'tasas', value: '5.25% – 5.50%', change: 0 },
  { id: 'bce', symbol: 'BCE', name: 'Tasa BCE (Zona Euro)', group: 'tasas', value: '3.75%', change: 0 },
  { id: 'us10y', symbol: 'UST 10Y', name: 'Bono EE. UU. 10 años', group: 'tasas', value: '4.18%', change: -0.03 },
]
