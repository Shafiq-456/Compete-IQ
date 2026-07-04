import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CompeteIQ — AI Competitor Intelligence Agent",
  description:
    "Monitor competitors. Detect market changes. Generate business insights automatically with AI agents.",
  keywords: [
    "CompeteIQ",
    "competitive intelligence",
    "AI agents",
    "market monitoring",
    "business insights",
    "competitor analysis",
  ],
  authors: [{ name: "CompeteIQ" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "CompeteIQ — AI Competitor Intelligence Agent",
    description:
      "Monitor competitors. Detect market changes. Generate business insights automatically.",
    siteName: "CompeteIQ",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {/* Animated aurora background — fixed, behind all content (z-index:-1) */}
        <div className="aurora-bg" aria-hidden>
          <div className="aurora-blob aurora-blob-1" />
          <div className="aurora-blob aurora-blob-2" />
          <div className="aurora-blob aurora-blob-3" />
          <div className="aurora-grid" />
          <div className="aurora-noise" />
        </div>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <SonnerToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
