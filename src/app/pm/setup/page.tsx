"use client";
import { ChakraProvider } from "@chakra-ui/react";
import SetupPanel from "@/components/pm/SetupPanel";
import pmTheme from "@/components/pm/pmTheme";

export default function SetupPage() {
  return (
    <ChakraProvider theme={pmTheme}>
      <SetupPanel />
    </ChakraProvider>
  );
}
