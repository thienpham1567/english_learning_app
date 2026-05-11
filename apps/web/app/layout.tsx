import type { Metadata } from "next";
import { Source_Sans_3, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const metadataBase = new URL(
  process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "http://localhost:3000",
);

const sourceSans = Source_Sans_3({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-body",
});

const fraunces = Fraunces({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-display",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

import { AntdRegistry } from "@ant-design/nextjs-registry";

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
      className={`${sourceSans.variable} ${fraunces.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6366f1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        <AntdRegistry>{children}</AntdRegistry>
      </body>
    </html>
  );
}
