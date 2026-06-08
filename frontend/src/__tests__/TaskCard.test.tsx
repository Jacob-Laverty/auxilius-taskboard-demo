import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskCard } from '../TaskCard';
import type { Task } from '../types';

const task: Task = {
  id: 'abc',
  task_number: 7,
  title: 'Write tests',
  description: 'cover the card',
  status: 'todo',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

describe('TaskCard', () => {
  it('shows the legible task id and title', () => {
    render(
      <TaskCard task={task} flashing={false} onUpdate={() => {}} onDelete={() => {}} />,
    );
    expect(screen.getByText('TASK-7')).toBeInTheDocument();
    expect(screen.getByText('Write tests')).toBeInTheDocument();
  });

  it('emits a status update when the dropdown changes', async () => {
    const onUpdate = vi.fn();
    render(
      <TaskCard task={task} flashing={false} onUpdate={onUpdate} onDelete={() => {}} />,
    );
    await userEvent.selectOptions(screen.getByLabelText('status'), 'in_progress');
    expect(onUpdate).toHaveBeenCalledWith('abc', { status: 'in_progress' });
  });

  it('edits title and description', async () => {
    const onUpdate = vi.fn();
    render(
      <TaskCard task={task} flashing={false} onUpdate={onUpdate} onDelete={() => {}} />,
    );
    await userEvent.click(screen.getByRole('button', { name: /edit/i }));

    const titleInput = screen.getByLabelText('edit title');
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'Updated title');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(onUpdate).toHaveBeenCalledWith('abc', {
      title: 'Updated title',
      description: 'cover the card',
    });
  });

  it('applies the flash class when flashing', () => {
    const { container } = render(
      <TaskCard task={task} flashing onUpdate={() => {}} onDelete={() => {}} />,
    );
    expect(container.querySelector('.task-card')).toHaveClass('flash');
  });

  it('calls onDelete', async () => {
    const onDelete = vi.fn();
    render(
      <TaskCard task={task} flashing={false} onUpdate={() => {}} onDelete={onDelete} />,
    );
    await userEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledWith('abc');
  });
});