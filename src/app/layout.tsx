import { ReactNode } from "react";
import "./globals.css";
import localFont from "next/font/local";
import { Providers } from "./providers";

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
  title: "Signal — Work Intelligence Platform",
  description: "Signal is a work intelligence platform for ticket-driven and request-driven operations. Surface patterns, draft outcomes, and act with context.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="title" content="Signal — Work Intelligence Platform" />
        <meta name="description" content="Signal is a work intelligence platform for ticket-driven and request-driven operations. Capture, understand, advise, and learn." />
        <meta name="keywords" content="AI solutions, AI frameworks, data analytics, business growth, Fieldstone, AI integration" />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="UTF-8" />
        <link rel="canonical" href="https://www.fieldstone.pro" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.fieldstone.pro" />
        <meta property="og:title" content="Signal — Work Intelligence Platform" />
        <meta property="og:description" content="Work intelligence for ticket-driven and request-driven operations. Surface patterns, draft outcomes, and act with context." />
        <meta property="og:image" content="https://www.fieldstone.pro/preview.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://www.fieldstone.pro" />
        <meta name="twitter:title" content="Signal — Work Intelligence Platform" />
        <meta name="twitter:description" content="Signal: work intelligence for ticket-driven and request-driven operations." />
        <meta name="twitter:image" content="https://www.fieldstone.pro/preview.png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
