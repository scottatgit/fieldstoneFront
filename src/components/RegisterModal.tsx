"use client";

import React, { useState } from 'react';
import { useAppDispatch } from '../redux/hooks';
import { setAuth } from '../redux/slices/authSlice';
import axiosInstance from '../shared/lib/axiosConfig';
import { useRouter } from 'next/navigation'; // For redirection
import { setFlashMessage } from '../redux/slices/flashMessageSlice'; // For flash messages
import { Box, Button, Input, Text } from "@chakra-ui/react";

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RegisterResponseData {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'moderator' | 'admin';
  token: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'moderator' | 'admin';
}

const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerError, setRegisterError] = useState('');

  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await axiosInstance.post<RegisterResponseData>('/api/users/register', {
        name,
        email,
        password,
      });

      const { token, _id, name: userName, email: userEmail, role } = response.data;

      const userData: UserData = {
        id: _id,
        name: userName,
        email: userEmail,
        role,
      };

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      dispatch(setAuth({ user: userData, token }));
      dispatch(setFlashMessage(`Welcome to Kreation Nation, ${userData.name}!`));

      onClose();  // Close the modal

      // Redirect to First Steps page
      router.push('/first-steps');
    } catch (error: unknown) {
      console.error('Error during registration:', error);    }
  };

  if (!isOpen) return null;

  return (
    <Box className="modal-overlay">
      <Box className="modal-content">
        <Text fontSize="2xl" fontWeight="bold" mb={4}>Register</Text>
        {registerError && <Text color="red.500">{registerError}</Text>}
        <form onSubmit={handleRegister}>
          <Input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            mb={3}
          />
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            mb={3}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            mb={3}
          />
          <Button type="submit" colorScheme="blue" w="full">Register</Button>
        </form>

        <Button onClick={onClose} mt={3} colorScheme="gray">
          Close
        </Button>
      </Box>
    </Box>
  );
};

export default RegisterModal;
