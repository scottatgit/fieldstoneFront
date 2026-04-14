'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { clearUserCache } from '@/lib/useUser';
import { track } from '@/lib/analytics';

const BASE_DOMAIN   = process.env.NEXT_PUBLIC_BASE_DOMAIN   || 'fieldstone.pro';
const SIGNAL_DOMAIN = process.env.NEXT_PUBLIC_SIGNAL_DOMAIN || ('signal.' + BASE_DOMAIN);

function getTenantHint(): string | null {
  if (typeof window === 'undefined') return null;
  const hostname = window.location.hostname;
  if (!hostname.endsWith('.' + SIGNAL_DOMAIN)) return null;
  const slug = hostname.split('.')[0];
  const reserved = new Set(['www', 'app', 'admin', 'demo', 'api', 'signal', 'static']);
  return reserved.has(slug) ? null : slug;
}

type Step = 'credentials' | 'totp';

export default function LoginPage() {
  const router = useRouter();

  // Credentials step
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [tenantHint, setHint]   = useState<string | null>(null);

  // TOTP step
  const [step, setStep]         = useState<Step>('credentials');
  const [mfaToken, setMfaToken] = useState('');
  const [totpCode, setTotpCode] = useState('');

  // FST-036: lost authenticator help panel
  const [showLostHelp, setShowLostHelp] = useState(false);

  // Shared
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    setHint(getTenantHint());
    track('login_viewed'); // FST-AN-001D
  }, []);

  // ── Step 1: email + password ──────────────────────────────────────────
  async function handleCredentials(e: FormEvent) {
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
        setError(
          data.detail === 'invalid_credentials'
            ? 'Invalid email or password.'
            : data.detail || 'Login failed. Please try again.'
        );
        return;
      }

      // MFA required — move to TOTP step
      if (data.mfa_required && data.mfa_token) {
        setMfaToken(data.mfa_token);
        setTotpCode('');
        setShowLostHelp(false);
        setStep('totp');
        return;
      }

      // Full session issued — redirect
      finishLogin(data);
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: TOTP or recovery code ────────────────────────────────────
  async function handleTotp(e: FormEvent) {
    e.preventDefault();
    if (!totpCode.trim()) { setError('Enter your 6-digit code or recovery code.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/totp-verify', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mfa_token: mfaToken, code: totpCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) {
          setError('Too many attempts. Please wait a moment and try again.');
        } else {
          setError('Invalid code. Try your authenticator app or a recovery code.');
        }
        return;
      }
      clearUserCache();
      finishLogin(data);
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  function finishLogin(data: { slug?: string }) {
    track('login_completed'); // FST-AN-001D
    clearUserCache();
    if (data.slug) {
      const proto = window.location.protocol;
      window.location.href = `${proto}//${data.slug}.${SIGNAL_DOMAIN}/pm`;
    } else {
      router.push('/redirect');
    }
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-8 text-center">
          <span className="text-orange-400 font-black font-mono tracking-widest text-xl">⚡ SIGNAL</span>
          {tenantHint && (
            <p className="mt-1 text-xs text-gray-500 font-mono">{tenantHint}</p>
          )}
        </div>

        {/* ── Credentials step ── */}
        {step === 'credentials' && (
          <form onSubmit={handleCredentials} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-gray-500 mb-1 tracking-wider">EMAIL</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                required autoFocus
                className="w-full rounded-lg bg-gray-900 border border-gray-700 px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 font-mono"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-gray-500 mb-1 tracking-wider">PASSWORD</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                required
                className="w-full rounded-lg bg-gray-900 border border-gray-700 px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 font-mono"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-950 border border-red-800 px-3 py-2 text-xs text-red-400 font-mono">{error}</div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full rounded-lg bg-orange-500 hover:bg-orange-400 disabled:opacity-50 px-4 py-2.5 text-sm font-black font-mono text-gray-950 tracking-wider transition-colors"
            >
              {loading ? 'SIGNING IN...' : 'SIGN IN'}
            </button>

            <div className="text-center">
              <Link href="/forgot-password" className="text-xs text-gray-600 hover:text-gray-400 font-mono transition-colors">
                Forgot password?
              </Link>
            </div>
          </form>
        )}

        {/* ── TOTP step ── */}
        {step === 'totp' && (
          <form onSubmit={handleTotp} className="space-y-4">
            <div className="rounded-lg bg-gray-900 border border-orange-900 px-4 py-3 text-center">
              <p className="text-xs text-orange-400 font-mono tracking-wider font-bold mb-1">TWO-FACTOR REQUIRED</p>
              <p className="text-xs text-gray-500 font-mono">Enter the code from your authenticator app,<br />or use a recovery code.</p>
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-500 mb-1 tracking-wider">AUTHENTICATION CODE</label>
              <input
                type="text"
                value={totpCode}
                onChange={e => setTotpCode(e.target.value.trim())}
                required autoFocus
                maxLength={20}
                placeholder="000000"
                className="w-full rounded-lg bg-gray-900 border border-gray-700 px-3 py-3 text-xl text-white placeholder-gray-700 focus:outline-none focus:border-orange-500 font-mono tracking-[0.5em] text-center"
                inputMode="numeric"
              />
              <p className="mt-1 text-xs text-gray-600 font-mono text-center">Recovery codes are longer — enter as-is</p>
            </div>

            {error && (
              <div className="rounded-lg bg-red-950 border border-red-800 px-3 py-2 text-xs text-red-400 font-mono">{error}</div>
            )}

            <button
              type="submit" disabled={loading || !totpCode.trim()}
              className="w-full rounded-lg bg-orange-500 hover:bg-orange-400 disabled:opacity-50 px-4 py-2.5 text-sm font-black font-mono text-gray-950 tracking-wider transition-colors"
            >
              {loading ? 'VERIFYING...' : 'VERIFY'}
            </button>

            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={() => { setStep('credentials'); setError(''); setTotpCode(''); setShowLostHelp(false); }}
                className="text-xs text-gray-600 hover:text-gray-400 font-mono transition-colors"
              >
                ← Back to login
              </button>

              {/* FST-036: Lost authenticator toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowLostHelp(v => !v)}
                  className="text-xs text-gray-600 hover:text-orange-400 font-mono transition-colors underline underline-offset-2"
                >
                  {showLostHelp ? 'Hide help ↑' : 'Lost authenticator?'}
                </button>
              </div>
            </div>

            {/* FST-036: Recovery guidance panel */}
            {showLostHelp && (
              <div className="rounded-lg bg-gray-900 border border-gray-700 px-4 py-4 space-y-3">
                <p className="text-xs text-gray-400 font-mono font-bold tracking-wider">RECOVERY OPTIONS</p>

                {/* Option 1: recovery code */}
                <div className="space-y-1">
                  <p className="text-xs text-orange-400 font-mono font-semibold">① Use a recovery code</p>
                  <p className="text-xs text-gray-500 font-mono leading-relaxed">
                    If you saved recovery codes when you set up MFA, enter one in the code field above.
                    Recovery codes are longer than 6 digits — paste it in exactly as saved.
                  </p>
                </div>

                <div className="border-t border-gray-800" />

                {/* Option 2: admin-assisted reset */}
                <div className="space-y-1">
                  <p className="text-xs text-orange-400 font-mono font-semibold">② Contact your workspace admin</p>
                  <p className="text-xs text-gray-500 font-mono leading-relaxed">
                    If you have no recovery codes, ask your workspace admin to reset your MFA.
                    They can do this from the <span className="text-gray-400">Team → Reset MFA</span> action.
                    After the reset you will be able to log in and re-enroll MFA.
                  </p>
                </div>

                <div className="border-t border-gray-800" />

                {/* Note: password reset does not bypass MFA */}
                <p className="text-xs text-gray-600 font-mono leading-relaxed">
                  Note: resetting your password does not disable two-factor authentication.
                </p>
              </div>
            )}

          </form>
        )}

      </div>
    </div>
  );
}
