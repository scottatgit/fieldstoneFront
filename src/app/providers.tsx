"use client";
import { ChakraProvider } from "@chakra-ui/react";
import { ReactNode, useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "../redux/store";
import theme from "../theme";
import { setAuth } from "../redux/slices/authSlice";
import { Box } from "@chakra-ui/react";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");
      if (token && user) {
        store.dispatch(setAuth({ user: JSON.parse(user), token }));
      }
    }
  }, []);

  return (
    <ChakraProvider theme={theme}>
      <Provider store={store}>
        <Box as="main" className="max-w-7xl mx-auto py-6">
          {children}
        </Box>
      </Provider>
    </ChakraProvider>
  );
}
