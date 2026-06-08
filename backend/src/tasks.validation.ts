import { TASK_STATUSES, type TaskStatus } from './types.js';
import type { CreateTaskInput, UpdateTaskInput } from './tasks.repository.js';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

function isStatus(value: unknown): value is TaskStatus {
  return typeof value === 'string' && (TASK_STATUSES as string[]).includes(value);
}

function asTitle(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ValidationError('title is required and must be a non-empty string');
  }
  if (value.length > 200) {
    throw new ValidationError('title must be 200 characters or fewer');
  }
  return value.trim();
}

function asDescription(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') {
    throw new ValidationError('description must be a string');
  }
  return value;
}

export function parseCreate(body: unknown): CreateTaskInput {
  const b = (body ?? {}) as Record<string, unknown>;

  if (b.status !== undefined && !isStatus(b.status)) {
    throw new ValidationError(
      `status must be one of: ${TASK_STATUSES.join(', ')}`,
    );
  }

  return {
    title: asTitle(b.title),
    description: asDescription(b.description),
    status: b.status as TaskStatus | undefined,
  };
}

export function parseUpdate(body: unknown): UpdateTaskInput {
  const b = (body ?? {}) as Record<string, unknown>;
  const out: UpdateTaskInput = {};

  if (b.title !== undefined) out.title = asTitle(b.title);
  if (b.description !== undefined) out.description = asDescription(b.description);
  if (b.status !== undefined) {
    if (!isStatus(b.status)) {
      throw new ValidationError(
        `status must be one of: ${TASK_STATUSES.join(', ')}`,
      );
    }
    out.status = b.status;
  }

  return out;
}