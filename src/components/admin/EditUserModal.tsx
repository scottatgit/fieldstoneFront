'use client';

import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Switch,  // Add Switch for boolean fields
} from '@chakra-ui/react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  showcase: boolean;  // New field
  reviewed: boolean;  // New field
  category: string;   // New field
}

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSave: (user: User) => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, user, onSave }) => {
  const [name, setName] = useState<string>(user.name);
  const [email, setEmail] = useState<string>(user.email);
  const [role, setRole] = useState<string>(user.role);
  const [showcase, setShowcase] = useState<boolean>(user.showcase);  // Add state for new fields
  const [reviewed, setReviewed] = useState<boolean>(user.reviewed);
  const [category, setCategory] = useState<string>(user.category);

  // Update state when the 'user' prop changes
  useEffect(() => {
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setShowcase(user.showcase);  // Handle new fields
    setReviewed(user.reviewed);
    setCategory(user.category);
  }, [user]);

  const handleSave = () => {
    onSave({
      ...user,
      name,
      email,
      role,
      showcase,   // Include new fields in the save
      reviewed,
      category,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Edit User</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl id="name" mb={3}>
            <FormLabel>Name</FormLabel>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </FormControl>
          <FormControl id="email" mb={3}>
            <FormLabel>Email</FormLabel>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </FormControl>
          <FormControl id="role" mb={3}>
            <FormLabel>Role</FormLabel>
            <Select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="user">User</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
            </Select>
          </FormControl>

          {/* New fields */}
          <FormControl id="showcase" mb={3}>
            <FormLabel>Showcase</FormLabel>
            <Switch isChecked={showcase} onChange={(e) => setShowcase(e.target.checked)} />
          </FormControl>
          <FormControl id="reviewed" mb={3}>
            <FormLabel>Reviewed</FormLabel>
            <Switch isChecked={reviewed} onChange={(e) => setReviewed(e.target.checked)} />
          </FormControl>
          <FormControl id="category" mb={3}>
            <FormLabel>Category</FormLabel>
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="new">New</option>
              <option value="verified">Verified</option>
              <option value="established">Established</option>
              <option value="pro">Pro</option>
            </Select>
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button onClick={handleSave} colorScheme="blue" mr={3}>
            Save
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditUserModal;
