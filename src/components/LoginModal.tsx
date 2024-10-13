"use client";
import React, { useState } from 'react';
import { useAppDispatch } from '../redux/hooks';
import { loginUser, verifyCaptcha } from '../redux/actions/authActions';
import ReCAPTCHA from 'react-google-recaptcha'; // Import ReCAPTCHA component

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface KeystrokeData {
  key: string;
  time: number;
  timeSinceLastKey: number;
}

interface MouseMovementData {
  x: number;
  y: number;
  timestamp: number;
}

interface LoginErrorResponse {
  response?: {
    data: {
      message: string;
    };
  };
  message: string;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keystrokeData, setKeystrokeData] = useState<KeystrokeData[]>([]);
  const [mouseMovementData, setMouseMovementData] = useState<MouseMovementData[]>([]);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaValue, setCaptchaValue] = useState('');
  const [loginError, setLoginError] = useState('');

  const dispatch = useAppDispatch();
  let lastKeystrokeTime = 0;

  // Handle keystrokes and log timing
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const currentTime = performance.now();
    const keyData: KeystrokeData = {
      key: e.key,
      time: currentTime,
      timeSinceLastKey: lastKeystrokeTime ? currentTime - lastKeystrokeTime : 0,
    };
    lastKeystrokeTime = currentTime;
    setKeystrokeData((prevData) => [...prevData, keyData]);  // Using callback for state update
  };

  // Handle mouse movements
  const handleMouseMove = (e: React.MouseEvent) => {
    const mouseData: MouseMovementData = {
      x: e.clientX,
      y: e.clientY,
      timestamp: performance.now(),
    };
    setMouseMovementData((prevData) => [...prevData, mouseData]);
  };

  // Handle CAPTCHA change
  const handleCaptchaChange = (value: string | null) => {
    setCaptchaValue(value || '');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
  
    const loginData = {
      email,
      password,
      behaviorData: {
        keystrokeData: keystrokeData as unknown as Record<string, unknown>[],
        mouseMovementData: mouseMovementData as unknown as Record<string, unknown>[],
      },
    };
  
    try {
      const loginResult = await dispatch(loginUser(loginData));
  
      console.log('Login result:', loginResult);  // Log the entire result for debugging
  
      // If CAPTCHA is required, set showCaptcha to true
      if (loginResult.requiresCaptcha) {
        setShowCaptcha(true);
        console.log('CAPTCHA required, showing CAPTCHA');  // Log to ensure state change
      } else {
        localStorage.setItem('token', loginResult.token); // Store token for future requests
        onClose(); // Close modal after successful login
      }
    } catch (error) {
      const loginErrorData = error as LoginErrorResponse;
      setLoginError(
        loginErrorData?.response?.data?.message || 'Login failed. Please try again.'
      );
    }
  };
  


  // Handle CAPTCHA verification
  const verifyCaptchaToken = async () => {
    try {
      const captchaVerified = await verifyCaptcha(captchaValue);
      if (captchaVerified) {
        console.log('CAPTCHA verified successfully');
      } else {
        setLoginError('CAPTCHA verification failed.');
      }
    } catch (error) {
      console.error('Error verifying CAPTCHA:', error);
      setLoginError('Error verifying CAPTCHA.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onMouseMove={handleMouseMove}>
      <div className="modal-content">
        <h2>Login</h2>
        {loginError && <p style={{ color: 'red' }}>{loginError}</p>}
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={handleKeyPress}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            required
          />
          <button type="submit">Login</button>
        </form>

        {showCaptcha && (
          <div>
            <ReCAPTCHA
              sitekey="6Lc5IEoqAAAAANZclZl_dvvNy2S6yXU2k9_VK8rO" // Replace with your site key
              onChange={handleCaptchaChange}
            />
            <button onClick={verifyCaptchaToken}>Verify CAPTCHA</button>
          </div>
        )}

        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default LoginModal;
