import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Đăng nhập – English Learning App",
  description:
    "Đăng nhập bằng Google để bắt đầu học tiếng Anh với gia sư AI, tra từ điển, flashcard và thử thách hàng ngày.",
};

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
