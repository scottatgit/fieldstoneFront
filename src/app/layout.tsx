"use client";
import { ChakraProvider, Box } from "@chakra-ui/react";
import { ReactNode, useEffect } from "react";
import "./globals.css";
import localFont from "next/font/local";
import { Provider } from "react-redux";
import { store } from "../redux/store";
import Navbar from "../components/Navbar";
import theme from "../theme";
import { setAuth } from "../redux/slices/authSlice";

// Define local fonts
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

// Props interface
interface LayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: LayoutProps) {
  // Hydration logic
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
    <html lang="en">
      <head>
        <title>Kreation Nation</title>
        {/* Primary Meta Tags for SEO */}
        <meta name="title" content="Kreation Nation | Find - Celebrate - Create!" />
        <meta
          name="description"
          content="Kreation Nation: Review - Contain - Commune - Create! Discover creator-based content like books, services, newsletters, tutorials, reviews, and more."
        />
        <meta
          name="keywords"
          content="creators, tutorials, services, newsletters, books, Kreation Nation, reviews"
        />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="UTF-8" />
        <link rel="canonical" href="https://www.kreationation.com" />

        {/* Open Graph Meta Tags for Social Media Sharing */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.kreationation.com" />
        <meta property="og:title" content="Kreation Nation | Find - Celebrate - Create!" />
        <meta
          property="og:description"
          content="Review - Contain - Commune - Create! Explore books, newsletters, services, tutorials, reviews, and everything creator-based."
        />
        <meta property="og:image" content="https://www.kreationation.com/preview.png" />

        {/* Twitter Meta Tags for Sharing */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://www.kreationation.com" />
        <meta name="twitter:title" content="Kreation Nation | Find - Celebrate - Create!" />
        <meta
          name="twitter:description"
          content="Review - Contain - Commune - Create! Discover creator-based content."
        />
        <meta name="twitter:image" content="https://www.kreationation.com/preview.png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ChakraProvider theme={theme}>
          <Provider store={store}>
            {/* Navbar */}
            <Navbar />
            {/* Main Content */}
            <Box as="main" className="max-w-7xl mx-auto py-6">
              {children}
            </Box>
          </Provider>
        </ChakraProvider>
      </body>
    </html>
  );
}
