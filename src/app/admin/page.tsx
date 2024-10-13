'use client';

import AdminRoute from '../../components/AdminRoute';
import { Box, Heading, Text, Button } from '@chakra-ui/react';
import UserList from '../../components/admin/UserList';
import { useState } from 'react';
import RegisterModal from '../../components/RegisterModal'; // Reuse RegisterModal

const AdminDashboard = () => {
  const [isRegisterOpen, setRegisterOpen] = useState(false);

  return (
    <AdminRoute>
      <Box p={4}>
        <Heading as="h1" size="xl" mb={4}>
          Admin Dashboard
        </Heading>
        <Text mb={4}>
          Welcome to the admin dashboard. Here you can manage users and content.
        </Text>

        {/* User Management Section */}
        <Heading as="h2" size="lg" mb={4}>
          User Management
        </Heading>

        {/* Add User Button */}
        <Button colorScheme="blue" mb={4} onClick={() => setRegisterOpen(true)}>
          Add User
        </Button>

        <UserList />

        {/* Reuse RegisterModal for adding users */}
        <RegisterModal
          isOpen={isRegisterOpen}
          onClose={() => setRegisterOpen(false)}
        />
      </Box>
    </AdminRoute>
  );
};

export default AdminDashboard;
