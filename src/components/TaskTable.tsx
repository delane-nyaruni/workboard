// src/components/TaskTable.tsx
import { useState, useMemo } from 'react'
import type { Task } from '@/types'
// import { useNavigate } from 'react-router-dom'
import { updateTask, removeTask } from '@/api/client'
import React from 'react' // Import React for React.ReactNode types

const PRIORITY_RANK: Record<string, number> = {
  high: 1,
  medium: 2,
  low: 3,
}

function Th({ children, onClick, isSortable = false }: { children: React.ReactNode; onClick?: () => void; isSortable?: boolean }) {
  return <th onClick={onClick} style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8, background: '#fafafa', cursor: isSortable ? 'pointer' : 'default', userSelect: 'none' }}>{children}</th>
}

function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8 }}>{children}</td>
}

export function TaskTable({ tasks: initialTasks }: { tasks: Task[] }) {
  // const navigate = useNavigate()

  // Use initialTasks as a base, but local state can drift if the parent updates tasks
  // For a table that fetches and manages its own state, this is okay.
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [search, setSearch] = useState('')
  // Ensure statusFilter matches the case used in the Task type/data (e.g., 'Todo', 'Doing', 'Done')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortField, setSortField] = useState<'dueDate' | 'priority' | ''>('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  // Omit<Task, 'id'> ensures all Task properties except 'id' are available for editing
  // We use Partial because some fields might not be present initially/in the state
  const [editFields, setEditFields] = useState<Partial<Omit<Task, 'id'>>>({
    title: '',
    assignee: '',
    // Use proper case matching the data for status/priority
    status: 'Todo',
    priority: 'Medium',
    dueDate: '', // YYYY-MM-DD string for input type="date"
  })

  // Summary counts
  const counts = useMemo(() => {
    const total = tasks.length
    // Convert status to lower case for reliable comparison
    const todo = tasks.filter(t => t.status.toLowerCase() === 'todo').length
    const inProgress = tasks.filter(t => t.status.toLowerCase() === 'doing').length
    const done = tasks.filter(t => t.status.toLowerCase() === 'done').length
    return { total, todo, inProgress, done }
  }, [tasks])

  // Filter & Sort
  const filteredTasks = useMemo(() => {
    // 1. Filter
    const filtered = tasks.filter(t => {
      const matchesSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.assignee.toLowerCase().includes(search.toLowerCase())
      // Status filter is case-sensitive here, which is fine if statusFilter matches 'Todo', 'Doing', etc.
      const matchesStatus = statusFilter ? t.status === statusFilter : true
      return matchesSearch && matchesStatus
    })

    // 2. Sort (create a copy before sorting to avoid modifying the original array in place)
    const sortableFiltered = [...filtered];

    if (sortField === 'dueDate') {
      sortableFiltered.sort((a, b) => {
        const dateA = new Date(a.dueDate).getTime()
        const dateB = new Date(b.dueDate).getTime()
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
      })
    } else if (sortField === 'priority') {
      sortableFiltered.sort((a, b) => {
        const rankA = PRIORITY_RANK[a.priority.toLowerCase()] ?? 99
        const rankB = PRIORITY_RANK[b.priority.toLowerCase()] ?? 99
        return sortOrder === 'asc' ? rankA - rankB : rankB - rankA
      })
    }

    return sortableFiltered
  }, [tasks, search, statusFilter, sortField, sortOrder])

  // Ensure uniqueStatuses reflects the current tasks (it was correct, but keep it with the state)
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
      case 'todo':
        return { ...base, backgroundColor: '#fbbc05' }
      case 'doing':
        return { ...base, backgroundColor: '#1e90ff' }
      case 'done':
        return { ...base, backgroundColor: '#34a853' }
      default:
        return { ...base, backgroundColor: '#888' }
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
      case 'high':
        return <span style={{ ...base, backgroundColor: '#d93025' }}>High</span>
      case 'medium':
        return <span style={{ ...base, backgroundColor: '#fbbc05' }}>Medium</span>
      case 'low':
        return <span style={{ ...base, backgroundColor: '#34a853' }}>Low</span>
      default:
        return <span style={{ ...base, backgroundColor: '#888' }}>{priority}</span>
    }
  }

  const startEdit = (task: Task) => {
    setEditingTask(task)
    setEditFields({
      title: task.title,
      assignee: task.assignee,
      status: task.status,
      priority: task.priority,
      // Slice to YYYY-MM-DD for the HTML date input
      dueDate: task.dueDate.slice(0, 10), 
    })
  }

  const saveEdit = async () => {
    if (!editingTask) return

    // Ensure all required fields for a Task are present before proceeding
    if (!editFields.title || !editFields.assignee || !editFields.status || !editFields.priority || !editFields.dueDate) {
        // Basic form validation/error handling can be added here
        alert('Please fill in all fields.')
        return
    }

    const patch: Partial<Omit<Task, 'id'>> = {
      title: editFields.title, // '!' removed as we checked for falsy above
      assignee: editFields.assignee, // '!' removed
      status: editFields.status as Task['status'],
      priority: editFields.priority as Task['priority'],
      dueDate: editFields.dueDate, // '!' removed. This is the YYYY-MM-DD string
    }

    // call API PATCH
    await updateTask(editingTask.id, patch as Task) // Type cast required for API call if it expects full Task, but Patch is better

    const updatedTasks = tasks.map(t =>
      t.id === editingTask.id ? { ...t, ...patch } : t
    )
    setTasks(updatedTasks as Task[]) // Cast needed if patch doesn't perfectly match
    setEditingTask(null)
    setSelectedTask(null)
  }

  const deleteTask = async (task: Task) => {
    await removeTask(task.id)
    setTasks(tasks.filter(t => t.id !== task.id))
    setSelectedTask(null)
  }

  if (!tasks.length && initialTasks.length > 0) return <p>No tasks match your filters.</p>
  if (!initialTasks.length) return <p>No tasks found.</p>


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
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {/* Th and Td are now correctly defined in scope */}
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
            <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedTask(t)}>
              <Td>{t.title}</Td>
              <Td>
                <span style={getStatusStyle(t.status)}>{t.status}</span>
              </Td>
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
              // minHeight: 400, // Optional
            }}
            onClick={e => e.stopPropagation()}
          >
            {editingTask ? (
              <>
                <h2>Edit Task: {editingTask.title}</h2>
                <input
                  placeholder="Title"
                  value={editFields.title}
                  onChange={e => setEditFields({ ...editFields, title: e.target.value })}
                  style={{ width: '100%', marginBottom: 8, padding: 6 }}
                />
                <input
                  placeholder="Assignee"
                  value={editFields.assignee}
                  onChange={e => setEditFields({ ...editFields, assignee: e.target.value })}
                  style={{ width: '100%', marginBottom: 8, padding: 6 }}
                />
                <select
                  value={editFields.status}
                  onChange={e => setEditFields({ ...editFields, status: e.target.value as Task['status'] })}
                  style={{ width: '100%', marginBottom: 8, padding: 6 }}
                >
                  <option value="Todo">Todo</option>
                  <option value="Doing">Doing</option>
                  <option value="Done">Done</option>
                </select>
                <select
                  value={editFields.priority}
                  onChange={e => setEditFields({ ...editFields, priority: e.target.value as Task['priority'] })}
                  style={{ width: '100%', marginBottom: 8, padding: 6 }}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
                <input
                  type="date"
                  value={editFields.dueDate}
                  onChange={e => setEditFields({ ...editFields, dueDate: e.target.value })}
                  style={{ width: '100%', marginBottom: 8, padding: 6 }}
                />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={saveEdit} style={{ background: '#1e90ff', color: '#fff', padding: '6px 12px', borderRadius: 4 }}>
                    Save
                  </button>
                  <button onClick={() => setEditingTask(null)} style={{ padding: '6px 12px', borderRadius: 4 }}>
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              // Display mode
              <>
                <h2>{selectedTask.title}</h2>
                <p>Status: <span className='m-2'>{selectedTask.status}</span></p>
                <p>Assignee: <span className='m-2'>{selectedTask.assignee}</span></p>
                <p>Priority: <span className='m-2'>{selectedTask.priority}</span></p>
                <p>Due Date: <span className='m-2'>{new Date(selectedTask.dueDate).toLocaleDateString()}</span></p>

                <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                  <button onClick={() => startEdit(selectedTask)} style={{ padding: '6px 12px', background: '#1e90ff', color: '#fff', borderRadius: 4 }}>
                    Edit
                  </button>
                  <button onClick={() => deleteTask(selectedTask)} style={{ padding: '6px 12px', background: '#d93025', color: '#fff', borderRadius: 4 }}>
                    Delete
                  </button>
                  <button onClick={() => setSelectedTask(null)} style={{ padding: '6px 12px', borderRadius: 4 }}>
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