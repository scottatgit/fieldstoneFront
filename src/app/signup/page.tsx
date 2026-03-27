/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Turnstile } from '@marsidev/react-turnstile';
import { clearUserCache } from '@/lib/useUser';

const SIGNAL_DOMAIN = process.env.NEXT_PUBLIC_SIGNAL_DOMAIN || 'signal.fieldstone.pro';
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

export default function SignUpPage() {
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [cfToken, setCfToken] = useState('');

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (!cfToken) { setError('Please complete the human verification below.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, cf_turnstile_token: cfToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msgs: Record<string, string> = {
          email_taken:    'An account with that email already exists.',
          captcha_failed: 'Human verification failed. Please try again.',
          email_failed:   'Could not send verification email. Please try again later.',
        };
        setError(msgs[data.detail] || data.detail || 'Signup failed. Please try again.');
        setCfToken(''); // reset captcha on failure
        return;
      }
      clearUserCache();
      // Phase 9: Redirect to verify-pending with email param
      const email = encodeURIComponent(data.email || form.email);
      const _invite = new URLSearchParams(window.location.search).get('invite');
      const dest = _invite
        ? `https://${SIGNAL_DOMAIN}/verify-pending?email=${email}&invite=${_invite}`
        : `https://${SIGNAL_DOMAIN}/verify-pending?email=${email}`;
      window.location.href = dest;
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#1f2937', border: '1px solid #374151',
    borderRadius: '6px', padding: '10px 12px', color: '#fff',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', color: '#9ca3af', fontSize: '11px',
    fontFamily: 'monospace', marginBottom: '6px', letterSpacing: '0.1em',
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#0d1117', gap: '24px', padding: '20px',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: '13px', fontWeight: '900', fontFamily: 'monospace', letterSpacing: '0.2em', color: '#63B3ED' }}>SIGNAL</span>
        </Link>
        <p style={{ color: '#4a5568', fontSize: '12px', fontFamily: 'monospace', marginTop: '4px', letterSpacing: '0.1em' }}>by Fieldstone</p>
      </div>

      <form onSubmit={handleSubmit} style={{
        background: '#111827', border: '1px solid #1f2937', borderRadius: '8px',
        padding: '32px', width: '100%', maxWidth: '400px',
        boxShadow: '0 0 40px rgba(99,179,237,0.06)',
        display: 'flex', flexDirection: 'column', gap: '14px',
      }}>
        <p style={{ color: '#9ca3af', fontFamily: 'monospace', fontSize: '11px', margin: 0, letterSpacing: '0.05em' }}>CREATE YOUR ACCOUNT</p>
        <div><label style={labelStyle}>YOUR NAME</label><input required style={inputStyle} value={form.name} onChange={set('name')} placeholder="Full name" /></div>
        <div><label style={labelStyle}>EMAIL</label><input type="email" required autoComplete="email" style={inputStyle} value={form.email} onChange={set('email')} placeholder="you@company.com" /></div>
        <div><label style={labelStyle}>PASSWORD</label><input type="password" required autoComplete="new-password" minLength={8} style={inputStyle} value={form.password} onChange={set('password')} placeholder="Min. 8 characters" /></div>

        {/* Cloudflare Turnstile CAPTCHA */}
        {TURNSTILE_SITE_KEY && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Turnstile
              siteKey={TURNSTILE_SITE_KEY}
              onSuccess={setCfToken}
              onError={() => { setCfToken(''); setError('CAPTCHA error. Please refresh and try again.'); }}
              onExpire={() => setCfToken('')}
            />
          </div>
        )}

        {error && <p style={{ color: '#fc8181', fontSize: '12px', fontFamily: 'monospace', margin: 0 }}>{error}</p>}
        <button
          type="submit"
          disabled={loading || (TURNSTILE_SITE_KEY !== '' && !cfToken)}
          style={{
            background: (loading || (TURNSTILE_SITE_KEY !== '' && !cfToken)) ? '#2d3748' : '#4299e1',
            color: '#fff', border: 'none',
            borderRadius: '6px', padding: '11px', fontSize: '13px', fontFamily: 'monospace',
            fontWeight: '700', letterSpacing: '0.1em',
            cursor: (loading || (TURNSTILE_SITE_KEY !== '' && !cfToken)) ? 'not-allowed' : 'pointer',
          }}
        >{loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}</button>
        <p style={{ textAlign: 'center', color: '#4a5568', fontSize: '11px', fontFamily: 'monospace', margin: 0 }}>
          Already have an account? <Link href="/login" style={{ color: '#63B3ED', textDecoration: 'none' }}>Sign in</Link>
        </p>
      </form>

      <p style={{ color: '#4a5568', fontSize: '13px', fontFamily: 'monospace' }}>
        <Link href="/" style={{ color: '#4a5568', textDecoration: 'none' }}>← back to fieldstone.pro</Link>
      </p>
    </div>
  );
}
