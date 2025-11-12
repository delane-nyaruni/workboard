import { useState, useMemo } from 'react'
import type { Task } from '@/types'

export function TaskTable({ tasks }: { tasks: Task[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Filtered tasks logic
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchesSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.assignee.toLowerCase().includes(search.toLowerCase())

      const matchesStatus = statusFilter ? t.status === statusFilter : true
      return matchesSearch && matchesStatus
    })
  }, [tasks, search, statusFilter])

  // Unique statuses for dropdown
  const uniqueStatuses = Array.from(new Set(tasks.map(t => t.status)))

  if (!tasks.length) return <p>No tasks found.</p>

  // Status colors
  const getStatusStyle = (status: string) => {
    const base = {
      display: 'inline-block',
      padding: '4px 10px',
      borderRadius: '12px',
      fontSize: '0.85rem',
      fontWeight: 600,
      color: '#fff',
      textTransform: 'capitalize' as const,
    }

    switch (status.toLowerCase()) {
      case 'todo':
        return { ...base, backgroundColor: '#fbbc05' } // yellow
      case 'in progress':
        return { ...base, backgroundColor: '#1e90ff' } // blue
      case 'done':
        return { ...base, backgroundColor: '#34a853' } // green
      default:
        return { ...base, backgroundColor: '#888' } // grey fallback
    }
  }

  // Priority colors and icons
  const getPriorityBadge = (priority: string) => {
    const base = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 10px',
      borderRadius: '12px',
      fontSize: '0.85rem',
      fontWeight: 600,
      color: '#fff',
      textTransform: 'capitalize' as const,
    }

    switch (priority.toLowerCase()) {
      case 'high':
        return (
          <span style={{ ...base, backgroundColor: '#d93025' }}>
           High
          </span>
        )
      case 'medium':
        return (
          <span style={{ ...base, backgroundColor: '#fbbc05' }}>
            Medium
          </span>
        )
      case 'low':
        return (
          <span style={{ ...base, backgroundColor: '#34a853' }}>
            Low
          </span>
        )
      default:
        return (
          <span style={{ ...base, backgroundColor: '#888' }}>
            ⚫ {priority}
          </span>
        )
    }
  }

  return (
    <div style={{ padding: 16 }}>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Search by title or assignee..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: 8,
            border: '1px solid #ccc',
            borderRadius: 6,
            flex: 1,
          }}
        />

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: 8, border: '1px solid #ccc', borderRadius: 6 }}
        >
          <option value="">All Statuses</option>
          {uniqueStatuses.map(status => (
            <option key={status} value={status}>
              {status}
            </option>
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
            <Th>Priority</Th>
            <Th>Due</Th>
          </tr>
        </thead>
        <tbody>
          {filteredTasks.map(t => (
            <tr key={t.id}>
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

      {filteredTasks.length === 0 && (
        <p style={{ marginTop: 12, color: '#999' }}>No matching tasks found.</p>
      )}
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        textAlign: 'left',
        borderBottom: '1px solid #ddd',
        padding: 8,
        background: '#fafafa',
      }}
    >
      {children}
    </th>
  )
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8 }}>
      {children}
    </td>
  )
}
