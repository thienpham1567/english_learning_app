import type { Metadata } from "next";
import "./globals.css";

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
