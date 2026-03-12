'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { clearUserCache } from '@/lib/useUser';

const BASE_DOMAIN   = process.env.NEXT_PUBLIC_BASE_DOMAIN   || 'fieldstone.pro';
const SIGNAL_DOMAIN = process.env.NEXT_PUBLIC_SIGNAL_DOMAIN || ('signal.' + BASE_DOMAIN);

/** If running on a tenant subdomain, return the slug; else null. */
function getTenantHint(): string | null {
  if (typeof window === 'undefined') return null;
  const hostname = window.location.hostname;
  if (!hostname.endsWith('.' + SIGNAL_DOMAIN)) return null;
  const slug = hostname.split('.')[0];
  const reserved = new Set(['www', 'app', 'admin', 'demo', 'api', 'signal', 'static']);
  return reserved.has(slug) ? null : slug;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [tenantHint, setHint]   = useState<string | null>(null);

  useEffect(() => { setHint(getTenantHint()); }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail === 'invalid_credentials'
          ? 'Invalid email or password.'  
          : data.detail || 'Login failed. Please try again.');
        return;
      }
      clearUserCache();
      // Redirect to workspace or /redirect
      if (data.slug) {
        const proto = window.location.protocol;
        window.location.href = `${proto}//${data.slug}.${SIGNAL_DOMAIN}/pm`;
      } else {
        router.push('/redirect');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#0d1117', gap: '24px', padding: '20px',
    }}>
      {/* Brand header */}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{
            fontSize: '13px', fontWeight: '900', fontFamily: 'monospace',
            letterSpacing: '0.2em', color: '#63B3ED',
          }}>SIGNAL</span>
        </Link>
        <p style={{ color: '#4a5568', fontSize: '12px', fontFamily: 'monospace', marginTop: '4px', letterSpacing: '0.1em' }}>
          by Fieldstone
        </p>
        {tenantHint && (
          <p style={{ color: '#63B3ED', fontSize: '11px', fontFamily: 'monospace', marginTop: '4px', opacity: 0.8 }}>
            Signing in to <strong style={{ textTransform: 'uppercase' }}>{tenantHint}</strong> workspace
          </p>
        )}
      </div>

      {/* Login card */}
      <form onSubmit={handleSubmit} style={{
        background: '#111827', border: '1px solid #1f2937',
        borderRadius: '8px', padding: '32px', width: '100%', maxWidth: '380px',
        boxShadow: '0 0 40px rgba(99,179,237,0.06)',
        display: 'flex', flexDirection: 'column', gap: '16px',
      }}>
        <div>
          <label style={{ display: 'block', color: '#9ca3af', fontSize: '11px', fontFamily: 'monospace', marginBottom: '6px', letterSpacing: '0.1em' }}>EMAIL</label>
          <input
            type="email" required autoComplete="email" value={email}
            onChange={e => setEmail(e.target.value)}
            style={{
              width: '100%', background: '#1f2937', border: '1px solid #374151',
              borderRadius: '6px', padding: '10px 12px', color: '#fff',
              fontSize: '14px', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', color: '#9ca3af', fontSize: '11px', fontFamily: 'monospace', marginBottom: '6px', letterSpacing: '0.1em' }}>PASSWORD</label>
          <input
            type="password" required autoComplete="current-password" value={password}
            onChange={e => setPassword(e.target.value)}
            style={{
              width: '100%', background: '#1f2937', border: '1px solid #374151',
              borderRadius: '6px', padding: '10px 12px', color: '#fff',
              fontSize: '14px', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        {error && (
          <p style={{ color: '#fc8181', fontSize: '12px', fontFamily: 'monospace', margin: 0 }}>{error}</p>
        )}
        <button
          type="submit" disabled={loading}
          style={{
            background: loading ? '#2d3748' : '#4299e1', color: '#fff',
            border: 'none', borderRadius: '6px', padding: '11px',
            fontSize: '13px', fontFamily: 'monospace', fontWeight: '700',
            letterSpacing: '0.1em', cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
          }}
        >
          {loading ? 'SIGNING IN...' : 'SIGN IN'}
        </button>
        <p style={{ textAlign: 'center', color: '#4a5568', fontSize: '11px', fontFamily: 'monospace', margin: 0 }}>
          <Link href="/signup" style={{ color: '#63B3ED', textDecoration: 'none' }}>Create account</Link>
          {' · '}
          <Link href="/forgot-password" style={{ color: '#4a5568', textDecoration: 'none' }}>Forgot password?</Link>
        </p>
      </form>

      <p style={{ color: '#4a5568', fontSize: '13px', fontFamily: 'monospace' }}>
        <Link href="/" style={{ color: '#4a5568', textDecoration: 'none' }}>← back to fieldstone.pro</Link>
      </p>
    </div>
  );
}
