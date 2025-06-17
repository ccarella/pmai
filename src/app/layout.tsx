import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { Header } from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GitHub Issue Generator | Dracula Theme",
  description: "Create comprehensive, AI-optimized GitHub issues with a beautiful Dracula-themed interface",
  manifest: "/manifest.json",
  themeColor: "#bd93f9",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PMAI",
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground transition-colors duration-200`}
      >
        <SessionProvider>
          <Header />
          <div className="relative min-h-screen pt-14">
            <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-card-bg opacity-50 pointer-events-none" />
            <div className="relative z-10">
              {children}
            </div>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
