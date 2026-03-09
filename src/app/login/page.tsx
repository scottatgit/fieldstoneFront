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
      background: '#0f1117',
      gap: '16px',
    }}>
      <SignIn
        appearance={{
          variables: {
            colorBackground: '#1a1d27',
            colorText: '#ffffff',
            colorPrimary: '#4299e1',
            colorInputBackground: '#2d3748',
            colorInputText: '#ffffff',
          },
        }}
      />
      <p style={{ color: '#718096', fontSize: '14px', fontFamily: 'monospace' }}>
        Don&apos;t have an account?{' '}
        <Link href="/signup" style={{ color: '#4299e1', textDecoration: 'underline' }}>
          Sign up
        </Link>
      </p>
    </div>
  );
}
