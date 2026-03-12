'use client';
import { ChakraProvider } from '@chakra-ui/react';
import SetupWizard from '@/components/pm/SetupWizard';
import pmTheme from '@/components/pm/pmTheme';

export default function SetupPage() {
  return (
    <ChakraProvider theme={pmTheme}>
      <SetupWizard />
    </ChakraProvider>
  );
}
