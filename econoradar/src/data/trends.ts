export interface InflationPoint {
  month: string
  headline: number
  core: number
}

export const inflationTrend: InflationPoint[] = [
  { month: '2025-09', headline: 4.1, core: 4.4 },
  { month: '2025-10', headline: 3.9, core: 4.3 },
  { month: '2025-11', headline: 3.8, core: 4.2 },
  { month: '2025-12', headline: 3.6, core: 4.1 },
  { month: '2026-01', headline: 3.5, core: 4.0 },
  { month: '2026-02', headline: 3.4, core: 3.9 },
  { month: '2026-03', headline: 3.3, core: 3.8 },
  { month: '2026-04', headline: 3.2, core: 3.7 },
  { month: '2026-05', headline: 3.1, core: 3.6 },
  { month: '2026-06', headline: 3.0, core: 3.5 },
  { month: '2026-07', headline: 3.0, core: 3.4 },
  { month: '2026-08', headline: 2.9, core: 3.3 },
]
