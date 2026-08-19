import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { DashboardPage } from './pages/DashboardPage'
import { NewsPage } from './pages/NewsPage'
import { ForecastsPage } from './pages/ForecastsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/noticias" element={<NewsPage />} />
          <Route path="/proyecciones" element={<ForecastsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
