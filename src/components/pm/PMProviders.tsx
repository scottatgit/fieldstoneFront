'use client';
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { ReactNode } from 'react';
import pmTheme from './pmTheme';

export function PMProviders({ children }: { children: ReactNode }) {
  return (
    <>
      <ColorModeScript initialColorMode="dark" />
      <ChakraProvider theme={pmTheme}>
        {children}
      </ChakraProvider>
    </>
  );
}
