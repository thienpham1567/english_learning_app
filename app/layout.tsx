import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cô Minh English — Your Witty AI Tutor",
  description:
    "Practice English with Cô Minh, a legendary sassy Vietnamese-English teacher who teases your mistakes and celebrates your wins.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ fontFamily: inter.style.fontFamily }}>{children}</body>
    </html>
  );
}
