"use client";
import { Suspense } from "react";
import { ChakraProvider } from "@chakra-ui/react";
import theme from "../../theme";
import Acquisition from "../Acquisition";

export default function SignalPage() {
  return (
    <ChakraProvider theme={theme}>
      <Suspense fallback={<div style={{ background: '#0d1117', minHeight: '100vh' }} />}>
        <Acquisition />
      </Suspense>
    </ChakraProvider>
  );
}
