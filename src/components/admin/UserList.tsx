// src/components/admin/UserList.tsx

'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Box,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { fetchUsers, updateUser, deleteUser, User } from '../../api/adminApi';
import EditUserModal from './EditUserModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';

const UserList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditOpen, setEditOpen] = useState<boolean>(false);
  const [isDeleteOpen, setDeleteOpen] = useState<boolean>(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await fetchUsers();
      setUsers(data); // Now 'data' is of type 'User[]'
    } catch (err) {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditOpen(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setDeleteOpen(true);
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      const data = await updateUser(updatedUser._id, updatedUser);
      setUsers((prevUsers) =>
        prevUsers.map((user) => (user._id === updatedUser._id ? data : user))
      );
      setEditOpen(false);
    } catch (err) {
      setError('Failed to update user.');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      await deleteUser(selectedUser._id);
      setUsers((prevUsers) => prevUsers.filter((user) => user._id !== selectedUser._id));
      setDeleteOpen(false);
    } catch (err) {
      setError('Failed to delete user.');
    }
  };

  if (loading) {
    return (
      <Box textAlign="center" mt={10}>
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error" mt={10}>
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  return (
    <Box mt={5}>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>Role</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {users.map((user) => (
            <Tr key={user._id}>
              <Td>{user.name}</Td>
              <Td>{user.email}</Td>
              <Td>{user.role}</Td>
              <Td>
                <Button size="sm" onClick={() => handleEdit(user)} mr={2}>
                  Edit
                </Button>
                <Button size="sm" colorScheme="red" onClick={() => handleDelete(user)}>
                  Delete
                </Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      {/* Edit User Modal */}
      {selectedUser && (
        <EditUserModal
          isOpen={isEditOpen}
          onClose={() => setEditOpen(false)}
          user={selectedUser}
          onSave={handleUpdateUser}
        />
      )}

      {/* Confirm Delete Modal */}
      {selectedUser && (
        <ConfirmDeleteModal
          isOpen={isDeleteOpen}
          onClose={() => setDeleteOpen(false)}
          userName={selectedUser.name}
          onConfirm={handleDeleteUser}
        />
      )}
    </Box>
  );
};

export default UserList;
