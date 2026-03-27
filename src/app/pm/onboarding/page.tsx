'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser } from '@/lib/useUser';
import { Box, VStack, Spinner, Text } from '@chakra-ui/react';

import { Step1PathSelect }        from './step1-path-select';
import { Step2CreateWorkspace }   from './step2-create-workspace';
import { Step2JoinWorkspace }     from './step2-join-workspace';
import { Step3NextSteps }         from './step3-next-steps';

const SIGNAL_DOMAIN = process.env.NEXT_PUBLIC_SIGNAL_DOMAIN || 'signal.fieldstone.pro';

type Step = 'path-select' | 'create' | 'join' | 'next-steps';

function OnboardingInner() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();

  const inviteToken = searchParams.get('invite');

  // P1b: Lock step to 'join' immediately when invite token is present.
  // P5:  No invite + already has workspace → route straight to their workspace.
  const [step,        setStep]        = useState<Step>(inviteToken ? 'join' : 'path-select');
  const [activeToken, setActiveToken] = useState<string | null>(inviteToken);

  // Redirect to login if not authed, preserving invite param for return
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      const returnUrl = encodeURIComponent(
        `/pm/onboarding${inviteToken ? `?invite=${inviteToken}` : ''}`
      );
      router.replace(`/login?redirect_url=${returnUrl}`);
    }
  }, [isLoaded, isSignedIn, inviteToken, router]);

  // P1b: Keep step locked to 'join' whenever inviteToken is present — no escape
  useEffect(() => {
    if (inviteToken) { setActiveToken(inviteToken); setStep('join'); }
  }, [inviteToken]);

  // P5 REMOVED: Users no longer auto-routed from onboarding.
  // New users arrive here without a workspace and must complete the create step.

  if (!isLoaded || !isSignedIn) {
    return (
      <Box minH="100svh" bg="gray.950" display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={3}>
          <Spinner color="blue.400" size="lg" />
          <Text fontSize="xs" color="gray.500" fontFamily="mono">
            {!isLoaded ? 'Loading...' : 'Redirecting to login...'}
          </Text>
        </VStack>
      </Box>
    );
  }



  return (
    <Box minH="100svh" bg="gray.950" display="flex" alignItems="center" justifyContent="center" p={4}>
      <Box w="full" maxW="480px" bg="gray.900" border="1px solid" borderColor="gray.700" borderRadius="xl" p={{ base: 6, md: 8 }}>

        {/* P1b: path-select only shown when no invite is present */}
        {step === 'path-select' && !inviteToken && (
          <Step1PathSelect
            onCreate={() => setStep('create')}
            onJoin={() => setStep('join')}
          />
        )}

        {step === 'create' && (
          <Step2CreateWorkspace
            onSuccess={() => setStep('next-steps')}
            onBack={() => setStep('path-select')}
          />
        )}

        {/* P1b: join step — back button disabled when invite is locked */}
        {step === 'join' && (
          <Step2JoinWorkspace
            inviteToken={activeToken}
            onSuccess={() => setStep('next-steps')}
            onBack={() => {
              if (inviteToken) return; // P1b: no escape from invite join
              setActiveToken(null);
              setStep('path-select');
            }}
          />
        )}

        {step === 'next-steps' && <Step3NextSteps />}
      </Box>
    </Box>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <Box minH="100svh" bg="gray.950" display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={3}>
          <Spinner color="blue.400" size="lg" />
          <Text fontSize="xs" color="gray.500" fontFamily="mono">Loading...</Text>
        </VStack>
      </Box>
    }>
      <OnboardingInner />
    </Suspense>
  );
}
