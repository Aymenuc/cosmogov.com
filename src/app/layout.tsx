import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";

export const metadata: Metadata = {
  title: "CosmoGov — Interstellar Civic OS",
  description: "Where governance meets the cosmos. AI-powered governance platform with gamified decision-making, real-time voting, and interstellar civic tools.",
  keywords: ["governance", "voting", "AI", "gamification", "civic tech", "decision making"],
  icons: {
    icon: "/favicon.ico",
  },
  manifest: "/manifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CosmoGov",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="antialiased bg-[#04050b] text-[#F2F5FF]">
        <div className="grain-overlay" />
        {children}
        <ServiceWorkerRegistrar />
        <Toaster />
      </body>
    </html>
  );
}
