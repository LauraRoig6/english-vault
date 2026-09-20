import React, { useState } from 'react';
import { LockKeyhole, Mail, Sparkles } from 'lucide-react';
import { signIn, signUp } from '../lib/supabase';

export default function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      if (mode === 'signin') {
        const session = await signIn(email.trim(), password);
        if (!session) throw new Error('Could not start your session.');
        onAuthenticated(session);
      } else {
        const result = await signUp(email.trim(), password);
        if (result.session) {
          onAuthenticated(result.session);
        } else {
          setMessage('Account created. Check your email to confirm it, then come back and sign in.');
          setMode('signin');
        }
      }
    } catch (err) {
      setError(err?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px', background: '#fff8fb' }}>
      <div style={{ width: '100%', maxWidth: 430, background: '#fff', border: '1px solid #f2dfe8', borderRadius: 28, padding: 28, boxShadow: '0 18px 55px rgba(80,45,63,.10)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Sparkles size={22} />
          <strong style={{ fontSize: 28, fontFamily: 'Fraunces, Georgia, serif' }}>English Vault</strong>
        </div>
        <p style={{ margin: '0 0 24px', color: '#765f6b' }}>Sign in to keep the same vault on your phone and computer.</p>

        <form onSubmit={submit}>
          <label style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>Email</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #e6d7df', borderRadius: 14, padding: '0 12px', marginBottom: 16 }}>
            <Mail size={18} />
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={{ flex: 1, border: 0, outline: 0, padding: '13px 0', font: 'inherit', background: 'transparent' }} />
          </div>

          <label style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>Password</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #e6d7df', borderRadius: 14, padding: '0 12px', marginBottom: 16 }}>
            <LockKeyhole size={18} />
            <input required minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" style={{ flex: 1, border: 0, outline: 0, padding: '13px 0', font: 'inherit', background: 'transparent' }} />
          </div>

          {error && <div style={{ padding: '10px 12px', marginBottom: 14, borderRadius: 12, background: '#fff0f2', color: '#9c2944', fontSize: 14 }}>{error}</div>}
          {message && <div style={{ padding: '10px 12px', marginBottom: 14, borderRadius: 12, background: '#f2fbf5', color: '#2f6841', fontSize: 14 }}>{message}</div>}

          <button className="primary-btn" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', minHeight: 46 }}>
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <button type="button" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setMessage(''); }} style={{ width: '100%', marginTop: 14, border: 0, background: 'transparent', cursor: 'pointer', color: '#8c536f', fontWeight: 700 }}>
          {mode === 'signin' ? 'First time here? Create an account' : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}
