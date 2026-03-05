'use client';
import { Box, Badge, Flex, HStack, VStack, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { Ticket } from './types';
import { ReadinessBadge, TrustDot, DecisionBadge } from './SignalBadge';

const MotionBox = motion(Box as any);

function cleanTitle(raw: string | null | undefined): string {
  if (!raw) return '';
  let t = raw.replace(/[\r\n]+/g, ' ').trim();
  t = t.replace(/^(Fw|Re|Fwd):\s*/i, '');
  t = t.replace(/^Project\s+Ticket#?\d+\/[^\/]+\/[^\/]+\//i, '').trim();
  t = t.replace(/^Project\s+Ticket\s*#?\d+\s*[-–]?\s*/i, '').trim();
  return t || (raw.trim());
}

function formatVisitTime(raw: string | null | undefined): string {
  if (!raw) return '';
  // 'Mon 2/9/2026 3:00:00 PM' -> 'Mon Feb 9 · 3pm'
  const m = raw.match(/(\w+)\s+(\d+)\/(\d+)\/\d+\s+(\d+):\d+:\d+\s+(AM|PM)/i);
  if (m) return `${m[1]} ${m[2]}/${m[3]} · ${m[4]}${m[5].toLowerCase()}`;
  // ISO: 2026-03-02T10:30:00
  const iso = raw.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (iso) {
    const d = new Date(raw);
    return d.toLocaleString('en-US', { weekday:'short', month:'numeric', day:'numeric', hour:'numeric', minute:'2-digit' });
  }
  return raw.slice(0, 16);
}

interface TicketCardProps {
  ticket: Ticket;
  onClick: (ticket: Ticket) => void;
  isSelected?: boolean;
}

export function TicketCard({ ticket, onClick, isSelected }: TicketCardProps) {
  const clientName   = ticket.client_display_name || ticket.sender_name || ticket.client_key || 'Unknown';
  const displayTitle = ticket.situation?.trim() || ticket.title_clean || cleanTitle(ticket.title);
  const isDeclining  = (ticket.trust_score ?? 100) < 40;
  const isLowReady   = (ticket.readiness_score ?? 100) < 50;

  // Effective visit time: PM-set takes priority, fallback to email Date Assigned
  const visitTime = ticket.effective_visit_time || ticket.visit_datetime || ticket.appointment_at;
  const visitDisplay = formatVisitTime(visitTime);

  // Contact info
  const contactName  = ticket.contact_name || null;
  const contactPhone = ticket.contact_phone || null;
  const assignedTo   = ticket.assigned_to || null;

  return (
    <MotionBox
      onClick={() => onClick(ticket)}
      whileHover={{ scale: 1.01, y: -1 }}
      whileTap={{ scale: 0.99 }}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      cursor="pointer"
      bg={isSelected ? 'blue.900' : 'gray.800'}
      border="1px solid"
      borderColor={isSelected ? 'blue.500' : isDeclining ? 'red.800' : isLowReady ? 'yellow.900' : 'gray.700'}
      borderRadius="md"
      p={3}
      _hover={{ borderColor: isSelected ? 'blue.400' : 'gray.500', bg: isSelected ? 'blue.900' : 'gray.750' }}
      position="relative"
    >
      {isDeclining && (
        <Box
          position="absolute" top={0} left={0} right={0} h="2px"
          bg="red.500" borderTopRadius="md" opacity={0.8}
        />
      )}

      <VStack align="stretch" spacing={1.5}>
        {/* Row 1: Client name + trust dot */}
        <Flex justify="space-between" align="center">
          <Text fontSize="xs" fontWeight="bold" color="gray.100" noOfLines={1} flex={1}>
            {clientName}
          </Text>
          <TrustDot score={ticket.trust_score} />
        </Flex>

        {/* Row 2: Visit time (prominent) */}
        {visitDisplay && (
          <HStack spacing={1}>
            <Text fontSize="2xs" color="blue.300" fontFamily="mono" fontWeight="bold">
              🕐 {visitDisplay}
            </Text>
          </HStack>
        )}

        {/* Row 3: Contact + Phone */}
        {(contactName || contactPhone) && (
          <HStack spacing={2} flexWrap="wrap">
            {contactName && (
              <Text fontSize="2xs" color="gray.400" noOfLines={1}>
                👤 {contactName}
              </Text>
            )}
            {contactPhone && (
              <Text
                as="a"
                href={`tel:${contactPhone.replace(/\D/g, '')}`}
                fontSize="2xs"
                color="green.400"
                onClick={e => e.stopPropagation()}
              >
                📞 {contactPhone}
              </Text>
            )}
          </HStack>
        )}

        {/* Row 4: Situation / title */}
        <Text fontSize="xs" color="gray.300" noOfLines={2} lineHeight="short">
          {displayTitle}
        </Text>

        {/* Row 5: Signals + tech badge */}
        <Flex justify="space-between" align="center" wrap="wrap" gap={1}>
          <HStack spacing={1}>
            <DecisionBadge signal={ticket.decision_signal} />
            <ReadinessBadge score={ticket.readiness_score} />
          </HStack>
          <HStack spacing={1}>
            {assignedTo && (
              <Badge
                fontSize="2xs" fontFamily="mono"
                colorScheme="purple" variant="subtle"
                px={1.5} py={0.5} borderRadius="sm"
              >
                {assignedTo.split(' ')[0]}
              </Badge>
            )}
            {ticket.notes_count > 0 && (
              <Badge fontSize="2xs" colorScheme="gray" variant="subtle">{ticket.notes_count} notes</Badge>
            )}
          </HStack>
        </Flex>
      </VStack>
    </MotionBox>
  );
}
