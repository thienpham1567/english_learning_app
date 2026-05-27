import type { Metadata } from "next";
import { JetBrains_Mono, Source_Sans_3, Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import "./globals.css";

const metadataBase = new URL(
  process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "http://localhost:3000",
);

const sourceSans = Source_Sans_3({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-body",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-display",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase,
  title: "TOEIC Master – Master TOEIC 4 Skills with AI",
  description:
    "Complete TOEIC 4 Skills preparation application: Listening, Reading, Speaking, Writing. Practice authentic ETS tests, get AI-powered grading, and track score progress.",
  openGraph: {
    title: "TOEIC Master – Master TOEIC 4 Skills with AI",
    description:
      "Complete TOEIC 4 Skills preparation application: Listening, Reading, Speaking, Writing. Practice authentic ETS tests, get AI-powered grading, and track score progress.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(sourceSans.variable, spaceGrotesk.variable, jetbrainsMono.variable)}
      suppressHydrationWarning
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#C07D2B" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        {children}
        <Toaster
          position="top-center"
          gap={10}
          toastOptions={{
            unstyled: true,
            classNames: {
              toast: "neo-toast",
              title: "neo-toast-title",
              description: "neo-toast-description",
              actionButton: "neo-toast-action",
              cancelButton: "neo-toast-cancel",
              success: "neo-toast--success",
              error: "neo-toast--error",
              warning: "neo-toast--warning",
              info: "neo-toast--info",
            },
          }}
        />
      </body>
    </html>
  );
}
