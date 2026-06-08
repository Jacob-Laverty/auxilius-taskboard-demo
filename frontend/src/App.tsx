import { useState } from 'react';
import { Login } from './Login';

function App() {
  const [username, setUsername] = useState<string | null>(() =>
    localStorage.getItem('username'),
  );

  if (!username) {
    return (
      <Login
        onSubmit={(name) => {
          localStorage.setItem('username', name);
          setUsername(name);
        }}
      />
    );
  }

  return (
    <div>
      <header>
        <h1>Task Board</h1>
        <span>Signed in as {username}</span>
      </header>
      {/* Board (three columns) lands here next iteration. */}
    </div>
  );
}

export default App;