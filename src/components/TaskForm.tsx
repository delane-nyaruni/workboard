// src/components/TaskForm.tsx
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { createTask, getTask, updateTask } from '@/api/client'
import type { Task } from '@/types'

// --- Validation schema
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

  const { data: taskData, isLoading } = useQuery<Task | undefined>({
    queryKey: ['task', id],
    queryFn: () => (id ? getTask(id) : Promise.resolve(undefined)),
    enabled: !!id,
  })

  useEffect(() => {
    if (taskData) reset(taskData)
  }, [taskData, reset])

  // Mutations
  const mutation = useMutation({
    mutationFn: (formData: TaskFormValues) =>
      id ? updateTask(id, formData) : createTask(formData),

    onMutate: async (newTask) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      const previous = queryClient.getQueryData<Task[]>(['tasks'])

      if (!id) {
        queryClient.setQueryData<Task[]>(['tasks'], (old = []) => [
          ...old,
          { ...newTask, id: Date.now().toString() },
        ])
      }
      return { previous }
    },

    onError: (_err, _new, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['tasks'], ctx.previous)
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })

  // Soft popups
  const showPopup = (id: string, msg: string, duration = 2000) => {
    const el = document.getElementById(id)
    if (!el) return
    el.textContent = msg
    el.style.display = 'block'
    setTimeout(() => (el.style.display = 'none'), duration)
  }

  const successPopup = (msg: string) => showPopup('successPopup', msg)
  const errorPopup = (msg: string) => showPopup('errorPopup', msg, 3000)

  const onSubmit = async (data: TaskFormValues) => {
    if (!data.title) return errorPopup('Title is required')
    if (!data.assignee) return errorPopup('Assignee is required')
    if (!data.dueDate) return errorPopup('Due date is required')

    await mutation.mutateAsync(data)
    successPopup('Task saved!')

    setTimeout(() => navigate('/'), 2000)
  }

  if (isLoading) return <p className="text-center mt-4">Loading task…</p>

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="container mt-4 p-4 border rounded shadow-sm"
        style={{ maxWidth: 600 }}
      >
        <h3 className="mb-4">{id ? 'Edit Task' : 'New Task'}</h3>

        {/* Title */}
        <div className="mb-3">
          <label className="form-label">Title</label>
          <input className="form-control" {...register('title')} />
          {errors.title && (
            <div className="text-danger small mt-1">{errors.title.message}</div>
          )}
        </div>

        {/* Status */}
        <div className="mb-3">
          <label className="form-label">Status</label>
          <select className="form-select" {...register('status')}>
            <option value="Todo">Todo</option>
            <option value="Doing">Doing</option>
            <option value="Done">Done</option>
          </select>
        </div>

        {/* Assignee */}
        <div className="mb-3">
          <label className="form-label">Assignee</label>
          <input className="form-control" {...register('assignee')} />
          {errors.assignee && (
            <div className="text-danger small mt-1">
              {errors.assignee.message}
            </div>
          )}
        </div>

        {/* Priority */}
        <div className="mb-3">
          <label className="form-label">Priority</label>
          <select className="form-select" {...register('priority')}>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        {/* Due date */}
        <div className="mb-3">
          <label className="form-label">Due Date</label>
          <input type="date" className="form-control" {...register('dueDate')} />
          {errors.dueDate && (
            <div className="text-danger small mt-1">{errors.dueDate.message}</div>
          )}
        </div>

        {/* Description */}
        <div className="mb-3">
          <label className="form-label">Description</label>
          <textarea className="form-control" rows={3} {...register('description')} />
        </div>

        {/* Buttons */}
        <div className="d-flex gap-2 mt-3">
          <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save'}
          </button>
          <button type="button" className="btn btn-secondary  btn-block" onClick={() => navigate(-1)}>
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
