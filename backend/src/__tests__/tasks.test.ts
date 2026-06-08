import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import type { Pool } from 'pg';
import { createApp, type Broadcaster } from '../app.js';
import type { Task } from '../types.js';

// A fake pool whose query() we control per-test.
function makePool(queryImpl: (sql: string, params?: unknown[]) => unknown) {
  return {
    query: vi.fn(queryImpl),
  } as unknown as Pool;
}

// Captures emitted socket events for assertions.
function makeBroadcaster() {
  const events: Array<{ event: string; payload: unknown }> = [];
  const broadcaster: Broadcaster = {
    emit: (event, payload) => {
      events.push({ event, payload });
    },
  };
  return { broadcaster, events };
}

const sampleTask: Task = {
  id: '11111111-1111-1111-1111-111111111111',
  task_number: 1,
  title: 'First task',
  description: null,
  status: 'todo',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

describe('tasks API', () => {
  let events: Array<{ event: string; payload: unknown }>;
  let broadcaster: Broadcaster;

  beforeEach(() => {
    ({ broadcaster, events } = makeBroadcaster());
  });

  it('GET /tasks returns the list', async () => {
    const pool = makePool(() => ({ rows: [sampleTask] }));
    const app = createApp({ pool, broadcaster });

    const res = await request(app).get('/tasks');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([sampleTask]);
  });

  it('POST /tasks creates and broadcasts task:created', async () => {
    const pool = makePool(() => ({ rows: [sampleTask] }));
    const app = createApp({ pool, broadcaster });

    const res = await request(app)
      .post('/tasks')
      .send({ title: 'First task', created_by: 'jake' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(sampleTask);
    expect(events).toEqual([{ event: 'task:created', payload: sampleTask }]);
  });

  it('POST /tasks rejects a missing title with 400', async () => {
    const pool = makePool(() => ({ rows: [] }));
    const app = createApp({ pool, broadcaster });

    const res = await request(app)
      .post('/tasks')
      .send({ created_by: 'jake' });

    expect(res.status).toBe(400);
    expect(events).toHaveLength(0);
  });

  it('POST /tasks rejects an invalid status with 400', async () => {
    const pool = makePool(() => ({ rows: [] }));
    const app = createApp({ pool, broadcaster });

    const res = await request(app)
      .post('/tasks')
      .send({ title: 'x', created_by: 'jake', status: 'archived' });

    expect(res.status).toBe(400);
  });

  it('PATCH /tasks/:id updates and broadcasts task:updated', async () => {
    const updated = { ...sampleTask, status: 'in_progress' as const };
    const pool = makePool(() => ({ rows: [updated] }));
    const app = createApp({ pool, broadcaster });

    const res = await request(app)
      .patch(`/tasks/${sampleTask.id}`)
      .send({ status: 'in_progress' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('in_progress');
    expect(events).toEqual([{ event: 'task:updated', payload: updated }]);
  });

  it('PATCH /tasks/:id returns 404 when the row is missing', async () => {
    const pool = makePool(() => ({ rows: [] }));
    const app = createApp({ pool, broadcaster });

    const res = await request(app)
      .patch('/tasks/00000000-0000-0000-0000-000000000000')
      .send({ status: 'done' });

    expect(res.status).toBe(404);
    expect(events).toHaveLength(0);
  });

  it('DELETE /tasks/:id deletes and broadcasts task:deleted', async () => {
    const pool = makePool(() => ({ rowCount: 1 }));
    const app = createApp({ pool, broadcaster });

    const res = await request(app).delete(`/tasks/${sampleTask.id}`);

    expect(res.status).toBe(204);
    expect(events).toEqual([
      { event: 'task:deleted', payload: { id: sampleTask.id } },
    ]);
  });

  it('DELETE /tasks/:id returns 404 when nothing was deleted', async () => {
    const pool = makePool(() => ({ rowCount: 0 }));
    const app = createApp({ pool, broadcaster });

    const res = await request(app).delete('/tasks/missing');
    expect(res.status).toBe(404);
    expect(events).toHaveLength(0);
  });
});