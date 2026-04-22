import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "English Learning App – Trợ lý học tiếng Anh AI",
  description:
    "Luyện IELTS, TOEIC với gia sư AI. Tra từ điển, flashcard, thử thách hàng ngày, luyện viết, và nhiều tính năng học tiếng Anh thông minh.",
};

export default function Home() {
  redirect("/home");
}
