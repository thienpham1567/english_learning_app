"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ReadOutlined,
  CheckCircleOutlined,
  StarOutlined,
  FilterOutlined,
  BookOutlined,
} from "@ant-design/icons";
import { Tag, Spin } from "antd";
import { api } from "@/lib/api-client";

type PassageItem = {
  id: string;
  title: string;
  cefrLevel: string;
  section: string;
  wordCount: number;
  newWordsCount: number;
  isRead: boolean;
  score: number;
};

const LEVELS = ["", "A2", "B1", "B2", "C1", "C2"] as const;

const LEVEL_COLORS: Record<string, string> = {
  A2: "#52c41a",
  B1: "#1890ff",
  B2: "#2f54eb",
  C1: "#722ed1",
  C2: "#eb2f96",
};

const LEVEL_LABELS: Record<string, string> = {
  "": "Tất cả",
  A2: "A2 · Elementary",
  B1: "B1 · Intermediate",
  B2: "B2 · Upper-Int",
  C1: "C1 · Advanced",
  C2: "C2 · Proficiency",
};

export default function GradedReaderPage() {
  const router = useRouter();
  const [passages, setPassages] = useState<PassageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState("");

  const fetchPassages = useCallback(async (lv: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort: "priority" });
      if (lv) params.set("level", lv);
      const data = await api.get<{ passages: PassageItem[] }>(`/reading/passages?${params}`);
      setPassages(data.passages ?? []);
    } catch {
      setPassages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPassages(level);
  }, [level, fetchPassages]);

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "var(--space-6)" }} className="anim-fade-up">
      <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Header */}
        <div>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-muted)" }}>
            GRADED READER
          </div>
          <h2 style={{ margin: "4px 0 0", fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 22, color: "var(--text-primary)" }}>
            Đọc theo cấp độ CEFR
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-secondary)" }}>
            Bài đọc được sắp xếp ưu tiên từ vựng mới cho bạn
          </p>
        </div>

        {/* Level filter pills (AC3) */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <FilterOutlined style={{ color: "var(--text-muted)", fontSize: 13, marginRight: 4 }} />
          {LEVELS.map((lv) => (
            <button
              key={lv}
              onClick={() => setLevel(lv)}
              style={{
                padding: "5px 14px",
                borderRadius: 20,
                border: level === lv ? `2px solid ${LEVEL_COLORS[lv] || "var(--accent)"}` : "1px solid var(--border)",
                background: level === lv ? (LEVEL_COLORS[lv] || "var(--accent)") : "var(--surface)",
                color: level === lv ? "#fff" : "var(--text)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {LEVEL_LABELS[lv]}
            </button>
          ))}
        </div>

        {/* Passages list */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <Spin size="large" />
          </div>
        ) : passages.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
            <BookOutlined style={{ fontSize: 40, marginBottom: 12 }} />
            <p>Không có bài đọc nào cho cấp độ này.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {passages.map((p) => (
              <button
                key={p.id}
                onClick={() => router.push(`/reading/graded/${p.id}`)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 18px",
                  borderRadius: 14,
                  border: "1px solid var(--border)",
                  background: p.isRead ? "var(--surface)" : "var(--card-bg)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                  opacity: p.isRead ? 0.7 : 1,
                }}
              >
                {/* Read indicator */}
                <span style={{ fontSize: 18, flexShrink: 0, color: p.isRead ? "#52c41a" : "var(--text-muted)" }}>
                  {p.isRead ? <CheckCircleOutlined /> : <ReadOutlined />}
                </span>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.title}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap", alignItems: "center" }}>
                    <Tag color={LEVEL_COLORS[p.cefrLevel] ? undefined : "default"} style={{ margin: 0, fontSize: 10, background: LEVEL_COLORS[p.cefrLevel] || undefined, color: LEVEL_COLORS[p.cefrLevel] ? "#fff" : undefined, border: "none" }}>
                      {p.cefrLevel}
                    </Tag>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {p.wordCount} từ · {p.section}
                    </span>
                  </div>
                </div>

                {/* New words badge */}
                {p.newWordsCount > 0 && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 4,
                    padding: "3px 10px", borderRadius: 12,
                    background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                    fontSize: 11, fontWeight: 600, color: "var(--accent)",
                    flexShrink: 0,
                  }}>
                    <StarOutlined style={{ fontSize: 10 }} />
                    {p.newWordsCount} từ mới
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
