import { useState, useMemo } from 'react'
import type { Task } from '@/types'
import { useNavigate } from 'react-router-dom'

const PRIORITY_RANK: Record<string, number> = {
  high: 1,
  medium: 2,
  low: 3,
}

export function TaskTable({ tasks: initialTasks }: { tasks: Task[] }) {
  const navigate = useNavigate()

  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortField, setSortField] = useState<'dueDate' | 'priority' | ''>('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const [editFields, setEditFields] = useState({
    title: '',
    assignee: '',
    status: '',
    priority: '',
    dueDate: '',
  })

  // Summary counts
  const counts = useMemo(() => {
    const total = tasks.length
    const todo = tasks.filter(t => t.status.toLowerCase() === 'todo').length
    const inProgress = tasks.filter(t => t.status.toLowerCase() === 'doing').length
    const done = tasks.filter(t => t.status.toLowerCase() === 'done').length
    return { total, todo, inProgress, done }
  }, [tasks])

  // Filter & Sort
  const filteredTasks = useMemo(() => {
    const filtered = tasks.filter(t => {
      const matchesSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.assignee.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter ? t.status === statusFilter : true
      return matchesSearch && matchesStatus
    })

    if (sortField === 'dueDate') {
      filtered.sort((a, b) => {
        const dateA = new Date(a.dueDate).getTime()
        const dateB = new Date(b.dueDate).getTime()
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
      })
    } else if (sortField === 'priority') {
      filtered.sort((a, b) => {
        const rankA = PRIORITY_RANK[a.priority.toLowerCase()] ?? 99
        const rankB = PRIORITY_RANK[b.priority.toLowerCase()] ?? 99
        return sortOrder === 'asc' ? rankA - rankB : rankB - rankA
      })
    }

    return filtered
  }, [tasks, search, statusFilter, sortField, sortOrder])

  const uniqueStatuses = Array.from(new Set(tasks.map(t => t.status)))

  const handleSort = (field: 'dueDate' | 'priority') => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const getStatusStyle = (status: string) => {
    const base = {
      display: 'inline-block',
      padding: '4px 10px',
      borderRadius: 12,
      fontSize: '0.85rem',
      fontWeight: 600,
      color: '#fff',
      textTransform: 'capitalize' as const,
    }
    switch (status.toLowerCase()) {
      case 'todo': return { ...base, backgroundColor: '#fbbc05' }
      case 'doing': return { ...base, backgroundColor: '#1e90ff' }
      case 'done': return { ...base, backgroundColor: '#34a853' }
      default: return { ...base, backgroundColor: '#888' }
    }
  }

  const getPriorityBadge = (priority: string) => {
    const base = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 10px',
      borderRadius: 12,
      fontSize: '0.85rem',
      fontWeight: 600,
      color: '#fff',
      textTransform: 'capitalize' as const,
    }
    switch (priority.toLowerCase()) {
      case 'high': return <span style={{ ...base, backgroundColor: '#d93025' }}>High</span>
      case 'medium': return <span style={{ ...base, backgroundColor: '#fbbc05' }}>Medium</span>
      case 'low': return <span style={{ ...base, backgroundColor: '#34a853' }}>Low</span>
      default: return <span style={{ ...base, backgroundColor: '#888' }}>{priority}</span>
    }
  }

  const startEdit = (task: Task) => {
    setEditingTask(task)
    setEditFields({
      title: task.title,
      assignee: task.assignee,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate.slice(0, 10),
    })
  }

  const saveEdit = () => {
    if (!editingTask) return

    const updatedTasks = tasks.map(t =>
      t.id === editingTask.id
        ? {
            ...t,
            title: editFields.title,
            assignee: editFields.assignee,
            status: editFields.status as Task['status'],
            priority: editFields.priority as Task['priority'],
            dueDate: editFields.dueDate,
          }
        : t
    )

    setTasks(updatedTasks)
    setEditingTask(null)
    setSelectedTask(null)
  }

  const deleteTask = (task: Task) => {
    setTasks(tasks.filter(t => t.id !== task.id))
    setSelectedTask(null)
    navigate(`/tasks/${task.id}/delete`)
  }

  if (!tasks.length) return <p>No tasks found.</p>

  return (
    <div style={{ padding: 16 }}>
      {/* Summary */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div>Total Tasks: {counts.total}</div>
        <div style={{ color: '#fbbc05' }}>To-Do: {counts.todo}</div>
        <div style={{ color: '#1e90ff' }}>Doing: {counts.inProgress}</div>
        <div style={{ color: '#34a853' }}>Done: {counts.done}</div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          placeholder="Search by title or assignee..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: 8, border: '1px solid #ccc', borderRadius: 6, flex: 1 }}
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: 8, border: '1px solid #ccc', borderRadius: 6 }}
        >
          <option value="">All Statuses</option>
          {uniqueStatuses.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <Th>Title</Th>
            <Th>Status</Th>
            <Th>Assignee</Th>
            <Th onClick={() => handleSort('priority')} isSortable>
              Priority {sortField === 'priority' && (sortOrder === 'asc' ? '▲' : '▼')}
            </Th>
            <Th onClick={() => handleSort('dueDate')} isSortable>
              Due {sortField === 'dueDate' && (sortOrder === 'asc' ? '▲' : '▼')}
            </Th>
          </tr>
        </thead>
        <tbody>
          {filteredTasks.map(t => (
            <tr
              key={t.id}
              style={{ cursor: 'pointer' }}
              onClick={() => setSelectedTask(t)}
            >
              <Td>{t.title}</Td>
              <Td><span style={getStatusStyle(t.status)}>{t.status}</span></Td>
              <Td>{t.assignee}</Td>
              <Td>{getPriorityBadge(t.priority)}</Td>
              <Td>{new Date(t.dueDate).toLocaleDateString()}</Td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal */}
      {selectedTask && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
          onClick={() => {
            setSelectedTask(null)
            setEditingTask(null)
          }}
        >
          <div
            style={{
              background: '#fff',
              padding: 24,
              borderRadius: 8,
              minWidth: 320,
              maxWidth: 400,
            }}
            onClick={e => e.stopPropagation()}
          >
            {editingTask ? (
              <>
                <h2>Edit Task</h2>

                <input
                  value={editFields.title}
                  onChange={e =>
                    setEditFields({ ...editFields, title: e.target.value })
                  }
                  style={{ width: '100%', marginBottom: 8, padding: 6 }}
                />

                <input
                  value={editFields.assignee}
                  onChange={e =>
                    setEditFields({ ...editFields, assignee: e.target.value })
                  }
                  style={{ width: '100%', marginBottom: 8, padding: 6 }}
                />

                <select
                  value={editFields.status}
                  onChange={e =>
                    setEditFields({ ...editFields, status: e.target.value })
                  }
                  style={{ width: '100%', marginBottom: 8, padding: 6 }}
                >
                  <option value="todo">To-Do</option>
                  <option value="doing">Doing</option>
                  <option value="done">Done</option>
                </select>

                <select
                  value={editFields.priority}
                  onChange={e =>
                    setEditFields({ ...editFields, priority: e.target.value })
                  }
                  style={{ width: '100%', marginBottom: 8, padding: 6 }}
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>

                <input
                  type="date"
                  value={editFields.dueDate}
                  onChange={e =>
                    setEditFields({ ...editFields, dueDate: e.target.value })
                  }
                  style={{ width: '100%', marginBottom: 8, padding: 6 }}
                />

                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    justifyContent: 'flex-end',
                  }}
                >
                  <button
                    onClick={saveEdit}
                    style={{
                      background: '#1e90ff',
                      color: '#fff',
                      padding: '6px 12px',
                      borderRadius: 4,
                    }}
                  >
                    Save
                  </button>

                  <button
                    onClick={() => setEditingTask(null)}
                    style={{ padding: '6px 12px', borderRadius: 4 }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2>{selectedTask.title}</h2>
                <p>Status: <strong>{selectedTask.status}</strong></p>
                <p>Assignee: {selectedTask.assignee}</p>
                <p>Priority: {selectedTask.priority}</p>
                <p>Due Date: {new Date(selectedTask.dueDate).toLocaleDateString()}</p>

                <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                  <button
                    onClick={() => startEdit(selectedTask)}
                    style={{
                      padding: '6px 12px',
                      background: '#1e90ff',
                      color: '#fff',
                      borderRadius: 4,
                    }}
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => deleteTask(selectedTask)}
                    style={{
                      padding: '6px 12px',
                      background: '#d93025',
                      color: '#fff',
                      borderRadius: 4,
                    }}
                  >
                    Delete
                  </button>

                  <button
                    onClick={() => setSelectedTask(null)}
                    style={{ padding: '6px 12px', borderRadius: 4 }}
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Table helpers
function Th({
  children,
  onClick,
  isSortable = false,
}: {
  children: React.ReactNode
  onClick?: () => void
  isSortable?: boolean
}) {
  return (
    <th
      onClick={onClick}
      style={{
        textAlign: 'left',
        borderBottom: '1px solid #ddd',
        padding: 8,
        background: '#fafafa',
        cursor: isSortable ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      {children}
    </th>
  )
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8 }}>{children}</td>
  )
}
