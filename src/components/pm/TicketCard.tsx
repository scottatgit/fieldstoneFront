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

function formatAppt(raw: string | null | undefined): string {
  if (!raw) return '';
  // 'Mon 2/9/2026 3:00:00 PM' -> 'Mon 2/9 3pm'
  const m = raw.match(/(\w+\s+\d+\/\d+)\/\d+\s+(\d+):\d+:\d+\s+(AM|PM)/i);
  if (m) return `${m[1]} ${m[2]}${m[3].toLowerCase()}`;
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
        {/* Row 1: Trust dot + client + readiness */}
        <Flex justify="space-between" align="center">
          <HStack spacing={2} minW={0} flex={1}>
            <TrustDot score={ticket.trust_score} />
            <Text fontWeight="bold" fontSize="sm" color="white" noOfLines={1} flex={1}>
              {clientName}
            </Text>
            {isDeclining && (
              <Badge colorScheme="red" fontSize="2xs" px={1} variant="solid" flexShrink={0}>
                ⚠️ DECLINING
              </Badge>
            )}
            {ticket.needs_response === 1 && (
              <Badge colorScheme="orange" fontSize="2xs" px={1} variant="subtle" flexShrink={0}>
                📩
              </Badge>
            )}
          </HStack>
          <ReadinessBadge score={ticket.readiness_score} />
        </Flex>

        {/* Row 2: Ticket key + cleaned title */}
        <HStack spacing={2} align="flex-start">
          <Text fontSize="2xs" fontFamily="mono" color="gray.500" flexShrink={0} mt="1px">
            #{ticket.ticket_key}
          </Text>
          <Text fontSize="xs" color="gray.300" noOfLines={2} lineHeight="short" flex={1}
            title={ticket.title}>
            {displayTitle}
          </Text>
        </HStack>

        {/* Row 3: Decision badge + appointment */}
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={1}>
          <HStack spacing={1.5} flexWrap="wrap">
            <DecisionBadge signal={ticket.decision_signal} label={ticket.decision_label} />
            {ticket.lifecycle_status && (
              <Badge colorScheme="purple" fontSize="2xs" px={1.5} variant="subtle" borderRadius="sm">
                {ticket.lifecycle_status}
              </Badge>
            )}
          </HStack>
          <HStack spacing={2}>
            {ticket.appointment_at && (
              <Text fontSize="2xs" color="blue.300" fontFamily="mono" flexShrink={0}>
                📅 {formatAppt(ticket.appointment_at)}
              </Text>
            )}
            {ticket.notes_count > 0 && (
              <Text fontSize="2xs" color="gray.600" flexShrink={0}>
                📝{ticket.notes_count}
              </Text>
            )}
          </HStack>
        </Flex>
      </VStack>
    </MotionBox>
  );
}
