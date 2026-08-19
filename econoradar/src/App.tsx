import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { NewsPage } from './pages/NewsPage'
import { ForecastsPage } from './pages/ForecastsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<NewsPage />} />
          <Route path="/proyecciones" element={<ForecastsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
