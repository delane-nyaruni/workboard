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
  const { id } = useParams<{ id: string }>()
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

  useEffect(() => {
    if (taskData) reset(taskData)
  }, [taskData, reset])

  // Mutation for create/update
  const mutation = useMutation({
    mutationFn: (formData: TaskFormValues) =>
      id ? updateTask(id, formData) : createTask(formData),
    onMutate: async (newTask) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks'])

      if (!id) {
        queryClient.setQueryData<Task[]>(['tasks'], (old = []) => [
          ...old,
          { ...newTask, id: Date.now().toString() },
        ])
      }
      return { previousTasks }
    },
    onError: (_err, _newTask, context) => {
      if (context?.previousTasks) queryClient.setQueryData(['tasks'], context.previousTasks)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })

  // --- Soft Popup Handlers ---
  const showPopup = (id: string, msg: string, duration = 2000) => {
    const el = document.getElementById(id)
    if (!el) return
    el.textContent = msg
    el.style.display = 'block'
    setTimeout(() => (el.style.display = 'none'), duration)
  }

  const successPopup = (msg: string) => showPopup('successPopup', msg, 2000)
  const errorPopup = (msg: string) => showPopup('errorPopup', msg, 3000)

  const onSubmit = async (data: TaskFormValues) => {
    // extra soft validation (optional, redundant with zod)
    if (!data.title) return errorPopup('Title is required')
    if (!data.assignee) return errorPopup('Assignee is required')
    if (!data.dueDate) return errorPopup('Due date is required')

    await mutation.mutateAsync(data)
    successPopup('Task saved!')

    setTimeout(() => navigate('/'), 2000)
  }

  if (isLoading) return <p>Loading task…</p>

  return (
    <>
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
          {errors.title && <span role="alert" style={{ color: 'red' }}>{errors.title.message}</span>}
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
          {errors.assignee && <span role="alert" style={{ color: 'red' }}>{errors.assignee.message}</span>}
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
          {errors.dueDate && <span role="alert" style={{ color: 'red' }}>{errors.dueDate.message}</span>}
        </label>

        <label>
          Description
          <textarea {...register('description')} rows={3} />
        </label>

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" disabled={isSubmitting} className="btn btn-primary">
            {isSubmitting ? 'Saving…' : 'Save'}
          </button>

          <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </form>

      {/* Soft Popups */}
      <div id="successPopup" className="msgSuccess" style={{ display: 'none' }}></div>
      <div id="errorPopup" className="msgError" style={{ display: 'none' }}></div>
    </>
  )
}
