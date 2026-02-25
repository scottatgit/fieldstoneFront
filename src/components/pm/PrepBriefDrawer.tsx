'use client';
import {
  Drawer, DrawerBody, DrawerCloseButton, DrawerContent,
  DrawerHeader, DrawerOverlay, Box, Text, HStack, Badge,
  VStack, Flex, Spinner, useToast,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { Ticket } from './types';
import { ReadinessBadge, TrustDot, DecisionBadge } from './SignalBadge';

const PM_API = process.env.NEXT_PUBLIC_PM_API_URL || 'http://localhost:8100';

function renderMarkdown(md: string): string {
  const NL = '\n';
  const out = md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^---$/gm, '<hr/>')
    .replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^\|[-| :]+\|$/gm, '');

  // Process lines for tables and lists
  const lines = out.split(NL);
  const result: string[] = [];
  let inList = false;
  let inTable = false;

  for (const line of lines) {
    const _isTr = line.trimStart().startsWith('<tr>');
    const isLi = line.trimStart().startsWith('<li>');
    const isTblRow = /^\| .+ \|$/.test(line.trim());

    if (isTblRow && !line.match(/^\|[-| :]+\|$/)) {
      const cells = line.split('|').slice(1, -1);
      const tr = '<tr>' + cells.map(c => `<td>${c.trim()}</td>`).join('') + '</tr>';
      if (!inTable) { result.push('<table>'); inTable = true; }
      result.push(tr);
    } else {
      if (inTable) { result.push('</table>'); inTable = false; }
      if (isLi) {
        if (!inList) { result.push('<ul>'); inList = true; }
        result.push(line);
      } else {
        if (inList) { result.push('</ul>'); inList = false; }
        result.push(line);
      }
    }
  }
  if (inList)  result.push('</ul>');
  if (inTable) result.push('</table>');

  return result.join('<br/>');
}

interface PrepBriefDrawerProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PrepBriefDrawer({ ticket, isOpen, onClose }: PrepBriefDrawerProps) {
  const [brief, setBrief]     = useState<string>('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!ticket || !isOpen) return;
    setLoading(true);
    setBrief('');
    fetch(`${PM_API}/api/brief/${ticket.ticket_key}`, { method: 'POST' })
      .then(r => r.json())
      .then(d => { setBrief(d.brief || ''); setLoading(false); })
      .catch(() => {
        toast({ title: 'Failed to load brief', status: 'error', duration: 3000 });
        setLoading(false);
      });
  }, [ticket?.ticket_key, isOpen]);

  if (!ticket) return null;

  const clientName   = ticket.client_display_name || ticket.sender_name || ticket.client_key || 'Unknown';
  const displayTitle = ticket.title_clean || ticket.title || '';

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="lg">
      <DrawerOverlay bg="blackAlpha.800" />
      <DrawerContent bg="gray.900" borderLeft="1px solid" borderColor="gray.700">
        <DrawerCloseButton color="gray.400" top={3} right={3} />

        <DrawerHeader borderBottomWidth="1px" borderColor="gray.700" pb={3} pr={10}>
          <VStack align="flex-start" spacing={1.5}>
            <HStack spacing={2}>
              <TrustDot score={ticket.trust_score} />
              <Text fontSize="xs" fontFamily="mono" color="gray.400" fontWeight="bold">
                #{ticket.ticket_key}
              </Text>
              <ReadinessBadge score={ticket.readiness_score} />
            </HStack>
            <Text fontSize="lg" fontWeight="black" color="white" lineHeight="tight">
              {clientName}
            </Text>
            <Text fontSize="sm" color="gray.300" noOfLines={2} title={ticket.title}>
              {displayTitle}
            </Text>
            <HStack spacing={1.5} flexWrap="wrap" mt={0.5}>
              <DecisionBadge signal={ticket.decision_signal} label={ticket.decision_label} />
              {ticket.appointment_at && (
                <Badge colorScheme="blue" fontSize="2xs" variant="subtle">
                  📅 {ticket.appointment_at}
                </Badge>
              )}
              {ticket.needs_response === 1 && (
                <Badge colorScheme="orange" fontSize="2xs" variant="solid">
                  📩 RESPONSE NEEDED
                </Badge>
              )}
              {(ticket.trust_score ?? 100) < 40 && (
                <Badge colorScheme="red" fontSize="2xs" variant="solid">
                  ⚠️ DECLINING TRUST
                </Badge>
              )}
            </HStack>
          </VStack>
        </DrawerHeader>

        <DrawerBody p={0}>
          {loading ? (
            <Flex h="200px" align="center" justify="center">
              <VStack spacing={3}>
                <Spinner color="blue.400" size="lg" thickness="3px" />
                <Text color="gray.400" fontSize="sm">Generating prep brief…</Text>
              </VStack>
            </Flex>
          ) : (
            <Box
              p={5} overflowY="auto" h="full"
              css={{ '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { background: '#4A5568', borderRadius: '2px' } }}
              sx={{
                h1: { color: 'white', fontSize: 'md', borderBottom: '1px solid', borderColor: 'gray.700', pb: 2, mb: 3, mt: 4, fontFamily: 'mono', fontWeight: 'bold' },
                h2: { color: 'blue.200', fontSize: 'xs', mt: 4, mb: 2, fontFamily: 'mono', textTransform: 'uppercase', letterSpacing: 'wider', fontWeight: 'bold' },
                h3: { color: 'gray.300', fontSize: 'sm', mt: 3, mb: 1, fontWeight: 'semibold' },
                p:  { color: 'gray.300', fontSize: 'sm', mb: 2, lineHeight: 'tall' },
                ul: { pl: 4, color: 'gray.300', fontSize: 'sm', mb: 2 },
                li: { mb: 1, lineHeight: 'tall' },
                hr: { borderColor: 'gray.700', my: 3 },
                table: { width: '100%', borderCollapse: 'collapse', mb: 3, fontSize: 'sm' },
                td: { color: 'gray.200', p: '6px 8px', borderBottom: '1px solid', borderColor: 'gray.800', verticalAlign: 'top' },
                'td:first-of-type': { color: 'gray.400', fontWeight: 'bold', width: '35%', fontFamily: 'mono', fontSize: 'xs' },
                code: { bg: 'gray.800', color: 'green.300', px: 1.5, py: 0.5, borderRadius: 'sm', fontSize: 'xs', fontFamily: 'mono' },
                strong: { color: 'white', fontWeight: 'bold' },
                em: { color: 'gray.400', fontStyle: 'italic' },
                blockquote: { borderLeft: '3px solid', borderColor: 'blue.600', pl: 3, color: 'gray.300', fontStyle: 'italic', my: 2, py: 1 },
              }}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(brief) }}
            />
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
