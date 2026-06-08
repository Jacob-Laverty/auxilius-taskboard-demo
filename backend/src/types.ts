// Shared domain types.
// NOTE: duplicated in frontend/src/types.ts to keep scope small
// In production this would live in a shared workspace package consumed by both to avoid duplication
export type TaskStatus = 'todo' | 'in_progress' | 'done';

export const TASK_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done'];

export interface Task {
  id: string;
  task_number: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
}

// Socket event names, shared so client and server can't drift.
export const SOCKET_EVENTS = {
  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated',
  TASK_DELETED: 'task:deleted',
} as const;