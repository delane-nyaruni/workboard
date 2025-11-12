// src/components/TaskForm.tsx
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { createTask, getTask, updateTask } from '@/api/client'
import type { Task } from '@/types'

// --- Zod schema for validation
const TaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  status: z.enum(['Todo', 'Doing', 'Done']),
  assignee: z.string().min(1, 'Assignee is required'),
  priority: z.enum(['Low', 'Medium', 'High']),
  dueDate: z.string().min(1, 'Due date is required'),
  description: z.string().optional(),
})

type TaskFormValues = z.infer<typeof TaskSchema>

export default function TaskForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>() // TS knows id is string | undefined
  const queryClient = useQueryClient()

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(TaskSchema),
    defaultValues: {
      title: '',
      status: 'Todo',
      assignee: '',
      priority: 'Medium',
      dueDate: '',
      description: '',
    },
  })

  // Fetch existing task if editing
  const { data: taskData, isLoading } = useQuery<Task | undefined>({
    queryKey: ['task', id],
    queryFn: () => (id ? getTask(id) : Promise.resolve(undefined)),
    enabled: !!id,
  })

  // Populate form when editing
  useEffect(() => {
    if (taskData) {
      reset(taskData)
    }
  }, [taskData, reset])

  // Mutation for create/update with optimistic update
  const mutation = useMutation(
    {
      mutationFn: (formData: TaskFormValues) => (id ? updateTask(id, formData) : createTask(formData)),
      onMutate: async (newTask) => {
        await queryClient.cancelQueries({ queryKey: ['tasks'] })
        const previousTasks = queryClient.getQueryData<Task[]>(['tasks'])

        if (!id) {
          // Optimistic update for create
          queryClient.setQueryData<Task[]>(['tasks'], (old = []) => [
            ...old,
            { ...newTask, id: Date.now().toString() },
          ])
        }

        return { previousTasks }
      },
      onError: (_err, _newTask, context) => {
        if (context?.previousTasks) {
          queryClient.setQueryData(['tasks'], context.previousTasks)
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ['tasks'] })
      },
    }
  )

  const onSubmit = async (data: TaskFormValues) => {
    await mutation.mutateAsync(data)
    navigate('/') // back to task list
  }

  if (isLoading) return <p>Loading task…</p>

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      style={{
        maxWidth: 500,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <h2>{id ? 'Edit Task' : 'New Task'}</h2>

      <label>
        Title
        <input {...register('title')} />
        {errors.title && (
          <span role="alert" style={{ color: 'red' }}>
            {errors.title.message}
          </span>
        )}
      </label>

      <label>
        Status
        <select {...register('status')}>
          <option value="Todo">Todo</option>
          <option value="Doing">Doing</option>
          <option value="Done">Done</option>
        </select>
      </label>

      <label>
        Assignee
        <input {...register('assignee')} />
        {errors.assignee && (
          <span role="alert" style={{ color: 'red' }}>
            {errors.assignee.message}
          </span>
        )}
      </label>
      <label>
        Priority
        <select {...register('priority')}>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
      </label>

      <label>
        Due Date
        <input type="date" {...register('dueDate')} />
        {errors.dueDate && (
          <span role="alert" style={{ color: 'red' }}>
            {errors.dueDate.message}
          </span>
        )}
      </label>

      <label>
        Description
        <textarea {...register('description')} rows={3} />
      </label>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving…' : 'Save'}
      </button>
    </form>
  )
}
