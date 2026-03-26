import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cô Minh English | Luyện tiếng Anh cùng cô Minh",
  description:
    "Luyện tiếng Anh cùng cô Minh với phản hồi trực tiếp, sửa lỗi rõ ràng và hội thoại tự nhiên mỗi ngày.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body style={{ fontFamily: inter.style.fontFamily }}>{children}</body>
    </html>
  );
}
