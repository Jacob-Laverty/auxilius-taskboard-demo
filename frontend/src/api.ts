import type { Task, TaskStatus } from './types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

export interface CreateTaskBody {
  title: string;
  description?: string | null;
  status?: TaskStatus;
}

export interface UpdateTaskBody {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // non-JSON error body; keep the generic message
    }
    throw new Error(message);
  }
  // 204 No Content has no body to parse.
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function fetchTasks(): Promise<Task[]> {
  return fetch(`${API_URL}/tasks`).then((r) => handle<Task[]>(r));
}

export function createTask(body: CreateTaskBody): Promise<Task> {
  return fetch(`${API_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then((r) => handle<Task>(r));
}

export function updateTask(id: string, body: UpdateTaskBody): Promise<Task> {
  return fetch(`${API_URL}/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then((r) => handle<Task>(r));
}

export function deleteTask(id: string): Promise<void> {
  return fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE' }).then((r) =>
    handle<void>(r),
  );
}