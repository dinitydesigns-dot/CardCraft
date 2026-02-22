import { useState, useEffect } from 'react';
import { User, DemoSession } from './types';
import {
  getSession,
  logout,
  getDemoSession,
  clearDemoSession,
  initBackend,
} from './store';

import { LoginPage } from './components/LoginPage';
import { EditorPage } from './components/EditorPage';
import { AdminPage } from './components/AdminPage';
import { DemoEditorPage } from './components/DemoEditorPage';
import { SetupBanner } from './components/SetupBanner';

import ResetPassword from './ResetPassword';

type AppView = 'login' | 'editor' | 'admin' | 'demo';

export function App() {
  // handle reset password (no router)
  if (window.location.pathname === '/reset-password') {
    return <ResetPassword />;
  }

  const [user, setUser] = useState<User | null>(null);
  const [demoSession, setDemoSession] = useState<DemoSession | null>(null);
  const [view, setView] = useState<AppView>('login');
  const [loading, setLoading] = useState(true);
  const [backendMode, setBackendMode] = useState<'supabase' | 'local'>('local');
  const [showSetupBanner, setShowSetupBanner] = useState(true);

  useEffect(() => {
    async function init() {
      const mode = await initBackend();
      setBackendMode(mode);

      const session = await getSession();
      if (session) {
        setUser(session);
        setView(session.role === 'admin' ? 'admin' : 'editor');
        setLoading(false);
        return;
      }

      const demo = getDemoSession();
      if (demo && !demo.expired) {
        setDemoSession(demo);
        setView('demo');
        setLoading(false);
        return;
      }

      setLoading(false);
    }
    init();
  }, []);

  const handleLogin = (loggedInUser: User) => {
    clearDemoSession();
    setDemoSession(null);
    setUser(loggedInUser);
    setView(loggedInUser.role === 'admin' ? 'admin' : 'editor');
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setView('login');
  };

  const handleStartDemo = (session: DemoSession) => {
    setDemoSession(session);
    setView('demo');
  };

  const handleDemoSessionUpdate = (updated: DemoSession) => {
    setDemoSession(updated);
  };

  const handleExitDemo = () => {
    clearDemoSession();
    setDemoSession(null);
    setView('login');
  };

  const handleDemoSignIn = () => {
    clearDemoSession();
    setDemoSession(null);
    setView('login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-[3px] border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          <p className="text-purple-300 text-sm">Loading CardCraft…</p>
        </div>
      </div>
    );
  }

  if (view === 'demo' && demoSession) {
    return (
      <DemoEditorPage
        session={demoSession}
        onSessionUpdate={handleDemoSessionUpdate}
        onExitDemo={handleExitDemo}
        onSignIn={handleDemoSignIn}
      />
    );
  }

  if (!user || view === 'login') {
    return (
      <>
        {showSetupBanner && (
          <SetupBanner
            isConnected={backendMode === 'supabase'}
            onDismiss={() => setShowSetupBanner(false)}
          />
        )}
        <LoginPage onLogin={handleLogin} onStartDemo={handleStartDemo} />
      </>
    );
  }

  if (view === 'admin') {
    return (
      <>
        {showSetupBanner && (
          <SetupBanner
            isConnected={backendMode === 'supabase'}
            onDismiss={() => setShowSetupBanner(false)}
          />
        )}
        <AdminPage
          user={user}
          onLogout={handleLogout}
          onSwitchToEditor={() => setView('editor')}
        />
      </>
    );
  }

  return <EditorPage user={user} onLogout={handleLogout} />;
}