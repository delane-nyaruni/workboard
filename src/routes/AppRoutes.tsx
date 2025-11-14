import TaskForm from '@/components/TaskForm'
import About from '@/pages/About'
import Home from '@/pages/Home'
import { Routes, Route } from 'react-router-dom'

export function AppRoutes() {
  return (

    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/task" element={<TaskForm />} />
    </Routes>
  )
}
