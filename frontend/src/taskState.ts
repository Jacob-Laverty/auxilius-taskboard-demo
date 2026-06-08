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
export function taskState(): TaskState {
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

    socket.on(SOCKET_EVENTS.TASK_CREATED, (task: Task) => {
      setTasks((prev) =>
        prev.some((t) => t.id === task.id) ? prev : [...prev, task],
      );
      flash(task.id);
    });

    socket.on(SOCKET_EVENTS.TASK_UPDATED, (task: Task) => {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
      flash(task.id);
    });

    socket.on(SOCKET_EVENTS.TASK_DELETED, (payload: { id: string }) => {
      setTasks((prev) => prev.filter((t) => t.id !== payload.id));
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