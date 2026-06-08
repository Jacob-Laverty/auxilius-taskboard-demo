import type { Task, TaskStatus } from './types';
import { STATUS_LABELS } from './types';
import { TaskCard } from './TaskCard';

interface BoardColumnProps {
  status: TaskStatus;
  tasks: Task[];
  recentlyChanged: Set<string>;
  onUpdate: (id: string, body: Partial<Pick<Task, 'title' | 'description' | 'status'>>) => void;
  onDelete: (id: string) => void;
}

export function BoardColumn({
  status,
  tasks,
  recentlyChanged,
  onUpdate,
  onDelete,
}: BoardColumnProps) {
  return (
    <section className="column" aria-label={STATUS_LABELS[status]}>
      <h2 className="column-title">
        {STATUS_LABELS[status]} <span className="count">{tasks.length}</span>
      </h2>
      <div className="column-body">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            flashing={recentlyChanged.has(task.id)}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  );
}