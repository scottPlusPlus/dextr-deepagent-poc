import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useStateWithLocalStorage } from './hooks/useStateWithLocalStorage';
import Sidebar from './Sidebar';
import ChatPage from './pages/ChatPage';
import LogPage from './pages/LogPage';
import HistoryPage from './pages/HistoryPage';
import AgentsPage from './pages/AgentsPage';
import './style.css';

function App(): JSX.Element {
  const [username, setUsername] = useStateWithLocalStorage<string>('dextr-username', '');
  const [usernameInput, setUsernameInput] = useState('');
  const signedIn = !!username;

  function handleSignIn(e: React.FormEvent): void {
    e.preventDefault();
    const name = usernameInput.trim();
    if (name) {
      setUsername(name);
    }
  }

  function handleSignOut(): void {
    setUsername('');
    setUsernameInput('');
  }

  return (
    <div className="app">
      <Sidebar
        username={username}
        usernameInput={usernameInput}
        setUsernameInput={setUsernameInput}
        signedIn={signedIn}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />
      <main className="chat-area">
        <Routes>
          <Route
            path="/"
            element={
              !signedIn ? (
                <div className="placeholder">Sign in to start chatting</div>
              ) : (
                <ChatPage username={username} />
              )
            }
          />
          <Route path="/log" element={<LogPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/agents" element={<AgentsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
