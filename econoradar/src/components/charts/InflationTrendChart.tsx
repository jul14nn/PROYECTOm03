import { useMemo, useState } from 'react'
import { inflationTrend } from '../../data/trends'

const WIDTH = 640
const HEIGHT = 240
const PAD_LEFT = 34
const PAD_RIGHT = 16
const PAD_TOP = 16
const PAD_BOTTOM = 28

const HEADLINE_COLOR = 'var(--color-signal-400)'
const CORE_COLOR = 'var(--color-trend-500)'

function monthLabel(month: string) {
  const [, m] = month.split('-')
  const names = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return names[Number(m) - 1]
}

export function InflationTrendChart() {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const { points, yScale, minY, maxY } = useMemo(() => {
    const values = inflationTrend.flatMap((d) => [d.headline, d.core])
    const minY = Math.floor(Math.min(...values) - 0.3)
    const maxY = Math.ceil(Math.max(...values) + 0.3)
    const innerW = WIDTH - PAD_LEFT - PAD_RIGHT
    const innerH = HEIGHT - PAD_TOP - PAD_BOTTOM
    const xStep = innerW / (inflationTrend.length - 1)
    const yScale = (v: number) => PAD_TOP + innerH - ((v - minY) / (maxY - minY)) * innerH

    const points = inflationTrend.map((d, i) => ({
      x: PAD_LEFT + i * xStep,
      yHeadline: yScale(d.headline),
      yCore: yScale(d.core),
      data: d,
    }))

    return { points, yScale, minY, maxY }
  }, [])

  const headlinePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yHeadline}`).join(' ')
  const corePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yCore}`).join(' ')

  const gridValues = useMemo(() => {
    const steps = 4
    return Array.from({ length: steps + 1 }, (_, i) => minY + ((maxY - minY) / steps) * i)
  }, [minY, maxY])

  const hovered = hoverIndex !== null ? points[hoverIndex] : null

  return (
    <div className="rounded-xl border border-ink-700 bg-ink-900 p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-left text-sm font-semibold text-gray-100">Inflación: general vs. subyacente</h3>
          <p className="text-left text-xs text-gray-500">Variación interanual, últimos 12 meses</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-gray-400">
            <span className="h-2 w-2 rounded-full" style={{ background: HEADLINE_COLOR }} />
            General
          </span>
          <span className="flex items-center gap-1.5 text-gray-400">
            <span className="h-2 w-2 rounded-full" style={{ background: CORE_COLOR }} />
            Subyacente
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label="Gráfico de líneas: inflación general y subyacente en los últimos 12 meses"
        onMouseLeave={() => setHoverIndex(null)}
      >
        {gridValues.map((v, i) => (
          <g key={i}>
            <line
              x1={PAD_LEFT}
              x2={WIDTH - PAD_RIGHT}
              y1={yScale(v)}
              y2={yScale(v)}
              stroke="var(--color-ink-700)"
              strokeWidth={1}
            />
            <text x={PAD_LEFT - 8} y={yScale(v) + 3} textAnchor="end" fontSize="10" fill="#6b7280">
              {v.toFixed(1)}%
            </text>
          </g>
        ))}

        {points.map(
          (p, i) =>
            i % 2 === 0 && (
              <text
                key={i}
                x={p.x}
                y={HEIGHT - PAD_BOTTOM + 16}
                textAnchor="middle"
                fontSize="10"
                fill="#6b7280"
              >
                {monthLabel(p.data.month)}
              </text>
            ),
        )}

        <path d={corePath} fill="none" stroke={CORE_COLOR} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <path
          d={headlinePath}
          fill="none"
          stroke={HEADLINE_COLOR}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {(() => {
          const last = points[points.length - 1]
          return (
            <>
              <circle cx={last.x} cy={last.yCore} r={4} fill={CORE_COLOR} stroke="var(--color-ink-900)" strokeWidth={2} />
              <circle
                cx={last.x}
                cy={last.yHeadline}
                r={4}
                fill={HEADLINE_COLOR}
                stroke="var(--color-ink-900)"
                strokeWidth={2}
              />
              <text x={last.x} y={last.yCore - 8} textAnchor="end" fontSize="11" fontWeight={600} fill={CORE_COLOR}>
                {last.data.core.toFixed(1)}%
              </text>
              <text
                x={last.x}
                y={last.yHeadline + 15}
                textAnchor="end"
                fontSize="11"
                fontWeight={600}
                fill={HEADLINE_COLOR}
              >
                {last.data.headline.toFixed(1)}%
              </text>
            </>
          )
        })()}

        {hovered && (
          <>
            <line
              x1={hovered.x}
              x2={hovered.x}
              y1={PAD_TOP}
              y2={HEIGHT - PAD_BOTTOM}
              stroke="var(--color-ink-600)"
              strokeWidth={1}
            />
            <circle cx={hovered.x} cy={hovered.yHeadline} r={4} fill={HEADLINE_COLOR} stroke="var(--color-ink-900)" strokeWidth={2} />
            <circle cx={hovered.x} cy={hovered.yCore} r={4} fill={CORE_COLOR} stroke="var(--color-ink-900)" strokeWidth={2} />
          </>
        )}

        {points.map((p, i) => (
          <rect
            key={i}
            x={p.x - (WIDTH - PAD_LEFT - PAD_RIGHT) / (points.length - 1) / 2}
            y={PAD_TOP}
            width={(WIDTH - PAD_LEFT - PAD_RIGHT) / (points.length - 1)}
            height={HEIGHT - PAD_TOP - PAD_BOTTOM}
            fill="transparent"
            onMouseEnter={() => setHoverIndex(i)}
          />
        ))}
      </svg>

      {hovered && (
        <div className="mt-1 flex items-center justify-between rounded-lg bg-ink-800/60 px-3 py-2 text-xs">
          <span className="font-medium text-gray-300">{hovered.data.month}</span>
          <span className="flex gap-4">
            <span style={{ color: HEADLINE_COLOR }}>General {hovered.data.headline.toFixed(1)}%</span>
            <span style={{ color: CORE_COLOR }}>Subyacente {hovered.data.core.toFixed(1)}%</span>
          </span>
        </div>
      )}
    </div>
  )
}
