'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Turnstile } from '@marsidev/react-turnstile';

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

type Phase = 'form' | 'sent';

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('');
  const [phase, setPhase]     = useState<Phase>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [cfToken, setCfToken] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!cfToken) { setError('Please complete the human verification below.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), cf_turnstile_token: cfToken }),
      });
      if (res.ok || res.status === 404) {
        setPhase('sent');
      } else if (res.status === 400) {
        const data = await res.json().catch(() => ({}));
        if (data.detail === 'captcha_failed') {
          setError('Human verification failed. Please try again.');
          setCfToken('');
        } else {
          setError(data.detail || 'Something went wrong. Please try again.');
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  if (phase === 'sent') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={logoStyle}>&#x26A1; SIGNAL AI</div>
          <div style={{ fontSize: 40, marginBottom: 12 }}>&#x2709;&#xFE0F;</div>
          <h1 style={titleStyle}>Check Your Email</h1>
          <p style={subtitleStyle}>
            If an account exists for <strong style={{ color: '#ccc' }}>{email}</strong>,
            a password reset link has been sent. Check your inbox and spam folder.
          </p>
          <p style={{ marginTop: 8, fontSize: 13, color: '#555' }}>
            The link expires in <strong style={{ color: '#888' }}>2 hours</strong>.
          </p>
          <div style={{ marginTop: 28 }}>
            <Link href='/login' style={linkStyle}>&larr; Back to login</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={logoStyle}>&#x26A1; SIGNAL AI</div>
        <h1 style={titleStyle}>Forgot Password?</h1>
        <p style={subtitleStyle}>
          Enter your account email and we&apos;ll send you a reset link.
        </p>
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Email Address</label>
            <input
              type='email'
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder='your@email.com'
              required
              autoFocus
              style={inputStyle}
            />
          </div>

          {/* Cloudflare Turnstile CAPTCHA */}
          {TURNSTILE_SITE_KEY && (
            <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
              <Turnstile
                siteKey={TURNSTILE_SITE_KEY}
                onSuccess={setCfToken}
                onError={() => { setCfToken(''); setError('CAPTCHA error. Please refresh and try again.'); }}
                onExpire={() => setCfToken('')}
              />
            </div>
          )}

          {error && <div style={errorStyle}>{error}</div>}
          <button
            type='submit'
            disabled={loading || (TURNSTILE_SITE_KEY !== '' && !cfToken)}
            style={(loading || (TURNSTILE_SITE_KEY !== '' && !cfToken))
              ? { ...buttonStyle, opacity: 0.6, cursor: 'not-allowed' }
              : buttonStyle}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <p style={{ marginTop: 24, fontSize: 13, color: '#666' }}>
          <Link href='/login' style={linkStyle}>&larr; Back to login</Link>
        </p>
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  minHeight: '100vh', backgroundColor: '#0a0a0a', display: 'flex',
  alignItems: 'center', justifyContent: 'center',
  fontFamily: 'system-ui, -apple-system, sans-serif', padding: '24px',
};
const cardStyle: React.CSSProperties = {
  width: '100%', maxWidth: 400, backgroundColor: '#111',
  border: '1px solid #222', borderRadius: 12, padding: '40px 36px',
  display: 'flex', flexDirection: 'column', alignItems: 'center',
};
const logoStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 700, letterSpacing: '0.12em',
  color: '#00ff88', marginBottom: 28,
};
const titleStyle: React.CSSProperties = {
  fontSize: 22, fontWeight: 600, color: '#fff',
  marginBottom: 8, textAlign: 'center',
};
const subtitleStyle: React.CSSProperties = {
  fontSize: 14, color: '#888', marginBottom: 28,
  textAlign: 'center', lineHeight: 1.5,
};
const fieldGroupStyle: React.CSSProperties = { width: '100%', marginBottom: 16 };
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: '#aaa',
  marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', backgroundColor: '#1a1a1a',
  border: '1px solid #2a2a2a', borderRadius: 8, color: '#fff',
  fontSize: 15, outline: 'none', boxSizing: 'border-box',
};
const buttonStyle: React.CSSProperties = {
  width: '100%', padding: '12px', backgroundColor: '#00ff88',
  color: '#000', border: 'none', borderRadius: 8, fontSize: 15,
  fontWeight: 700, cursor: 'pointer', marginTop: 8,
};
const errorStyle: React.CSSProperties = {
  backgroundColor: '#2d1a1a', border: '1px solid #5a2a2a', borderRadius: 6,
  padding: '10px 14px', color: '#ff6b6b', fontSize: 13, marginBottom: 12,
  width: '100%', boxSizing: 'border-box',
};
const linkStyle: React.CSSProperties = {
  color: '#00ff88', textDecoration: 'none', fontSize: 13,
};
