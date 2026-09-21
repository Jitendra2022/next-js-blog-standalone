import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | Lumina Blog",
    default: "Lumina | Modern Engineering, Tech & Design Insights",
  },
  description: "A production-grade, full-stack blog platform for developers, creators, and modern teams.",
  keywords: ["blog", "engineering", "technology", "nextjs", "react", "design", "development"],
  authors: [{ name: "Lumina Editorial Team" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://lumina-blog.dev",
    siteName: "Lumina Blog",
    title: "Lumina | Modern Engineering, Tech & Design Insights",
    description: "A production-grade, full-stack blog platform for developers, creators, and modern teams.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary flex flex-col`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              className: "!border !border-border !bg-card !text-card-foreground !shadow-xl",
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
