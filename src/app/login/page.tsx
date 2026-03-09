import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0d1117',
      gap: '24px',
      padding: '20px',
    }}>
      {/* Brand header */}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{
            fontSize: '13px', fontWeight: '900', fontFamily: 'monospace',
            letterSpacing: '0.2em', color: '#63B3ED',
          }}>
            SIGNAL
          </span>
        </Link>
        <p style={{
          color: '#4a5568', fontSize: '12px', fontFamily: 'monospace',
          marginTop: '4px', letterSpacing: '0.1em',
        }}>
          by Fieldstone
        </p>
      </div>

      <SignIn
        signUpUrl="/signup"
        fallbackRedirectUrl="/pm"
        appearance={{
          variables: {
            colorBackground: '#111827',
            colorText: '#ffffff',
            colorPrimary: '#4299e1',
            colorInputBackground: '#1f2937',
            colorInputText: '#ffffff',
            borderRadius: '8px',
          },
          elements: {
            card: { border: '1px solid #1f2937', boxShadow: '0 0 40px rgba(99,179,237,0.06)' },
          },
        }}
      />

      <p style={{ color: '#4a5568', fontSize: '13px', fontFamily: 'monospace' }}>
        <Link href="/" style={{ color: '#4a5568', textDecoration: 'none' }}>
          ← back to fieldstone.pro
        </Link>
      </p>
    </div>
  );
}
