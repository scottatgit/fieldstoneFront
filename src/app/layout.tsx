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
        <title>Fieldstone | AI Solutions for Your Business Growth</title>
        {/* Primary Meta Tags for SEO */}
        <meta name="title" content="Fieldstone | AI Solutions for Your Business Growth" />
        <meta
          name="description"
          content="Fieldstone provides tailored AI frameworks, integration, and data analytics to empower your business for a digital future. Join us to elevate your operations with cutting-edge technology."
        />
        <meta
          name="keywords"
          content="AI solutions, AI frameworks, data analytics, business growth, Fieldstone, AI integration"
        />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="UTF-8" />
        <link rel="canonical" href="https://www.fieldstone.pro" />

        {/* Open Graph Meta Tags for Social Media Sharing */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.fieldstone.pro" />
        <meta property="og:title" content="Fieldstone | AI Solutions for Your Business Growth" />
        <meta
          property="og:description"
          content="Empowering businesses with AI frameworks, data-driven analytics, and seamless integration. Discover how Fieldstone can transform your operations."
        />
        <meta property="og:image" content="https://www.fieldstone.pro/preview.png" />

        {/* Twitter Meta Tags for Sharing */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://www.fieldstone.pro" />
        <meta name="twitter:title" content="Fieldstone | AI Solutions for Your Business Growth" />
        <meta
          name="twitter:description"
          content="Fieldstone helps businesses grow through AI frameworks, data insights, and advanced technology integration."
        />
        <meta name="twitter:image" content="https://www.fieldstone.pro/preview.png" />
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
