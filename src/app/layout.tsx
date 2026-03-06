import { ReactNode } from "react";
import "./globals.css";
import localFont from "next/font/local";
import { Providers } from "./providers";
import { ClerkProvider } from "@clerk/nextjs";

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

export const metadata = {
  title: "Fieldstone | AI Solutions for Your Business Growth",
  description: "Fieldstone provides tailored AI frameworks, integration, and data analytics to empower your business for a digital future.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <meta name="title" content="Fieldstone | AI Solutions for Your Business Growth" />
          <meta name="description" content="Fieldstone provides tailored AI frameworks, integration, and data analytics to empower your business for a digital future. Join us to elevate your operations with cutting-edge technology." />
          <meta name="keywords" content="AI solutions, AI frameworks, data analytics, business growth, Fieldstone, AI integration" />
          <meta name="robots" content="index, follow" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta charSet="UTF-8" />
          <link rel="canonical" href="https://www.fieldstone.pro" />
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://www.fieldstone.pro" />
          <meta property="og:title" content="Fieldstone | AI Solutions for Your Business Growth" />
          <meta property="og:description" content="Empowering businesses with AI frameworks, data-driven analytics, and seamless integration. Discover how Fieldstone can transform your operations." />
          <meta property="og:image" content="https://www.fieldstone.pro/preview.png" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:url" content="https://www.fieldstone.pro" />
          <meta name="twitter:title" content="Fieldstone | AI Solutions for Your Business Growth" />
          <meta name="twitter:description" content="Fieldstone helps businesses grow through AI frameworks, data insights, and advanced technology integration." />
          <meta name="twitter:image" content="https://www.fieldstone.pro/preview.png" />
        </head>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
