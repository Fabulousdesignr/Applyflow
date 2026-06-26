import React, { useState } from 'react';
import { Mail, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase, isSupabaseAuthConfigured, getAuthRedirectUrl } from '../lib/supabase';

export default function AuthScreen() {
  const [tab, setTab] = useState('signup');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSendMagicLink = async (e) => {
    e.preventDefault();
    setError('');
    setSent(false);

    const trimmed = email.trim();
    if (!trimmed) {
      setError('Enter your email address.');
      return;
    }

    if (!isSupabaseAuthConfigured()) {
      setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local.');
      return;
    }

    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo: getAuthRedirectUrl(),
        },
      });

      if (authError) {
        setError(authError.message);
      } else {
        setSent(true);
      }
    } catch (err) {
      setError(err.message || 'Could not send magic link. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">
          <img
            src="/logo-full.svg"
            alt="Applyflow"
            style={{ height: '36px', width: 'auto', display: 'block', margin: '0 auto' }}
          />
        </div>

        <p className="auth-subtitle">
          {tab === 'signup'
            ? 'Create your account with a secure email link.'
            : 'Sign in with a secure email link.'}
        </p>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${tab === 'signup' ? 'active' : ''}`}
            onClick={() => {
              setTab('signup');
              setSent(false);
              setError('');
            }}
          >
            Sign Up
          </button>
          <button
            type="button"
            className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => {
              setTab('login');
              setSent(false);
              setError('');
            }}
          >
            Login
          </button>
        </div>

        <form onSubmit={handleSendMagicLink} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="auth-email">
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? (
              <Loader2 size={14} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Mail size={14} />
            )}
            <span>Send Magic Link</span>
          </button>
        </form>

        {sent && (
          <div className="auth-message auth-message-success">
            <CheckCircle2 size={16} />
            <div>
              <strong>Check your email</strong>
              <p>We sent a secure login link to {email.trim()}. Click it to continue.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="auth-message auth-message-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {!sent && !error && (
          <p className="auth-hint">Check your email for a secure login link.</p>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
