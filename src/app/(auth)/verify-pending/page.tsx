'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const SIGNAL_DOMAIN = process.env.NEXT_PUBLIC_SIGNAL_DOMAIN || 'signal.fieldstone.pro';

function VerifyPendingInner() {
  const searchParams            = useSearchParams();
  const email                   = searchParams.get('email') || '';
  const invite                  = searchParams.get('invite') || '';
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [resendError, setResendError]   = useState('');
  const pollRef                         = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll /api/auth/me every 5s — redirect when email_verified=true
  useEffect(() => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.email_verified) {
            if (pollRef.current) clearInterval(pollRef.current);
            const dest = invite
              ? `https://${SIGNAL_DOMAIN}/pm/onboarding?invite=${invite}`
              : `https://${SIGNAL_DOMAIN}/pm/onboarding`;
            window.location.href = dest;
          }
        }
      } catch {
        // ignore poll errors
      }
    }, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [invite]);

  async function handleResend() {
    setResendStatus('sending');
    setResendError('');
    try {
      const res = await fetch('/api/auth/resend-verify', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok || data.message === 'already_verified') {
        setResendStatus('sent');
      } else if (res.status === 429) {
        setResendStatus('error');
        setResendError('Please wait a few minutes before requesting another link.');
      } else {
        setResendStatus('error');
        setResendError(data.detail || 'Failed to resend. Please try again.');
      }
    } catch {
      setResendStatus('error');
      setResendError('Network error. Please check your connection.');
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#0d1117', gap: '24px', padding: '20px',
    }}>
      <div style={{
        background: '#111827', border: '1px solid #1f2937', borderRadius: '8px',
        padding: '40px 32px', width: '100%', maxWidth: '440px',
        boxShadow: '0 0 40px rgba(99,179,237,0.06)',
        display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center',
        textAlign: 'center',
      }}>
        {/* Icon */}
        <div style={{ fontSize: '48px' }}>✉️</div>

        <div>
          <p style={{ color: '#63B3ED', fontFamily: 'monospace', fontSize: '11px',
                      letterSpacing: '0.15em', margin: '0 0 12px 0' }}>SIGNAL</p>
          <h1 style={{ color: '#f7fafc', fontSize: '20px', fontWeight: '700',
                       fontFamily: 'monospace', margin: '0 0 12px 0' }}>
            Check your email
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
            We sent a verification link to{' '}
            {email
              ? <strong style={{ color: '#e2e8f0' }}>{decodeURIComponent(email)}</strong>
              : 'your email address'
            }.
            Click it to verify your account and continue setting up your workspace.
          </p>
        </div>

        {/* Polling indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4a5568', fontSize: '12px', fontFamily: 'monospace' }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%',
                         background: '#48bb78', animation: 'pulse 2s infinite' }} />
          Waiting for verification...
        </div>

        {/* Resend section */}
        <div style={{ borderTop: '1px solid #1f2937', paddingTop: '20px', width: '100%' }}>
          {resendStatus === 'sent' ? (
            <p style={{ color: '#68d391', fontSize: '13px', fontFamily: 'monospace', margin: 0 }}>
              ✓ Verification email resent!
            </p>
          ) : (
            <>
              <p style={{ color: '#4a5568', fontSize: '12px', margin: '0 0 12px 0' }}>
                Didn&apos;t receive it? Check your spam folder, or:
              </p>
              <button
                onClick={handleResend}
                disabled={resendStatus === 'sending'}
                style={{
                  background: 'transparent', color: '#63B3ED',
                  border: '1px solid #63B3ED', borderRadius: '6px',
                  padding: '8px 16px', fontSize: '12px', fontFamily: 'monospace',
                  cursor: resendStatus === 'sending' ? 'not-allowed' : 'pointer',
                  opacity: resendStatus === 'sending' ? 0.6 : 1,
                }}
              >
                {resendStatus === 'sending' ? 'Sending...' : 'Resend verification email'}
              </button>
              {resendError && (
                <p style={{ color: '#fc8181', fontSize: '12px', marginTop: '8px', margin: '8px 0 0 0' }}>
                  {resendError}
                </p>
              )}
            </>
          )}
        </div>

        <a href={`https://${SIGNAL_DOMAIN}/login`} style={{
          color: '#4a5568', fontSize: '12px', fontFamily: 'monospace', textDecoration: 'none'
        }}>
          ← Back to login
        </a>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

export default function VerifyPendingPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', background: '#0d1117' }}>
        <p style={{ color: '#4a5568', fontFamily: 'monospace' }}>Loading...</p>
      </div>
    }>
      <VerifyPendingInner />
    </Suspense>
  );
}
