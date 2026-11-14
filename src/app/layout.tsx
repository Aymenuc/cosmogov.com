import type { Metadata } from "next";
import "./globals.css";
import "./civic.css";
import { Toaster } from "@/components/ui/toaster";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";

export const metadata: Metadata = {
  title: "Cosmogov — Better decisions, made together",
  description: "A shared space for civic participation. Propose ideas, make community decisions, and follow progress with Cosmogov.",
  keywords: ["governance", "voting", "AI", "gamification", "civic tech", "decision making"],
  icons: {
    icon: "/logo.svg",
  },
  manifest: "/manifest.webmanifest",
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="antialiased">
        <a className="skip-link" href="#main-content">Skip to content</a>
        {children}
        <ServiceWorkerRegistrar />
        <Toaster />
      </body>
    </html>
  );
}
