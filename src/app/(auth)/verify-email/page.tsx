'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const SIGNAL_DOMAIN = process.env.NEXT_PUBLIC_SIGNAL_DOMAIN || 'signal.fieldstone.pro';

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const token        = searchParams.get('token') || '';
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('No verification token found in the link. Please check your email for the correct link.');
      return;
    }

    // Call backend verify endpoint — backend will redirect on success
    // We use fetch so we can catch errors instead of a hard redirect
    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, {
      credentials: 'include',
      redirect: 'manual', // Don't follow redirects automatically
    })
      .then(res => {
        if (res.status === 302 || res.status === 0 || res.ok) {
          // Success — redirect to onboarding
          setStatus('success');
          setTimeout(() => {
            window.location.href = `https://${SIGNAL_DOMAIN}/pm/onboarding`;
          }, 1500);
        } else {
          return res.json().then(data => {
            setStatus('error');
            setErrorMsg(
              data.detail === 'token_invalid_or_expired'
                ? 'This verification link is invalid or has expired. Please request a new one.'
                : data.detail || 'Verification failed. Please try again.'
            );
          });
        }
      })
      .catch(() => {
        // Network error — try direct navigation to backend which will redirect
        window.location.href = `/api/auth/verify-email?token=${encodeURIComponent(token)}`;
      });
  }, [token]);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0d1117', padding: '20px',
    }}>
      <div style={{
        background: '#111827', border: '1px solid #1f2937', borderRadius: '8px',
        padding: '40px 32px', width: '100%', maxWidth: '420px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center', gap: '20px',
      }}>
        <p style={{ color: '#63B3ED', fontFamily: 'monospace', fontSize: '11px',
                    letterSpacing: '0.15em', margin: 0 }}>SIGNAL</p>

        {status === 'verifying' && (
          <>
            <div style={{ fontSize: '40px' }}>⏳</div>
            <h2 style={{ color: '#f7fafc', fontFamily: 'monospace', fontSize: '18px',
                         fontWeight: '700', margin: 0 }}>Verifying...</h2>
            <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
              Confirming your email address, please wait.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ fontSize: '40px' }}>✅</div>
            <h2 style={{ color: '#68d391', fontFamily: 'monospace', fontSize: '18px',
                         fontWeight: '700', margin: 0 }}>Email Verified!</h2>
            <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
              Your email has been verified. Redirecting to workspace setup...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: '40px' }}>❌</div>
            <h2 style={{ color: '#fc8181', fontFamily: 'monospace', fontSize: '18px',
                         fontWeight: '700', margin: 0 }}>Link Invalid or Expired</h2>
            <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
              {errorMsg}
            </p>
            <a
              href={`https://${SIGNAL_DOMAIN}/verify-pending`}
              style={{
                background: '#4299e1', color: '#fff', padding: '10px 20px',
                borderRadius: '6px', textDecoration: 'none', fontSize: '13px',
                fontFamily: 'monospace', fontWeight: '700',
              }}
            >
              Request New Verification Email
            </a>
            <a href={`https://${SIGNAL_DOMAIN}/login`}
               style={{ color: '#4a5568', fontSize: '12px', textDecoration: 'none', fontFamily: 'monospace' }}>
              ← Back to login
            </a>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', background: '#0d1117' }}>
        <p style={{ color: '#4a5568', fontFamily: 'monospace' }}>Loading...</p>
      </div>
    }>
      <VerifyEmailInner />
    </Suspense>
  );
}
