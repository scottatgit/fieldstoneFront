'use client';
import { Box, Badge, HStack, VStack, Text } from '@chakra-ui/react';
import { useEffect } from 'react';
import { adminFetchDirect } from '@/lib/adminFetch';
import { useUser } from '@/lib/useUser';
import { useRouter } from 'next/navigation';
import MfaSettings from '@/components/MfaSettings';

/**
 * Platform admin security page.
 * Delegates all MFA UI to shared MfaSettings component.
 * Guard: platform_admin only — all others redirected to /platform.
 */
export default function SecurityPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && user?.role !== 'platform_admin') router.replace('/platform');
  }, [isLoaded, user, router]);

  if (!isLoaded || user?.role !== 'platform_admin') return null;

  return (
    <Box>
      {/* Platform-admin-only header badge */}
      <Box px={6} pt={4}>
        <HStack justify="flex-end">
          <Badge colorScheme="red" fontSize="xs" fontFamily="mono" px={3} py={1}>
            PLATFORM ADMIN ONLY
          </Badge>
        </HStack>
      </Box>

      <MfaSettings
        fetchFn={adminFetchDirect}
        showBreakGlassNote={true}
        subtitle="Platform admin authentication settings"
      />
    </Box>
  );
}
