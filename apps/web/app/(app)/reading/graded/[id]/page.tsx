"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  BookOutlined,
} from "@ant-design/icons";
import { Tag } from "antd";
import { api } from "@/lib/api-client";
import { WordClickableText } from "@/app/(app)/reading/_components/WordClickableText";
import { useReadingSession } from "@/hooks/useReadingSession";

type PassageDetail = {
  id: string;
  title: string;
  body: string;
  cefrLevel: string;
  section: string;
  wordCount: number;
  isRead: boolean;
};

const LEVEL_COLORS: Record<string, string> = {
  A2: "#52c41a", B1: "#1890ff", B2: "#2f54eb", C1: "#722ed1", C2: "#eb2f96",
};

export default function GradedPassagePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [passage, setPassage] = useState<PassageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [marked, setMarked] = useState(false);

  // Reading session tracking (Story 19.4.3)
  const { finish: finishSession } = useReadingSession(passage ? id : undefined);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get<PassageDetail>(`/reading/passages/${id}`)
      .then((data) => { setPassage(data); setMarked(data.isRead); })
      .catch(() => setPassage(null))
      .finally(() => setLoading(false));
  }, [id]);

  const markRead = useCallback(async () => {
    if (!id || marked) return;
    try {
      await api.post(`/reading/passages/${id}/read`, {});
      await finishSession(); // Also complete the reading session
      setMarked(true);
    } catch { /* ignore */ }
  }, [id, marked, finishSession]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", padding: 60 }}>
        <LoadingOutlined style={{ fontSize: 32, color: "var(--accent)" }} />
      </div>
    );
  }

  if (!passage) {
    return (
      <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
        <BookOutlined style={{ fontSize: 40, marginBottom: 12 }} />
        <p>Passage not found.</p>
        <a href="/reading/graded" style={{ color: "var(--accent)" }}>← Quay lại</a>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "var(--space-6)" }}>
      <div style={{ maxWidth: 700, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Back link */}
        <a href="/reading/graded" style={{ color: "var(--text-muted)", fontSize: 13, display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
          <ArrowLeftOutlined /> Quay lại danh sách
        </a>

        {/* Header */}
        <div style={{ padding: 20, borderRadius: 16, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
            <Tag style={{ margin: 0, background: LEVEL_COLORS[passage.cefrLevel], color: "#fff", border: "none", fontWeight: 700 }}>
              {passage.cefrLevel}
            </Tag>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {passage.wordCount} từ · {passage.section}
            </span>
            {marked && (
              <span style={{ fontSize: 12, color: "#52c41a", display: "flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
                <CheckCircleOutlined /> Đã đọc
              </span>
            )}
          </div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--text)", lineHeight: 1.4 }}>
            {passage.title}
          </h1>
        </div>

        {/* Body — click any word to define (Story 19.4.2) */}
        <div style={{
          padding: 24,
          borderRadius: 16,
          background: "var(--card-bg)",
          border: "1px solid var(--border)",
        }}>
          <WordClickableText
            text={passage.body}
            style={{
              fontSize: 15,
              lineHeight: 1.9,
              color: "var(--text)",
              fontFamily: "Georgia, 'Times New Roman', serif",
            }}
          />
        </div>

        {/* Mark as read */}
        {!marked && (
          <button
            onClick={markRead}
            style={{
              padding: "12px 24px",
              borderRadius: 10,
              border: "none",
              background: "var(--accent)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              alignSelf: "center",
            }}
          >
            <CheckCircleOutlined style={{ marginRight: 6 }} />
            Đánh dấu đã đọc
          </button>
        )}

        {/* Cloze Test CTA (Story 19.4.4, AC1) */}
        {marked && (
          <div style={{
            padding: 20,
            borderRadius: 14,
            background: "linear-gradient(135deg, var(--accent), var(--secondary))",
            textAlign: "center",
          }}>
            <p style={{ margin: "0 0 10px", color: "#fff", fontSize: 14, fontWeight: 500 }}>
              ✨ Bạn đã đọc xong! Kiểm tra từ vựng ngay?
            </p>
            <button
              onClick={() => router.push(`/reading/graded/${id}/cloze`)}
              style={{
                padding: "10px 24px",
                borderRadius: 8,
                border: "2px solid #fff",
                background: "transparent",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              📝 Làm bài cloze test
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
