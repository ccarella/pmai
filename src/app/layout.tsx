import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { OnboardingProvider } from "@/components/providers/OnboardingProvider";
import { RepositoryProvider } from "@/contexts/RepositoryContext";
import { Header } from "@/components/Header";
import { ToastContainer } from "@/components/ui/Toast";

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
      { url: "/favicon.png", type: "image/png" },
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
        <ThemeProvider defaultTheme="system">
          <SessionProvider>
            <OnboardingProvider>
              <RepositoryProvider>
                <Header />
                <ToastContainer />
                <div className="relative min-h-screen pt-[104px]">
                  <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-card-bg opacity-50 pointer-events-none" />
                  <div className="relative z-10">
                    {children}
                  </div>
                </div>
              </RepositoryProvider>
            </OnboardingProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
