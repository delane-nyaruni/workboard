import { useQuery } from '@tanstack/react-query'
import { listTasks } from './api/client'
import { TaskTable } from './components/TaskTable'
import { useState } from 'react'

export default function App() {
  
  const [search, setSearch] = useState('')
  const { data, isLoading, isError } = useQuery({ queryKey: ['tasks'], queryFn: listTasks })

  if (isLoading) return <p style={{ padding: 16 }}>Loading tasks…</p>
  if (isError) return <p style={{ padding: 16 }}>Could not load tasks.</p>

  const filtered = (data ?? []).filter(t => t.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 16 }}>
      <header style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Mini Workboard</h1>
        <input
          aria-label="Search tasks"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, padding: 8 }}
        />
      </header>
      <TaskTable tasks={filtered} />
      <p style={{ marginTop: 24, color: '#666' }}>
        This is a minimal starter. Add routes, forms, optimistic updates, validation, and tests per the brief.
      </p>
    </div>
  )
}
