// Literally copy/pasted from backend to ensure parity.
// In a real app again this would be exported up to a shared library and reused across the project
// Thats actually a decent amount of overhead to coordinate for a demo so we're just noting it for now.
export type TaskStatus = 'todo' | 'in_progress' | 'done';

export const TASK_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done'];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
};

export interface Task {
  id: string;
  task_number: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
}

export const SOCKET_EVENTS = {
  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated',
  TASK_DELETED: 'task:deleted',
} as const;

// Legible ID shown in the UI, e.g. "TASK-1".
export function formatTaskId(task: Pick<Task, 'task_number'>): string {
  return `TASK-${task.task_number}`;
}