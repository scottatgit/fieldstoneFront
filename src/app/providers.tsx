"use client";
import { ChakraProvider } from "@chakra-ui/react";
import { ReactNode } from "react";
import theme from "../theme";

/**
 * Root app provider.
 * Supplies ChakraProvider with the global theme to all routes.
 *
 * Note: pm/ and platform/ layouts supply their own ChakraProvider
 * (via PMProviders and direct ChakraProvider respectively).
 * This root wrapper is retained for routes outside those trees
 * (login, signup, invite, auth/*, redirect).
 *
 * Redux was removed 2026-03-29 — all Redux consumers were legacy
 * routes (pod, slider) which have been deleted. pm/ and platform/
 * do not use Redux.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ChakraProvider theme={theme}>
      {children}
    </ChakraProvider>
  );
}
