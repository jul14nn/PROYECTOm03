import { NavLink, Outlet } from 'react-router-dom'

const navItemBase =
  'rounded-lg px-3.5 py-2 text-sm font-medium transition whitespace-nowrap'

export function Layout() {
  return (
    <div className="min-h-screen bg-ink-950">
      <header className="sticky top-0 z-10 border-b border-ink-700 bg-ink-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-signal-500/15 text-signal-400">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path
                  d="M3 17l5-5 4 4 8-8M20 8v6M20 8h-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-base font-semibold tracking-tight text-gray-100">EconoRadar</span>
          </div>

          <nav className="flex items-center gap-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `${navItemBase} ${isActive ? 'bg-ink-800 text-gray-100' : 'text-gray-400 hover:text-gray-200'}`
              }
            >
              Noticias
            </NavLink>
            <NavLink
              to="/proyecciones"
              className={({ isActive }) =>
                `${navItemBase} ${isActive ? 'bg-ink-800 text-gray-100' : 'text-gray-400 hover:text-gray-200'}`
              }
            >
              Proyecciones
            </NavLink>
          </nav>

          <span className="ml-auto hidden text-xs text-gray-500 sm:block">
            Noticias económicas + análisis de futuro
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>

      <footer className="border-t border-ink-700 py-6 text-center text-xs text-gray-600">
        EconoRadar combina noticias, análisis automatizado y la lectura de analistas profesionales. Los pronósticos
        son estimaciones y no constituyen asesoramiento financiero.
      </footer>
    </div>
  )
}
