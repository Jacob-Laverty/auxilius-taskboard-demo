import { useState } from 'react';
import type { Task } from './types';
import { TASK_STATUSES } from './types';
import { taskState } from './taskState';
import * as api from './api';
import { BoardColumn } from './BoardColumn';
import { CreateTaskForm } from './CreateTaskForm';

export function Board() {
  const { tasks, loading, error, recentlyChanged, connected } = taskState();
  const [actionError, setActionError] = useState<string | null>(null);

  // Mutations fire-and-forget over REST; the server's socket echo updates
  // local state, so we don't touch `tasks` directly here.
  function handleCreate(title: string, description: string | null) {
    api
      .createTask({ title, description })
      .catch((e) => setActionError(e.message));
  }

  function handleUpdate(
    id: string,
    body: Partial<Pick<Task, 'title' | 'description' | 'status'>>,
  ) {
    api.updateTask(id, body).catch((e) => setActionError(e.message));
  }

  function handleDelete(id: string) {
    api.deleteTask(id).catch((e) => setActionError(e.message));
  }

  return (
    <div className="board-wrapper">
      <CreateTaskForm onCreate={handleCreate} />

      <div className="status-line">
        <span className={connected ? 'dot connected' : 'dot'} />
        {connected ? 'Live' : 'Connecting…'}
      </div>

      {actionError && (
        <div className="error" role="alert">
          {actionError}{' '}
          <button type="button" onClick={() => setActionError(null)}>
            dismiss
          </button>
        </div>
      )}

      {loading && <p>Loading tasks…</p>}
      {error && <p className="error">Could not load tasks: {error}</p>}

      {!loading && !error && (
        <div className="board">
          {TASK_STATUSES.map((status) => (
            <BoardColumn
              key={status}
              status={status}
              tasks={tasks.filter((t) => t.status === status)}
              recentlyChanged={recentlyChanged}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}