"use client";
import { ChakraProvider } from "@chakra-ui/react";
import { SetupPanel } from "@/components/pm/SetupPanel";
import { SummaryBar } from "@/components/pm/SummaryBar";
import pmTheme from "@/components/pm/pmTheme";

export default function SetupPage() {
  return (
    <ChakraProvider theme={pmTheme}>
      <SummaryBar summary={null} loading={false} />
      <SetupPanel />
    </ChakraProvider>
  );
}
