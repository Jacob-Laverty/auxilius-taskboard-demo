import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';
import type { Pool } from 'pg';
import { getPool } from './db.js';
import { createTasksRouter } from './tasks.router.js';

/**
 * Build the Express app. No .listen() here on purpose: index.ts owns the
 * HTTP server + Socket.IO wiring, and tests import this factory directly.
 *
 * The broadcaster is injected so route handlers can emit real-time events
 * without app.ts depending on socket.io. The pool is injected so tests can
 * pass a mock instead of a live database.
 */
export interface Broadcaster {
  emit(event: string, payload: unknown): void;
}

// No-op broadcaster used in tests / before sockets are wired.
export const noopBroadcaster: Broadcaster = {
  emit: () => {},
};

export interface CreateAppOptions {
  pool?: Pool;
  broadcaster?: Broadcaster;
}

export function createApp(options: CreateAppOptions = {}): Express {
  const pool = options.pool ?? getPool();
  const broadcaster = options.broadcaster ?? noopBroadcaster;

  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/tasks', createTasksRouter(pool, broadcaster));

  return app;
}