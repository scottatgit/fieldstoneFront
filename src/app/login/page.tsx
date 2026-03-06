import { SignIn } from '@clerk/nextjs';

export default function LoginPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0f1117',
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
    </div>
  );
}
