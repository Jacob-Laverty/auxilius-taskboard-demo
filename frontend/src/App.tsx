import { useState } from 'react';
import { Login } from './Login';
import { Board } from './Board';

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
    <div className="app">
      <header className="app-header">
        <h1>Task Board</h1>
        <span className="signed-in">Signed in as {username}</span>
      </header>
      <Board />
    </div>
  );
}

export default App;