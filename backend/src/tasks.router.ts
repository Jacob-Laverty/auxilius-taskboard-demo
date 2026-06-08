import { Router, type Request, type Response } from 'express';
import type { Pool } from 'pg';
import type { Broadcaster } from './app.js';
import { SOCKET_EVENTS } from './types.js';
import {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
} from './tasks.repository.js';
import { parseCreate, parseUpdate, ValidationError } from './tasks.validation.js';

interface TaskParams {
  id: string;
}

export function createTasksRouter(pool: Pool, broadcaster: Broadcaster): Router {
  const router = Router();

  // Wrap async handlers so thrown errors hit the error middleware.
  const wrap =
    <P>(fn: (req: Request<P>, res: Response) => Promise<void>) =>
    (req: Request<P>, res: Response) => {
      fn(req, res).catch((err) => {
        if (err instanceof ValidationError) {
          res.status(400).json({ error: err.message });
          return;
        }
        console.error('tasks route error:', err);
        res.status(500).json({ error: 'internal server error' });
      });
    }; 

  router.get(
    '/',
    wrap(async (_req, res) => {
      const tasks = await listTasks(pool);
      res.json(tasks);
    }),
  );

  router.post(
    '/',
    wrap(async (req, res) => {
      const input = parseCreate(req.body);
      const task = await createTask(pool, input);
      broadcaster.emit(SOCKET_EVENTS.TASK_CREATED, task);
      res.status(201).json(task);
    }),
  );

  router.patch(
    '/:id',
    wrap<TaskParams>(async (req, res) => {
      const input = parseUpdate(req.body);
      const task = await updateTask(pool, req.params.id, input);
      if (!task) {
        res.status(404).json({ error: 'task not found' });
        return;
      }
      broadcaster.emit(SOCKET_EVENTS.TASK_UPDATED, task);
      res.json(task);
    }),
  );

  router.delete(
    '/:id',
    wrap<TaskParams>(async (req, res) => {
      const deleted = await deleteTask(pool, req.params.id);
      if (!deleted) {
        res.status(404).json({ error: 'task not found' });
        return;
      }
      broadcaster.emit(SOCKET_EVENTS.TASK_DELETED, { id: req.params.id });
      res.status(204).send();
    }),
  );

  return router;
}