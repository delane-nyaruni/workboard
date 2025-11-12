import axios from 'axios'
import { z } from 'zod'
import type { Task, User } from '@/types'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001'
})

const TaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  status: z.enum(['Todo','Doing','Done']),
  assignee: z.string().min(1),
  priority: z.enum(['Low','Medium','High']),
  dueDate: z.string(),
  description: z.string().optional()
})
export const parseTask = (t: unknown): Task => TaskSchema.parse(t)

export async function listTasks(): Promise<Task[]> {
  const res = await api.get('/tasks')
  return z.array(TaskSchema).parse(res.data)
}

export async function getTask(id: string): Promise<Task> {
  const res = await api.get(`/tasks/${id}`)
  return parseTask(res.data)
}

export async function createTask(input: Omit<Task,'id'>): Promise<Task> {
  const res = await api.post('/tasks', input)
  return parseTask(res.data)
}

export async function updateTask(id: string, patch: Partial<Omit<Task,'id'>>): Promise<Task> {
  const res = await api.patch(`/tasks/${id}`, patch)
  return parseTask(res.data)
}

export async function removeTask(id: string): Promise<void> {
  await api.delete(`/tasks/${id}`)
}

export async function listUsers(): Promise<User[]> {
  const res = await api.get('/users')
  return z.array(z.object({ id: z.string(), name: z.string() })).parse(res.data)
}
