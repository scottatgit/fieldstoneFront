'use client';
import {
  Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerHeader,
  DrawerOverlay, Box, Text, VStack, HStack, Badge, Spinner, Flex, Button,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { pmFetch } from '@/lib/demoApi';

interface NoteItem {
  id: number;
  note_type: string | null;
  content: string | null;
  author: string | null;
  created_at: string | null;
  source: string | null;
}

interface Props {
  ticketKey: string | null;
  ticketTitle?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenTicket: (key: string) => void;
  pmApi: string;
}

function NoteCard({ note }: { note: NoteItem }) {
  const typeColor: Record<string, string> = {
    manual: 'blue',
    system: 'gray',
    ai: 'purple',
    signal: 'cyan',
  };
  const color = typeColor[note.note_type || ''] || 'gray';
  return (
    <Box
      px={3} py={2.5}
      bg='gray.800' border='1px solid' borderColor='gray.700'
      borderRadius='md'
    >
      <HStack spacing={2} mb={1.5}>
        <Badge colorScheme={color} fontSize='2xs' variant='subtle'>
          {note.note_type || 'note'}
        </Badge>
        {note.author && (
          <Text fontSize='2xs' fontFamily='mono' color='gray.500'>
            {note.author}
          </Text>
        )}
        {note.created_at && (
          <Text fontSize='2xs' fontFamily='mono' color='gray.700'>
            {new Date(note.created_at).toLocaleDateString()}
          </Text>
        )}
      </HStack>
      {note.content && (
        <Text fontSize='xs' color='gray.300' lineHeight='1.5' whiteSpace='pre-wrap'>
          {note.content}
        </Text>
      )}
    </Box>
  );
}

export function EvidenceDrawer({
  ticketKey, ticketTitle, isOpen, onClose, onOpenTicket, pmApi,
}: Props) {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !ticketKey) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setNotes([]);
    pmFetch(`/api/tickets/${ticketKey}/notes`, pmApi)
      .then((data: unknown) => {
        if (cancelled) return;
        const resp = data as { notes?: NoteItem[] };
        const list: NoteItem[] = Array.isArray(data)
          ? (data as NoteItem[])
          : (resp?.notes ?? []);
        setNotes(list);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load notes');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isOpen, ticketKey, pmApi]);

  return (
    <Drawer isOpen={isOpen} onClose={onClose} placement='right' size='md'>
      <DrawerOverlay bg='blackAlpha.600' />
      <DrawerContent bg='gray.900' borderLeft='1px solid' borderColor='gray.700'>
        <DrawerCloseButton color='gray.400' />
        <DrawerHeader
          borderBottom='1px solid' borderColor='gray.700'
          pb={3}
        >
          <VStack align='start' spacing={1}>
            <HStack spacing={2}>
              <Text fontSize='xs' fontFamily='mono' fontWeight='bold'
                color='gray.400' letterSpacing='wider'>
                SOURCE TICKET
              </Text>
              {ticketKey && (
                <Badge colorScheme='gray' fontSize='2xs' variant='subtle'
                  fontFamily='mono'>
                  {ticketKey}
                </Badge>
              )}
            </HStack>
            {ticketTitle && (
              <Text fontSize='xs' color='gray.200' fontWeight='normal'
                lineHeight='1.4' noOfLines={2}>
                {ticketTitle}
              </Text>
            )}
            {ticketKey && (
              <Button
                size='xs'
                bg='blue.800' color='blue.200'
                fontFamily='mono' fontSize='2xs'
                _hover={{ bg: 'blue.700' }}
                mt={1}
                onClick={() => {
                  onClose();
                  onOpenTicket(ticketKey);
                }}
              >
                Open Full Ticket View →
              </Button>
            )}
          </VStack>
        </DrawerHeader>

        <DrawerBody p={0}>
          <Box
            h='full' overflowY='auto'
            css={{ '&::-webkit-scrollbar': { width: '3px' }, '&::-webkit-scrollbar-thumb': { background: '#2D3748', borderRadius: '2px' } }}
          >
            <Box px={4} pt={3} pb={2}
              borderBottom='1px solid' borderColor='gray.800'>
              <Text fontSize='2xs' fontFamily='mono' fontWeight='bold'
                color='gray.500' letterSpacing='wider'>
                NOTES & EVIDENCE
              </Text>
              <Text fontSize='2xs' color='gray.700' mt={0.5}>
                Read-only · source material for this brief
              </Text>
            </Box>

            {loading && (
              <Flex align='center' gap={2} px={4} py={6}>
                <Spinner size='xs' color='blue.400' />
                <Text fontSize='2xs' fontFamily='mono' color='gray.600'>
                  Loading notes...
                </Text>
              </Flex>
            )}

            {error && (
              <Box px={4} py={3}>
                <Box px={3} py={2} bg='red.900' border='1px solid'
                  borderColor='red.700' borderRadius='md'>
                  <Text fontSize='2xs' fontFamily='mono' color='red.300'>
                    ⚠ {error}
                  </Text>
                </Box>
              </Box>
            )}

            {!loading && !error && notes.length === 0 && (
              <Flex align='center' justify='center' direction='column'
                gap={1} px={4} py={8}>
                <Text fontSize='xs' color='gray.600' fontFamily='mono'>
                  No notes
                </Text>
                <Text fontSize='2xs' color='gray.700' textAlign='center'>
                  Notes added to this ticket will appear here.
                </Text>
              </Flex>
            )}

            {notes.length > 0 && (
              <VStack align='stretch' spacing={2} p={4}>
                {notes.map((n) => (
                  <NoteCard key={n.id} note={n} />
                ))}
              </VStack>
            )}
          </Box>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
