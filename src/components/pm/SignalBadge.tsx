'use client';
import { Badge, Box, Tooltip } from '@chakra-ui/react';

/** Extract [LABEL] from decision_signal string, or use pre-computed label */
export function extractSignalLabel(signal: string | null | undefined, precomputed?: string | null): string {
  if (precomputed) return precomputed;
  if (!signal) return 'UNKNOWN';
  const m = signal.match(/^\[([A-Z][A-Z/\-]+)\]/);
  return m ? m[1] : signal.slice(0, 20);
}

export function ReadinessBadge({ score }: { score: number | null }) {
  const s = score ?? 0;
  if (s >= 80) return <Badge colorScheme="green"  variant="solid"  fontSize="2xs" px={2}>🟢 {s}</Badge>;
  if (s >= 50) return <Badge colorScheme="yellow" variant="solid"  fontSize="2xs" px={2}>🟡 {s}</Badge>;
  return         <Badge colorScheme="red"    variant="solid"  fontSize="2xs" px={2}>🔴 {s}</Badge>;
}

export function TrustDot({ score }: { score: number | null }) {
  const s = score ?? 0;
  const color  = s >= 60 ? '#48BB78' : s >= 40 ? '#ECC94B' : '#FC8181';
  const glow   = s < 40 ? `0 0 6px ${color}` : 'none';
  const label  = s >= 60 ? 'RISING' : s >= 40 ? 'NEUTRAL' : 'DECLINING';
  return (
    <Tooltip label={`Trust: ${s} — ${label}`} placement="top" hasArrow>
      <Box w={2} h={2} borderRadius="full" bg={color} boxShadow={glow} flexShrink={0} cursor="default" />
    </Tooltip>
  );
}

const SIGNAL_COLORS: Record<string, string> = {
  'GO/NO-GO':        'green',
  'VERIFY/SIGN-OFF': 'blue',
  'RESOLVE/VERIFY':'purple',
  'PROCEED/HALT':'orange',
  'COMPLETE/UPLOAD': 'teal',
  'VERIFY/ESCALATE': 'red',
  'ASSESS/RECOMMEND':'yellow',
  'PATCH/REPLACE':'orange',
  'VERIFY/APPROVE':'blue',
  'VERIFY/TEST':'cyan',
};

export function DecisionBadge({
  signal, label
}: { signal: string | null | undefined; label?: string | null }) {
  const lbl   = extractSignalLabel(signal, label);
  const color = SIGNAL_COLORS[lbl] || 'gray';
  return (
    <Tooltip label={signal || lbl} placement="top" hasArrow maxW="280px">
      <Badge
        colorScheme={color}
        fontSize="2xs" px={1.5} py={0.5}
        variant="outline" borderRadius="sm"
        cursor="default" fontFamily="mono" letterSpacing="tight"
      >
        {lbl}
      </Badge>
    </Tooltip>
  );
}
