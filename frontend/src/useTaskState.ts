import { useEffect, useRef, useState, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { Task } from './types';
import { SOCKET_EVENTS } from './types';
import { fetchTasks } from './api';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';
const FLASH_MS = 800;

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  /** ids that changed very recently, for the visual flash */
  recentlyChanged: Set<string>;
  connected: boolean;
}

/**
 * Owns all task state. Loads the initial list over REST, then lets Socket.IO
 * events drive every subsequent change (server echo is the source of truth —
 * even this client's own mutations come back via the socket, so we don't
 * optimistically update). Tracks recently-changed ids so the UI can flash them.
 */
export function useTaskState(): TaskState {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [recentlyChanged, setRecentlyChanged] = useState<Set<string>>(
    () => new Set(),
  );

  // Track pending flash-clear timers so we can clean them up on unmount.
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const flash = useCallback((id: string) => {
    setRecentlyChanged((prev) => new Set(prev).add(id));
    const existing = timers.current.get(id);
    if (existing) clearTimeout(existing);
    const t = setTimeout(() => {
      setRecentlyChanged((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      timers.current.delete(id);
    }, FLASH_MS);
    timers.current.set(id, t);
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchTasks()
      .then((initial) => {
        if (!cancelled) setTasks(initial);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? 'Failed to load tasks');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const socket: Socket = io(API_URL);

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on(SOCKET_EVENTS.TASK_CREATED, (newTask: Task) => {
      // For all current Tasks check if the new task id is already in state
      // if yes keep state of tasks as currentTasks...otherwise append the new task to the state list
      setTasks((currentTasks) =>
        currentTasks.some((currentTask) => currentTask.id === newTask.id) ? currentTasks : [...currentTasks, newTask],
      );
      flash(newTask.id);
    });

    socket.on(SOCKET_EVENTS.TASK_UPDATED, (newTask: Task) => {
      // For all currentTasks update the task object of the task that changed.
      setTasks((currentTasks) => currentTasks.map((currentTask) => (currentTask.id === newTask.id ? newTask : currentTask)));
      flash(newTask.id);
    });

    socket.on(SOCKET_EVENTS.TASK_DELETED, (payload: { id: string }) => {
      // Keep only tasks that do not match the id...the id indicates the tasks that have been deleted.
      setTasks((currentTasks) => currentTasks.filter((currentTask) => currentTask.id !== payload.id));
    });

    const pending = timers.current;
    return () => {
      cancelled = true;
      socket.disconnect();
      pending.forEach((t) => clearTimeout(t));
      pending.clear();
    };
  }, [flash]);

  return { tasks, loading, error, recentlyChanged, connected };
}