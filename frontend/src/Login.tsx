import { useState } from 'react';

interface LoginProps {
  onSubmit: (username: string) => void;
}

export function Login({ onSubmit }: LoginProps) {
  const [value, setValue] = useState('');
  const trimmed = value.trim();

  return (
    <div>
      <h1>Welcome</h1>
      <label htmlFor="username">Enter a username to continue</label>
      <input
        id="username"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="e.g. jake"
      />
      <button
        type="button"
        disabled={trimmed.length === 0}
        onClick={() => onSubmit(trimmed)}
      >
        Continue
      </button>
    </div>
  );
}