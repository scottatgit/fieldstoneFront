'use client';
import { useEffect, useState } from 'react';
import { Box, Badge, Flex, HStack, VStack, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { Ticket } from './types';
import { ReadinessBadge, TrustDot, DecisionBadge } from './SignalBadge';
import { isDemoMode, demoFetch } from '../../lib/demoApi';

const MotionBox = motion(Box as any);

// ── Risk types ───────────────────────────────────────────────────────────────
interface RiskPattern {
  pattern: string;
  tool_id: string | null;
  trend_status: 'emerging' | 'outbreak';
  occurrences: number;
  clients: number;
}

interface TicketRisk {
  risk_score: number;
  risk_level: 'normal' | 'watch' | 'high';
  patterns: RiskPattern[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────
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
  const m = raw.match(/(\w+)\s+(\d+)\/(\d+)\/\d+\s+(\d+):\d+:\d+\s+(AM|PM)/i);
  if (m) return `${m[1]} ${m[2]}/${m[3]} · ${m[4]}${m[5].toLowerCase()}`;
  const iso = raw.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (iso) {
    const d = new Date(raw);
    return d.toLocaleString('en-US', { weekday:'short', month:'numeric', day:'numeric', hour:'numeric', minute:'2-digit' });
  }
  return raw.slice(0, 16);
}

const API_BASE = process.env.NEXT_PUBLIC_PM_API_URL || '/pm-api';

// ── Risk banner ──────────────────────────────────────────────────────────────
function RiskBanner({ risk }: { risk: TicketRisk }) {
  if (risk.risk_score < 30 || risk.patterns.length === 0) return null;

  const isHigh    = risk.risk_level === 'high';
  const isOutbreak = risk.patterns.some(p => p.trend_status === 'outbreak');
  const topPattern = risk.patterns[0];

  const borderColor = isHigh ? 'red.600'    : 'orange.600';
  const bgColor     = isHigh ? 'red.900'    : 'orange.900';
  const textColor   = isHigh ? 'red.200'    : 'orange.200';
  const badgeColor  = isHigh ? 'red'        : 'orange';
  const label       = isOutbreak ? '🚨 OUTBREAK PATTERN' : '⚠️ PATTERN DETECTED';

  return (
    <Box
      border="1px solid"
      borderColor={borderColor}
      bg={bgColor}
      borderRadius="sm"
      px={2}
      py={1.5}
    >
      <Flex justify="space-between" align="center" mb={0.5}>
        <Text fontSize="2xs" fontWeight="bold" color={textColor} letterSpacing="wide">
          {label}
        </Text>
        <Badge fontSize="2xs" colorScheme={badgeColor} variant="solid">
          {risk.risk_score}
        </Badge>
      </Flex>
      <Text fontSize="2xs" color={textColor} opacity={0.85} noOfLines={1}>
        {topPattern.pattern}
      </Text>
      <HStack spacing={2} mt={0.5}>
        <Text fontSize="2xs" color={textColor} opacity={0.7}>
          {topPattern.occurrences} occurrences · {topPattern.clients} clients
        </Text>
      </HStack>
    </Box>
  );
}

// ── Main card ────────────────────────────────────────────────────────────────
interface TicketCardProps {
  ticket: Ticket;
  onClick: (ticket: Ticket) => void;
  isSelected?: boolean;
}

export function TicketCard({ ticket, onClick, isSelected }: TicketCardProps) {
  const [risk, setRisk] = useState<TicketRisk | null>(null);

  // Lazy-load risk data on mount
  useEffect(() => {
    let cancelled = false;
    async function fetchRisk() {
      try {
        let data: unknown;
        if (isDemoMode()) {
          data = await demoFetch(`/api/tickets/${ticket.ticket_key}/risk`);
        } else {
          const res = await fetch(`${API_BASE}/api/tickets/${ticket.ticket_key}/risk`);
          if (!res.ok) return;
          data = await res.json();
        }
        if (!cancelled && data && typeof data === 'object') {
          const r = data as TicketRisk;
          if (r.risk_score >= 30) setRisk(r);
        }
      } catch {
        // silent — risk banner is non-critical
      }
    }
    fetchRisk();
    return () => { cancelled = true; };
  }, [ticket.ticket_key]);

  const clientName   = ticket.client_display_name || ticket.client_key || 'Unknown';
  const displayTitle = ticket.situation?.trim() || ticket.title_clean || cleanTitle(ticket.title);
  const isDeclining  = (ticket.trust_score ?? 100) < 40;
  const isLowReady   = (ticket.readiness_score ?? 100) < 50;
  const visitTime    = ticket.effective_visit_time || ticket.visit_datetime || ticket.appointment_at;
  const visitDisplay = formatVisitTime(visitTime);
  const contactName  = ticket.contact_name || null;
  const contactPhone = ticket.contact_phone || null;
  const assignedTo   = ticket.assigned_to || null;

  // If risk is high, override card border
  const hasHighRisk = risk && risk.risk_level === 'high';
  const hasWatchRisk = risk && risk.risk_level === 'watch';
  const borderColor = isSelected ? 'blue.500'
    : hasHighRisk   ? 'red.600'
    : hasWatchRisk  ? 'orange.600'
    : isDeclining   ? 'red.800'
    : isLowReady    ? 'yellow.900'
    : 'gray.700';

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
      borderColor={borderColor}
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

        {/* Row 2: Visit time */}
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

        {/* Row 5: Risk banner (Phase 30) */}
        {risk && risk.risk_score >= 30 && <RiskBanner risk={risk} />}

        {/* Row 6: Signals + tech badge */}
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
