'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get('token');

  const [password, setPassword]       = useState('');
  const [confirmPassword, setConfirm] = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState(false);

  if (!token) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={logoStyle}>&#x26A1; SIGNAL AI</div>
          <h1 style={titleStyle}>Invalid Reset Link</h1>
          <p style={subtitleStyle}>This reset link is missing a token. Please request a new one.</p>
          <Link href="/login" style={linkStyle}>&larr; Back to login</Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.detail === 'token_invalid_or_expired'
            ? 'This reset link has expired or already been used. Please request a new one.'
            : data.detail || 'Reset failed. Please try again.'
        );
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2500);
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={logoStyle}>&#x26A1; SIGNAL AI</div>
          <div style={{ fontSize: 48, marginBottom: 16 }}>&#x2705;</div>
          <h1 style={titleStyle}>Password Updated</h1>
          <p style={subtitleStyle}>Redirecting you to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={logoStyle}>&#x26A1; SIGNAL AI</div>
        <h1 style={titleStyle}>Reset Password</h1>
        <p style={subtitleStyle}>Enter your new password below.</p>
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>New Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters" required autoFocus style={inputStyle} />
          </div>
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Confirm New Password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat your new password" required style={inputStyle} />
          </div>
          {error && <div style={errorStyle}>{error}</div>}
          <button type="submit" disabled={loading}
            style={loading ? { ...buttonStyle, opacity: 0.6 } : buttonStyle}>
            {loading ? 'Updating...' : 'Set New Password'}
          </button>
        </form>
        <p style={{ marginTop: 24, fontSize: 13, color: '#666' }}>
          <Link href="/login" style={linkStyle}>&larr; Back to login</Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={containerStyle}><div style={cardStyle}>
        <div style={logoStyle}>&#x26A1; SIGNAL AI</div>
        <p style={subtitleStyle}>Loading...</p>
      </div></div>
    }>
      <ResetPasswordInner />
    </Suspense>
  );
}

const containerStyle: React.CSSProperties = {
  minHeight: '100vh', backgroundColor: '#0a0a0a', display: 'flex',
  alignItems: 'center', justifyContent: 'center',
  fontFamily: 'system-ui, -apple-system, sans-serif', padding: '24px',
};
const cardStyle: React.CSSProperties = {
  width: '100%', maxWidth: 400, backgroundColor: '#111', border: '1px solid #222',
  borderRadius: 12, padding: '40px 36px', display: 'flex',
  flexDirection: 'column', alignItems: 'center',
};
const logoStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', color: '#00ff88', marginBottom: 28,
};
const titleStyle: React.CSSProperties = {
  fontSize: 22, fontWeight: 600, color: '#fff', marginBottom: 8, textAlign: 'center',
};
const subtitleStyle: React.CSSProperties = {
  fontSize: 14, color: '#888', marginBottom: 28, textAlign: 'center',
};
const fieldGroupStyle: React.CSSProperties = { width: '100%', marginBottom: 16 };
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: '#aaa',
  marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', backgroundColor: '#1a1a1a',
  border: '1px solid #2a2a2a', borderRadius: 8, color: '#fff', fontSize: 15,
  outline: 'none', boxSizing: 'border-box',
};
const buttonStyle: React.CSSProperties = {
  width: '100%', padding: '12px', backgroundColor: '#00ff88', color: '#000',
  border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 8,
};
const errorStyle: React.CSSProperties = {
  backgroundColor: '#2d1a1a', border: '1px solid #5a2a2a', borderRadius: 6,
  padding: '10px 14px', color: '#ff6b6b', fontSize: 13, marginBottom: 12,
  width: '100%', boxSizing: 'border-box',
};
const linkStyle: React.CSSProperties = { color: '#00ff88', textDecoration: 'none', fontSize: 13 };
