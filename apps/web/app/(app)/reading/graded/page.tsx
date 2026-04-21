"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ReadOutlined,
  CheckCircleFilled,
  StarFilled,
  FilterOutlined,
  BookOutlined,
  FileTextOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { Card, Tag, Spin, Flex, Typography, Empty } from "antd";
import { api } from "@/lib/api-client";

const { Text, Title } = Typography;

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

const SECTION_ICONS: Record<string, React.ReactNode> = {
  lifestyle: "🏠",
  travel: "✈️",
  food: "🍳",
  health: "💪",
  technology: "💻",
  environment: "🌿",
  education: "📚",
  science: "🔬",
  business: "💼",
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

  const readCount = passages.filter((p) => p.isRead).length;

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "var(--space-6)" }} className="anim-fade-up">
      <Flex vertical gap={20} style={{ maxWidth: 800, margin: "0 auto" }}>

        {/* Hero header */}
        <Card
          style={{
            borderRadius: 20,
            background: "linear-gradient(135deg, var(--accent), var(--secondary))",
            border: "none",
          }}
          styles={{ body: { padding: "24px 28px" } }}
        >
          <Flex align="center" gap={16}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: "rgba(255,255,255,0.2)", display: "flex",
              alignItems: "center", justifyContent: "center",
            }}>
              <BookOutlined style={{ fontSize: 24, color: "#fff" }} />
            </div>
            <div>
              <Text style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.7)" }}>
                GRADED READER
              </Text>
              <Title level={4} style={{ margin: 0, color: "#fff", fontFamily: "var(--font-display)", fontStyle: "italic" }}>
                Đọc theo cấp độ CEFR
              </Title>
            </div>
            {passages.length > 0 && (
              <div style={{ marginLeft: "auto", textAlign: "center" }}>
                <Text style={{ fontSize: 22, fontWeight: 700, color: "#fff" }}>{readCount}/{passages.length}</Text>
                <br />
                <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>đã đọc</Text>
              </div>
            )}
          </Flex>
        </Card>

        {/* Level filter pills */}
        <Card style={{ borderRadius: 16 }} styles={{ body: { padding: "12px 16px" } }}>
          <Flex gap={8} wrap align="center">
            <FilterOutlined style={{ color: "var(--text-muted)", fontSize: 14 }} />
            {LEVELS.map((lv) => {
              const active = level === lv;
              const color = LEVEL_COLORS[lv] || "var(--accent)";
              return (
                <button
                  key={lv}
                  onClick={() => setLevel(lv)}
                  style={{
                    padding: "6px 16px",
                    borderRadius: 20,
                    border: active ? `2px solid ${color}` : "1px solid var(--border)",
                    background: active ? color : "transparent",
                    color: active ? "#fff" : "var(--text-secondary)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  {LEVEL_LABELS[lv]}
                </button>
              );
            })}
          </Flex>
        </Card>

        {/* Passages list */}
        {loading ? (
          <Flex justify="center" align="center" style={{ padding: 80 }}>
            <Spin size="large" />
          </Flex>
        ) : passages.length === 0 ? (
          <Empty
            image={<BookOutlined style={{ fontSize: 48, color: "var(--text-muted)" }} />}
            description="Không có bài đọc nào cho cấp độ này"
            style={{ padding: 60 }}
          />
        ) : (
          <Flex vertical gap={10}>
            {passages.map((p) => (
              <Card
                key={p.id}
                hoverable
                onClick={() => router.push(`/reading/graded/${p.id}`)}
                style={{
                  borderRadius: 16,
                  cursor: "pointer",
                  opacity: p.isRead ? 0.75 : 1,
                  transition: "all 0.2s ease",
                }}
                styles={{ body: { padding: "14px 20px" } }}
              >
                <Flex align="center" gap={14}>
                  {/* Read indicator icon */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: p.isRead
                      ? "linear-gradient(135deg, #52c41a20, #52c41a10)"
                      : `linear-gradient(135deg, ${LEVEL_COLORS[p.cefrLevel] || "var(--accent)"}15, ${LEVEL_COLORS[p.cefrLevel] || "var(--accent)"}08)`,
                    flexShrink: 0,
                  }}>
                    {p.isRead
                      ? <CheckCircleFilled style={{ fontSize: 20, color: "#52c41a" }} />
                      : <FileTextOutlined style={{ fontSize: 18, color: LEVEL_COLORS[p.cefrLevel] || "var(--accent)" }} />
                    }
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontSize: 14, fontWeight: 600, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.title}
                    </Text>
                    <Flex gap={8} align="center" style={{ marginTop: 4 }}>
                      <Tag
                        style={{
                          margin: 0, fontSize: 10, fontWeight: 700, borderRadius: 6,
                          background: LEVEL_COLORS[p.cefrLevel] || undefined,
                          color: LEVEL_COLORS[p.cefrLevel] ? "#fff" : undefined,
                          border: "none",
                        }}
                      >
                        {p.cefrLevel}
                      </Tag>
                      <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {SECTION_ICONS[p.section] || "📄"} {p.wordCount} từ
                      </Text>
                    </Flex>
                  </div>

                  {/* New words badge */}
                  {p.newWordsCount > 0 && (
                    <Tag
                      style={{
                        margin: 0, borderRadius: 12, border: "none",
                        background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                        color: "var(--accent)", fontWeight: 600, fontSize: 11,
                        display: "flex", alignItems: "center", gap: 4,
                        padding: "2px 10px",
                      }}
                    >
                      <StarFilled style={{ fontSize: 10 }} />
                      {p.newWordsCount} mới
                    </Tag>
                  )}

                  <RightOutlined style={{ fontSize: 12, color: "var(--text-muted)", flexShrink: 0 }} />
                </Flex>
              </Card>
            ))}
          </Flex>
        )}
      </Flex>
    </div>
  );
}
