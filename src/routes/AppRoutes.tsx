import About from '@/pages/About'
import Dashboard from '@/pages/Dashboard'
import { Routes, Route } from 'react-router-dom'

export function AppRoutes() {
  return (

    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/about" element={<About />} />
    </Routes>
  )
}
