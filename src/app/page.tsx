"use client";
import { Suspense, useState } from "react";
import { Box, ChakraProvider } from "@chakra-ui/react";
import theme from "../theme";
import LoginModal from "../components/LoginModal";
import RegisterModal from "../components/RegisterModal";
import Acquisition from "./Acquisition"; 

export default function Page() {
  const [isLoginOpen, setLoginOpen] = useState(false);
  const [isRegisterOpen, setRegisterOpen] = useState(false);

  const handleLoginOpen = () => setLoginOpen(true);
  const handleRegisterOpen = () => setRegisterOpen(true);

  return (
    <ChakraProvider theme={theme}>
      <Box as="main" className="max-w-7xl mx-auto py-6">
        <Suspense fallback={<div>Loading...</div>}>
          <Acquisition /> {/* Use Acquisition component here */}
        </Suspense>

        {/* Login and Register Modals */}
        <LoginModal isOpen={isLoginOpen} onClose={() => setLoginOpen(false)} />
        <RegisterModal isOpen={isRegisterOpen} onClose={() => setRegisterOpen(false)} />
      </Box>
    </ChakraProvider>
  );
}
