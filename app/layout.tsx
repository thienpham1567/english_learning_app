import type { Metadata } from "next";
import { Source_Sans_3, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "Trợ lý học tập tiếng Anh | Luyện tiếng Anh mỗi ngày",
  description:
    "Trợ lý học tập tiếng Anh với phản hồi trực tiếp, sửa lỗi rõ ràng và hội thoại tự nhiên mỗi ngày.",
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
    >
      <body className="min-h-screen bg-[var(--bg)] text-[15px] leading-[1.6] [font-family:var(--font-body)] text-[var(--text-primary)] antialiased">
        {children}
      </body>
    </html>
  );
}
