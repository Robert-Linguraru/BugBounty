import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import SubmitReport from './pages/SubmitReport.jsx';

function AuthShell() {
  const { user, loading, logout } = useAuth();
  const [authView, setAuthView] = useState('login');
  const [activePage, setActivePage] = useState('dashboard');
  const [editingReport, setEditingReport] = useState(null);

  if (loading) {
    return <p style={{ padding: '2rem', fontFamily: 'sans-serif' }}>Loading session...</p>;
  }

  if (user) {
    const handleOpenNew = () => {
      setEditingReport(null);
      setActivePage('submit');
    };

    const handleOpenEdit = (report) => {
      setEditingReport(report);
      setActivePage('submit');
    };

    const handleBackToDashboard = () => {
      setEditingReport(null);
      setActivePage('dashboard');
    };

    return (
      <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 1rem', fontFamily: 'sans-serif' }}>
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '1rem',
            marginBottom: '1.5rem',
            borderBottom: '1px solid #d1d5db'
          }}
        >
          <div>
            <h1 style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem' }}>🛡️ BugBounty Platform</h1>
            <span style={{ fontSize: '0.9rem', color: '#4b5563' }}>
              Signed in as <strong>{user.username}</strong> ({user.email}) — Role:{' '}
              <code>{user.role}</code>
            </span>
          </div>

          <button
            type="button"
            onClick={logout}
            style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}
          >
            Logout
          </button>
        </header>

        {activePage === 'dashboard' ? (
          <Dashboard onNewReport={handleOpenNew} onEditReport={handleOpenEdit} />
        ) : (
          <SubmitReport
            initialReport={editingReport}
            onCancel={handleBackToDashboard}
            onSuccess={handleBackToDashboard}
          />
        )}
      </div>
    );
  }

  return authView === 'login' ? (
    <Login onSwitchToRegister={() => setAuthView('register')} />
  ) : (
    <Register onSwitchToLogin={() => setAuthView('login')} />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthShell />
    </AuthProvider>
  );
}