import type { Metadata } from "next";
import "./globals.css";
import "./civic.css";
import "./community.css";
import "./missions.css";
import "./games.css";
import { Toaster } from "@/components/ui/toaster";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.cosmogov.com"),
  title: {
    default: "Cosmogov — Your community, with an AI team",
    template: "%s",
  },
  description:
    "A shared workspace for communities. Research a goal, turn ideas into plans and simple forms, and decide together. AI helps with the legwork; people make every decision.",
  applicationName: "Cosmogov",
  keywords: [
    "community participation",
    "civic tech",
    "participatory budgeting",
    "community decisions",
    "public consultation",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Cosmogov",
    url: "https://www.cosmogov.com",
    title: "Cosmogov — Your community, with an AI team",
    description:
      "A shared workspace for communities to research goals, make plans and decide together. AI helps; people decide.",
    images: [{ url: "/images/park.jpg", alt: "A sunny tree-lined path through a public park" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cosmogov — Your community, with an AI team",
    description:
      "A shared workspace for communities to research goals, make plans and decide together. AI helps; people decide.",
    images: ["/images/park.jpg"],
  },
  icons: {
    icon: "/logo.svg",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Cosmogov",
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
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="antialiased">
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        {children}
        <ServiceWorkerRegistrar />
        <Toaster />
      </body>
    </html>
  );
}
