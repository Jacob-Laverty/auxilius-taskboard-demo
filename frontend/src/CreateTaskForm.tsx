import { useState } from 'react';

interface CreateTaskFormProps {
  onCreate: (title: string, description: string | null) => void;
}

export function CreateTaskForm({ onCreate }: CreateTaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const trimmed = title.trim();

  function submit() {
    if (trimmed.length === 0) return;
    onCreate(trimmed, description.trim() || null);
    setTitle('');
    setDescription('');
  }

  return (
    <div className="create-form">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="New task title"
        aria-label="new task title"
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
        }}
      />
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        aria-label="new task description"
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
        }}
      />
      <button type="button" disabled={trimmed.length === 0} onClick={submit}>
        Add Task
      </button>
    </div>
  );
}