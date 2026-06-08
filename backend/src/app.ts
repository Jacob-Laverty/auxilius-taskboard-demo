import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';

/**
 * Build the Express app. No .listen() here on purpose: index.ts owns the
 * HTTP server + Socket.IO wiring, and tests import this factory directly.
 *
 * The broadcaster is injected so route handlers can emit real-time events
 * without app.ts depending on socket.io. For now it's a placeholder;
 * route handlers land in the next iteration.
 */
export interface Broadcaster {
  emit(event: string, payload: unknown): void;
}

// No-op broadcaster used in tests / before sockets are wired.
export const noopBroadcaster: Broadcaster = {
  emit: () => {},
};

export function createApp(_broadcaster: Broadcaster = noopBroadcaster): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  // Task routes (GET/POST/PATCH/DELETE /tasks) get mounted here next iteration.

  return app;
}