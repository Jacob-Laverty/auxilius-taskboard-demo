import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Login } from '../Login';

describe('UsernameGate', () => {
  it('disables continue until a username is entered', () => {
    render(<Login onSubmit={() => {}} />);
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
  });

  it('submits the trimmed username', async () => {
    const onSubmit = vi.fn();
    render(<Login onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/Enter a username/i), '  jake  ');
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(onSubmit).toHaveBeenCalledWith('jake');
  });
});