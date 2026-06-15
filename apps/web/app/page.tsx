import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "TOEIC Master – Luyện thi TOEIC 4 Skills với AI",
  description:
    "Ứng dụng luyện thi TOEIC 4 Skills: Listening, Reading, Speaking, Writing. Luyện đề ETS chính hãng, AI chấm điểm, theo dõi tiến độ và dự đoán điểm TOEIC.",
};

export default function Home() {
  redirect("/toeic/practice");
}
