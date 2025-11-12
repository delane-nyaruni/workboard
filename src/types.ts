export type TaskStatus = 'Todo' | 'Doing' | 'Done';
export type Priority = 'Low' | 'Medium' | 'High';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  assignee: string;
  priority: Priority;
  dueDate: string; // ISO
  description?: string;
}

export interface User {
  id: string;
  name: string;
}
