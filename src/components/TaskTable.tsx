import type { Task } from '../types'

export function TaskTable({ tasks }: { tasks: Task[] }) {
  if (!tasks.length) return <p>No tasks found.</p>
  return (
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
        {tasks.map(t => (
          <tr key={t.id}>
            <Td>{t.title}</Td>
            <Td>{t.status}</Td>
            <Td>{t.assignee}</Td>
            <Td>{t.priority}</Td>
            <Td>{new Date(t.dueDate).toLocaleDateString()}</Td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>{children}</th>
}
function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8 }}>{children}</td>
}
