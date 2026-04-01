import { ReactNode } from "react";
import "./globals.css";
import localFont from "next/font/local";
import { Providers } from "./providers";
import { headers } from "next/headers";
import type { Metadata } from "next";

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

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const isSignal = host.startsWith("signal.");

  if (isSignal) {
    return {
      title: "Signal — Work Intelligence Platform",
      description:
        "Signal reads your tickets, extracts structured intelligence, and surfaces outbreak patterns across your clients automatically. Built for MSPs, software teams, and field ops.",
      keywords: [
        "work intelligence",
        "ticket management",
        "MSP software",
        "outbreak detection",
        "AI dispatch",
        "Signal",
        "Fieldstone",
      ],
      robots: { index: true, follow: true },
      alternates: { canonical: "https://signal.fieldstone.pro" },
      openGraph: {
        type: "website",
        url: "https://signal.fieldstone.pro",
        siteName: "Signal",
        title: "Signal — Work Intelligence Platform",
        description:
          "Know what is breaking before it escalates. Connect your inbox. Signal does the rest.",
      },
      twitter: {
        card: "summary_large_image",
        title: "Signal — Work Intelligence Platform",
        description:
          "Know what is breaking before it escalates. Connect your inbox. Signal does the rest.",
      },
    };
  }

  return {
    title: "Fieldstone | AI Solutions for Your Business Growth",
    description:
      "Fieldstone provides tailored AI frameworks, integration, and data analytics to empower your business for a digital future.",
    keywords: [
      "AI solutions",
      "AI frameworks",
      "data analytics",
      "business growth",
      "Fieldstone",
      "AI integration",
    ],
    robots: { index: true, follow: true },
    alternates: { canonical: "https://www.fieldstone.pro" },
    openGraph: {
      type: "website",
      url: "https://www.fieldstone.pro",
      siteName: "Fieldstone",
      title: "Fieldstone | AI Solutions for Your Business Growth",
      description:
        "Empowering businesses with AI frameworks, data-driven analytics, and seamless integration. Discover how Fieldstone can transform your operations.",
    },
    twitter: {
      card: "summary_large_image",
      title: "Fieldstone | AI Solutions for Your Business Growth",
      description:
        "Fieldstone helps businesses grow through AI frameworks, data insights, and advanced technology integration.",
    },
  };
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="UTF-8" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
