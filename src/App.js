import React, { useEffect, useState } from 'react';
import './App.css';
import EnglishVault from './components/EnglishVault';
import AuthScreen from './components/AuthScreen';
import { ensureFreshSession, getStoredSession, signOut } from './lib/supabase';

function App() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const stored = getStoredSession();
      if (!stored) {
        if (active) setChecking(false);
        return;
      }
      const fresh = await ensureFreshSession(stored);
      if (active) {
        setSession(fresh);
        setChecking(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const handleSignOut = async () => {
    await signOut(session);
    setSession(null);
  };

  if (checking) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'system-ui, sans-serif' }}>Opening your vault…</div>;
  }

  if (!session) {
    return <AuthScreen onAuthenticated={setSession} />;
  }

  return <EnglishVault session={session} onSignOut={handleSignOut} />;
}

export default App;
