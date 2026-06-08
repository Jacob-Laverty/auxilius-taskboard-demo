import { useState } from 'react';
import type { Task } from './types';
import { TASK_STATUSES, STATUS_LABELS, formatTaskId } from './types';

interface TaskCardProps {
  task: Task;
  flashing: boolean;
  onUpdate: (id: string, body: Partial<Pick<Task, 'title' | 'description' | 'status'>>) => void;
  onDelete: (id: string) => void;
}

export function TaskCard({ task, flashing, onUpdate, onDelete }: TaskCardProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');

  function save() {
    const trimmed = title.trim();
    if (trimmed.length === 0) return;
    onUpdate(task.id, { title: trimmed, description: description.trim() || null });
    setEditing(false);
  }

  function cancel() {
    setTitle(task.title);
    setDescription(task.description ?? '');
    setEditing(false);
  }

  return (
    <div className={`task-card${flashing ? ' flash' : ''}`}>
      <div className="task-card-header">
        <span className="task-id">{formatTaskId(task)}</span>
        <select
          value={task.status}
          onChange={(e) =>
            onUpdate(task.id, { status: e.target.value as Task['status'] })
          }
          aria-label="status"
        >
          {TASK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {editing ? (
        <div className="task-edit">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="edit title"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            aria-label="edit description"
          />
          <div className="task-actions">
            <button type="button" onClick={save}>
              Save
            </button>
            <button type="button" onClick={cancel}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="task-body">
          <h3>{task.title}</h3>
          {task.description && <p>{task.description}</p>}
          <div className="task-actions">
            <button type="button" onClick={() => setEditing(true)}>
              Edit
            </button>
            <button type="button" onClick={() => onDelete(task.id)}>
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}