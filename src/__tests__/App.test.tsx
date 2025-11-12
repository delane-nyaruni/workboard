import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from '../Home'

// Mock API client
vi.mock('../api/client', () => ({
  listTasks: vi.fn().mockResolvedValue([
    {
      id: '1',
      title: 'Test Task',
      status: 'Todo',
      assignee: 'John Doe',
      priority: 'High',
      dueDate: '2025-11-12',
    },
  ]),
}))

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

describe('App', () => {
  it(
    'renders title and table headers after loading tasks',
    async () => {
      const queryClient = createQueryClient()

      render(
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      )

      // Wait for table to appear
      const title = await screen.findByText(/Mini Workboard/i)
      const colTitle = await screen.findByText(/Title/i)
      const colPriority = await screen.findByText(/Priority/i)

      expect(title).toBeInTheDocument()
      expect(colTitle).toBeInTheDocument()
      expect(colPriority).toBeInTheDocument()

      // Optional: verify the mocked task is displayed
      const task = await screen.findByText(/Test Task/i)
      expect(task).toBeInTheDocument()
    },
    100
  )
})
