'use client';
import { useState } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton,
  ModalBody, ModalFooter, Button, FormControl, FormLabel, Input,
  Textarea, Select, VStack, useToast, Text,
} from '@chakra-ui/react';
import { pmFetch } from '@/lib/demoApi';

const PM_API = '/pm-api';

interface NewTicketModalProps {
  isOpen:    boolean;
  onClose:   () => void;
  onCreated: () => void;
}

export function NewTicketModal({ isOpen, onClose, onCreated }: NewTicketModalProps) {
  const toast = useToast();
  const [title,      setTitle]      = useState('');
  const [priority,   setPriority]   = useState('medium');
  const [assignedTo, setAssignedTo] = useState('');
  const [situation,  setSituation]  = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => { setTitle(''); setPriority('medium'); setAssignedTo(''); setSituation(''); };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({ title: 'Title is required', status: 'warning', duration: 2500, isClosable: true });
      return;
    }
    setSubmitting(true);
    try {
      const res = await pmFetch('/api/tickets', PM_API, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          title:       title.trim(),
          priority,
          assigned_to: assignedTo.trim() || undefined,
          situation:   situation.trim()  || undefined,
          source:      'manual',
        }),
      }) as any;
      if (res?.ticket_key) {
        toast({
          title:       `Ticket ${res.ticket_key} created`,
          description: title.trim(),
          status:      'success',
          duration:    3000,
          isClosable:  true,
        });
        onCreated();
        handleClose();
      } else {
        throw new Error(res?.detail || 'Unexpected response');
      }
    } catch (e: any) {
      toast({ title: 'Failed to create ticket', description: e.message, status: 'error', duration: 4000, isClosable: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md" isCentered>
      <ModalOverlay bg="blackAlpha.700" />
      <ModalContent bg="gray.900" border="1px solid" borderColor="gray.700">
        <ModalHeader>
          <Text fontFamily="mono" fontSize="sm" color="gray.200" letterSpacing="wider">
            NEW TICKET
          </Text>
        </ModalHeader>
        <ModalCloseButton color="gray.400" />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel fontSize="xs" color="gray.400" fontFamily="mono">TITLE</FormLabel>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Describe the issue or task"
                bg="gray.800" border="1px solid" borderColor="gray.600"
                color="gray.100" fontSize="sm" _placeholder={{ color: 'gray.500' }}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
                autoFocus
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="xs" color="gray.400" fontFamily="mono">PRIORITY</FormLabel>
              <Select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                bg="gray.800" border="1px solid" borderColor="gray.600"
                color="gray.100" fontSize="sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel fontSize="xs" color="gray.400" fontFamily="mono">ASSIGN TO</FormLabel>
              <Input
                value={assignedTo}
                onChange={e => setAssignedTo(e.target.value)}
                placeholder="Technician name (optional)"
                bg="gray.800" border="1px solid" borderColor="gray.600"
                color="gray.100" fontSize="sm" _placeholder={{ color: 'gray.500' }}
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="xs" color="gray.400" fontFamily="mono">SITUATION</FormLabel>
              <Textarea
                value={situation}
                onChange={e => setSituation(e.target.value)}
                placeholder="Context, background, what's happening (optional)"
                bg="gray.800" border="1px solid" borderColor="gray.600"
                color="gray.100" fontSize="sm" _placeholder={{ color: 'gray.500' }}
                rows={3}
              />
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter gap={2}>
          <Button
            size="sm" variant="ghost" onClick={handleClose}
            color="gray.400" fontFamily="mono" _hover={{ bg: 'gray.800' }}
          >
            CANCEL
          </Button>
          <Button
            size="sm" onClick={handleSubmit} isLoading={submitting}
            bg="blue.700" color="white" fontFamily="mono"
            _hover={{ bg: 'blue.600' }} loadingText="CREATING"
          >
            CREATE
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
