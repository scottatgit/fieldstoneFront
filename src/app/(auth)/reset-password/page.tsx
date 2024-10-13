// app/(auth)/reset-password/ResetPasswordForm.tsx

'use client'; // Use this for client-side component with the App Router

import { useState } from 'react';
import axios from '../../../shared/lib/axiosConfig';

const ResetPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    
    try {
      await axios.post('/api/request-password-reset', { email });
      setMessage('Check your email for reset instructions');
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
      />
      <button type="submit">Reset Password</button>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
};

export default ResetPasswordForm;
