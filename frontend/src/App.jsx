import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

function AuthShell() {
  const { user, loading, logout } = useAuth();
  const [view, setView] = useState('login');

  if (loading) {
    return <p style={{ padding: '2rem', fontFamily: 'sans-serif' }}>Loading session...</p>;
  }

  if (user) {
    return (
      <div style={{ maxWidth: '600px', margin: '2rem auto', fontFamily: 'sans-serif' }}>
        <h1>🛡️ BugBounty Platform</h1>
        <p>
          Signed in as <strong>{user.username}</strong> ({user.email}) — Role:{' '}
          <code>{user.role}</code>
        </p>
        <button type="button" onClick={logout} style={{ padding: '0.5rem 1rem' }}>
          Logout
        </button>
      </div>
    );
  }

  return view === 'login' ? (
    <Login onSwitchToRegister={() => setView('register')} />
  ) : (
    <Register onSwitchToLogin={() => setView('login')} />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthShell />
    </AuthProvider>
  );
}