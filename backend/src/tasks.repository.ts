/*
* This whole file really should be an ORM layer.
* Queries in heredocs is bad
* There's really no robust data coupling between the DB and our backend
* As such we maintain this constant list of "RETURNING" data to guarantee
* we're loading the whole object from the DB after every action...fine for a demo I suppose but yea..big shoutout here
*/
import type { Pool } from 'pg';
import type { Task, TaskStatus } from './types.js';

// Columns selected everywhere, kept in one place so the shape stays consistent.
const RETURNING = `
  id, task_number, title, description, status,
  created_at, updated_at
`;

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  status?: TaskStatus;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
}

export async function listTasks(pool: Pool): Promise<Task[]> {
  const { rows } = await pool.query<Task>(
    `SELECT ${RETURNING} FROM tasks ORDER BY task_number ASC`,
  );
  return rows;
}

export async function createTask(
  pool: Pool,
  input: CreateTaskInput,
): Promise<Task> {
  const { rows } = await pool.query<Task>(
    `INSERT INTO tasks (title, description, status)
     VALUES ($1, $2, $3)
     RETURNING ${RETURNING}`,
    [input.title, input.description ?? null, input.status ?? 'todo'],
  );
  return rows[0];
}

/**
 * Update only the fields provided. Builds the SET clause dynamically so a
 * PATCH with just `{ status }` doesn't clobber title/description.
 * Returns null if no row matched the id.
 */
export async function updateTask(
  pool: Pool,
  id: string,
  input: UpdateTaskInput,
): Promise<Task | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (input.title !== undefined) {
    sets.push(`title = $${i++}`);
    values.push(input.title);
  }
  if (input.description !== undefined) {
    sets.push(`description = $${i++}`);
    values.push(input.description);
  }
  if (input.status !== undefined) {
    sets.push(`status = $${i++}`);
    values.push(input.status);
  }

  // Nothing to update: just return the current row.
  if (sets.length === 0) {
    return getTask(pool, id);
  }

  sets.push(`updated_at = now()`);
  values.push(id);

  const { rows } = await pool.query<Task>(
    `UPDATE tasks SET ${sets.join(', ')}
     WHERE id = $${i}
     RETURNING ${RETURNING}`,
    values,
  );
  return rows[0] ?? null;
}

export async function getTask(pool: Pool, id: string): Promise<Task | null> {
  const { rows } = await pool.query<Task>(
    `SELECT ${RETURNING} FROM tasks WHERE id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

/** Returns true if a row was deleted, false if the id didn't exist. */
export async function deleteTask(pool: Pool, id: string): Promise<boolean> {
  const { rowCount } = await pool.query(`DELETE FROM tasks WHERE id = $1`, [id]);
  return (rowCount ?? 0) > 0;
}