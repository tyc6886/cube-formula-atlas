import { Navigate, Route, Routes } from 'react-router'
import Layout from './components/Layout'
import { useLearning } from './hooks/useLearning'
import Home from './pages/Home'
import Catalog from './pages/Catalog'
import CaseDetail from './pages/CaseDetail'
import Favorites from './pages/Favorites'
import Progress from './pages/Progress'
import SearchResults from './pages/SearchResults'
import Guide from './pages/Guide'
import './App.css'

export default function App() {
  const learning = useLearning()
  return <Routes>
    <Route element={<Layout learning={learning} />}>
      <Route path="/" element={<Home />} />
      <Route path="/category/:categoryId" element={<Catalog />} />
      <Route path="/category/:categoryId/case/:variantId" element={<CaseDetail />} />
      <Route path="/favorites" element={<Favorites />} />
      <Route path="/progress" element={<Progress />} />
      <Route path="/search" element={<SearchResults />} />
      <Route path="/guide" element={<Guide />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes>
}
