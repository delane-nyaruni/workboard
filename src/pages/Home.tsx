import { useQuery } from '@tanstack/react-query'
import { listTasks } from '@/api/client'
import { TaskTable } from '@/components/TaskTable'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import "@/main.css"

export default function Home() {
  const [search] = useState('')
  const navigate = useNavigate()
  const { data, isLoading, isError } = useQuery({ queryKey: ['tasks'], queryFn: listTasks })

  if (isLoading) return <p style={{ padding: 16 }}>Loading tasks…</p>
  if (isError) return <p style={{ padding: 16 }}>Could not load tasks.</p>

  const filtered = (data ?? []).filter(t => {
    const term = search.toLowerCase()
    return (
      t.title.toLowerCase().includes(term) ||
      t.status.toLowerCase().includes(term) ||
      t.assignee.toLowerCase().includes(term)
    )
  })

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 16 }}>
      <h1 className="display-inline" style={{ marginBottom: 16 }}>Mini Workboard</h1>
      <button
        className="btn btn-primary float-end"
        style={{ marginBottom: 16 }}
        onClick={() => navigate('/task')}
      >
        New Task
      </button><br />
      <TaskTable tasks={filtered} />
    </div>
  )
}
