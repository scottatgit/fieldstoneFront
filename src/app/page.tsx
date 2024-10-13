"use client"
import { Suspense, useEffect, useState } from "react";
import { Box, ChakraProvider } from "@chakra-ui/react";
import theme from "../theme";
import WelcomeModal from "../components/WelcomeModal";
import LoginModal from "../components/LoginModal";
import RegisterModal from "../components/RegisterModal";
import Acquisition from "./Acquisition"; // Updated to use Acquisition

export default function Page() {
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  const [isLoginOpen, setLoginOpen] = useState(false);
  const [isRegisterOpen, setRegisterOpen] = useState(false);

  useEffect(() => {
    const welcomeDismissed = sessionStorage.getItem("welcomeDismissed");
    if (!welcomeDismissed) {
      setIsWelcomeOpen(true);
    }
  }, []);

  const handleCloseWelcome = () => {
    setIsWelcomeOpen(false);
    sessionStorage.setItem("welcomeDismissed", "true");
  };

  const handleLoginOpen = () => setLoginOpen(true);
  const handleRegisterOpen = () => setRegisterOpen(true);

  return (
    <ChakraProvider theme={theme}>
      <Box as="main" className="max-w-7xl mx-auto py-6">
        <Suspense fallback={<div>Loading...</div>}>
          <Acquisition /> {/* Use Acquisition component here */}
        </Suspense>

        {/* Welcome Modal 
        <WelcomeModal
          isOpen={isWelcomeOpen}
          onClose={handleCloseWelcome}
          onLoginOpen={handleLoginOpen}
          onRegisterOpen={handleRegisterOpen}
        />*/}

        {/* Login and Register Modals */}
        <LoginModal isOpen={isLoginOpen} onClose={() => setLoginOpen(false)} />
        <RegisterModal isOpen={isRegisterOpen} onClose={() => setRegisterOpen(false)} />
      </Box>
    </ChakraProvider>
  );
}
