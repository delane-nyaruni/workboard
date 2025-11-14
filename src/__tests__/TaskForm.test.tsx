// src/__tests__/TaskForm.test.tsx
import { jest } from '@jest/globals'

// Mock navigate FIRST
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...(jest.requireActual('react-router-dom') as object),
  useNavigate: () => mockNavigate,
}))

// Mock API client SECOND
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockCreateTask = jest.fn<any>()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUpdateTask = jest.fn<any>()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockGetTask = jest.fn<any>()

jest.mock('@/api/client', () => ({
  createTask: mockCreateTask,
  updateTask: mockUpdateTask,
  getTask: mockGetTask,
}))

// THEN import everything else
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import TaskForm from '@/components/TaskForm'

describe('TaskForm', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    mockCreateTask.mockClear()
    mockUpdateTask.mockClear()
    mockGetTask.mockClear()
    
    // Set default mock implementation
    mockCreateTask.mockResolvedValue({
      id: 1,
      title: 'Test Task',
    })
  })

  test('shows validation message when title is empty', async () => {
    render(
      <MemoryRouter>
        <TaskForm />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByText(/Save/i))

    expect(await screen.findByText(/Title is required/i)).toBeInTheDocument()
  })

  test('submits valid form successfully', async () => {
    render(
      <MemoryRouter>
        <TaskForm />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: { value: 'My Task' },
    })
    fireEvent.change(screen.getByLabelText(/Assignee/i), {
      target: { value: 'Delane' },
    })
    fireEvent.change(screen.getByLabelText(/Status/i), {
      target: { value: 'Todo' },
    })
    fireEvent.change(screen.getByLabelText(/Priority/i), {
      target: { value: 'Medium' },
    })
    fireEvent.change(screen.getByLabelText(/Due Date/i), {
      target: { value: '2025-11-13' },
    })

    fireEvent.click(screen.getByText(/Save/i))

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/')
    )
  })

  test('renders form fields properly', () => {
    render(
      <MemoryRouter>
        <TaskForm />
      </MemoryRouter>
    )

    expect(screen.getByLabelText(/Title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Assignee/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Status/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Priority/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Due Date/i)).toBeInTheDocument()

    expect(screen.getByRole('button', { name: /Save/i })).toBeInTheDocument()
  })
})