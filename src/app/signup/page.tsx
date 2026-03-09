import { SignUp } from '@clerk/nextjs';
import Link from 'next/link';

export default function SignUpPage() {
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
      <SignUp
        routing="path"
        path="/signup"
        signInUrl="/login"
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
        Already have an account?{' '}
        <Link href="/login" style={{ color: '#4299e1', textDecoration: 'underline' }}>
          Log in
        </Link>
      </p>
    </div>
  );
}
