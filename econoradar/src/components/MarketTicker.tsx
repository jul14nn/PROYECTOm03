import { marketQuotes } from '../data/market'
import type { MarketQuote } from '../types/market'

function QuoteItem({ quote }: { quote: MarketQuote }) {
  const isUp = quote.change > 0
  const isDown = quote.change < 0
  const color = isUp ? 'text-rise-400' : isDown ? 'text-fall-400' : 'text-gray-500'
  const arrow = isUp ? '▲' : isDown ? '▼' : '·'

  return (
    <div className="flex shrink-0 items-center gap-2 px-4 py-2 text-xs">
      <span className="font-semibold text-gray-300">{quote.symbol}</span>
      <span className="text-gray-500">{quote.value}</span>
      <span className={`font-medium ${color}`}>
        {arrow} {quote.change === 0 ? 'sin cambios' : `${Math.abs(quote.change).toFixed(2)}%`}
      </span>
    </div>
  )
}

export function MarketTicker() {
  const doubled = [...marketQuotes, ...marketQuotes]

  return (
    <div className="overflow-hidden border-b border-ink-700 bg-ink-900">
      <div className="flex w-max animate-ticker">
        {doubled.map((quote, i) => (
          <QuoteItem key={`${quote.id}-${i}`} quote={quote} />
        ))}
      </div>
    </div>
  )
}
