'use client';
import { Box, Flex } from '@chakra-ui/react';
import { SummaryBar } from '@/components/pm/SummaryBar';
import { adminFetchDirect } from '@/lib/adminFetch';
import { isDemoMode } from '@/lib/demoApi';
import { DemoBanner } from '@/components/pm/DemoBanner';
import MfaSettings from '@/components/MfaSettings';

/**
 * PM Security page — /pm/security
 * FST-034-MFA-UI: User-facing MFA enrollment and management surface.
 *
 * Available to all authenticated PM users (any role).
 * Auth guard: WorkspaceGuard in pm/layout.tsx handles unauthenticated access.
 * ChakraProvider + pmTheme already provided by PMProviders in pm/layout.tsx.
 * No role restriction here — login enforcement remains platform_admin-only (Phase A state).
 */
export default function PMSecurityPage() {
  return (
    <Flex direction="column" h="100vh" bg="gray.950" overflow="hidden">
      {isDemoMode() && <DemoBanner />}

      {/* Standard PM nav — no ticket summary on this page */}
      <SummaryBar summary={null} loading={false} />

      {/* Scrollable content area */}
      <Box flex={1} overflowY="auto">
        <MfaSettings
          fetchFn={adminFetchDirect}
          subtitle="Account authentication settings"
        />
      </Box>
    </Flex>
  );
}
