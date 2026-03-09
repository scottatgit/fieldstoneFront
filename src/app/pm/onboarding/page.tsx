'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Box, VStack, Spinner, Text } from '@chakra-ui/react';

import { Step1PathSelect }       from './step1-path-select';
import { Step2CreateWorkspace }  from './step2-create-workspace';
import { Step2JoinWorkspace }    from './step2-join-workspace';
import { Step3NextSteps }        from './step3-next-steps';

type Step = 'path-select' | 'create' | 'join' | 'next-steps';

function OnboardingInner() {
  const searchParams = useSearchParams();
  const { getToken } = useAuth();

  const inviteToken = searchParams.get('invite');

  // If invite token in URL — start on join step
  const [step, setStep] = useState<Step>(inviteToken ? 'join' : 'path-select');

  // Keep invite token in state in case user navigates back then forward
  const [activeToken, setActiveToken] = useState<string | null>(inviteToken);

  // Sync if URL param changes (e.g. user arrives mid-session)
  useEffect(() => {
    if (inviteToken) {
      setActiveToken(inviteToken);
      setStep('join');
    }
  }, [inviteToken]);

  function handleGetToken() {
    return getToken();
  }

  return (
    <Box
      minH="100svh"
      bg="gray.950"
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
    >
      <Box
        w="full"
        maxW="480px"
        bg="gray.900"
        border="1px solid"
        borderColor="gray.700"
        borderRadius="xl"
        p={{ base: 6, md: 8 }}
      >
        {step === 'path-select' && (
          <Step1PathSelect
            onCreate={() => setStep('create')}
            onJoin={() => setStep('join')}
          />
        )}

        {step === 'create' && (
          <Step2CreateWorkspace
            getToken={handleGetToken}
            onSuccess={() => setStep('next-steps')}
            onBack={() => setStep('path-select')}
          />
        )}

        {step === 'join' && (
          <Step2JoinWorkspace
            inviteToken={activeToken}
            getToken={handleGetToken}
            onSuccess={() => setStep('next-steps')}
            onBack={() => {
              setActiveToken(null);
              setStep('path-select');
            }}
          />
        )}

        {step === 'next-steps' && (
          <Step3NextSteps />
        )}
      </Box>
    </Box>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <Box minH="100svh" bg="gray.950" display="flex" alignItems="center" justifyContent="center">
          <VStack spacing={3}>
            <Spinner color="blue.400" size="lg" />
            <Text fontSize="xs" color="gray.500" fontFamily="mono">Loading...</Text>
          </VStack>
        </Box>
      }
    >
      <OnboardingInner />
    </Suspense>
  );
}
