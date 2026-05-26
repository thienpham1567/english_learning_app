import type { Metadata } from "next";
import { Source_Sans_3, Space_Grotesk, JetBrains_Mono } from "next/font/google";
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
  title: "TOEIC Master – Luyện thi TOEIC 4 Skills với AI",
  description:
    "Ứng dụng luyện thi TOEIC 4 Skills: Listening, Reading, Speaking, Writing. Luyện đề ETS chính hãng, AI chấm điểm, theo dõi tiến độ.",
  openGraph: {
    title: "TOEIC Master – Luyện thi TOEIC 4 Skills với AI",
    description:
      "Ứng dụng luyện thi TOEIC 4 Skills: Listening, Reading, Speaking, Writing. Luyện đề ETS chính hãng, AI chấm điểm, theo dõi tiến độ.",
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
      lang="vi"
      className={cn(
        sourceSans.variable,
        spaceGrotesk.variable,
        jetbrainsMono.variable,
      )}
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
      </body>
    </html>
  );
}
