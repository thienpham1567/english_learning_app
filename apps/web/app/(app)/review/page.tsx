"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LoadingOutlined,
  BookOutlined,
  HistoryOutlined,
  ExclamationCircleOutlined,
  ArrowRightOutlined,
  SmileOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { Card, Empty, Flex, Typography, Tag } from "antd";
import { api } from "@/lib/api-client";
import { ModuleHeader } from "@/components/shared/ModuleHeader";

const { Title, Text } = Typography;

// ── Types ───────────────────────────────────────────────────────────────────

interface DueReviewItem {
  id: string;
  sourceType: string;
  sourceId: string;
  skillIds: string[];
  priority: number;
  dueAt: string;
  estimatedMinutes: number;
  reviewMode: string;
  reason: string;
}

interface DueReviewResponse {
  items: DueReviewItem[];
  legacy: {
    flashcardsDue: number;
    unresolvedErrors: number;
  };
}

// ── Learner-Friendly Grouping (mirrors packages/modules logic) ──────────────

interface ReviewGroup {
  key: string;
  label: string;
  emoji: string;
  actionUrl: string;
  estimatedMinutes: number;
  count: number;
  priority: number;
}

const SOURCE_TO_GROUP: Record<string, { key: string; label: string; emoji: string; actionUrl: string }> = {
  vocabulary: { key: "words", label: "Từ vựng cần nhớ", emoji: "📚", actionUrl: "/flashcards" },
  flashcard: { key: "words", label: "Từ vựng cần nhớ", emoji: "📚", actionUrl: "/flashcards" },
  error_log: { key: "mistakes", label: "Lỗi sai cần sửa", emoji: "🔧", actionUrl: "/review-quiz" },
  grammar_quiz: { key: "grammar", label: "Ngữ pháp cần ôn", emoji: "📖", actionUrl: "/grammar-quiz" },
  listening: { key: "listening", label: "Nghe cần luyện", emoji: "🎧", actionUrl: "/listening" },
  reading: { key: "reading", label: "Bài đọc cần ôn", emoji: "📄", actionUrl: "/reading" },
  writing: { key: "writing", label: "Bài viết cần sửa", emoji: "✍️", actionUrl: "/writing-practice" },
  pronunciation: { key: "pronunciation", label: "Phát âm cần luyện", emoji: "🗣️", actionUrl: "/pronunciation" },
};

const FALLBACK_GROUP = { key: "other", label: "Ôn tập khác", emoji: "🔄", actionUrl: "/review-quiz" };

function groupItems(items: DueReviewItem[]): ReviewGroup[] {
  const groupMap = new Map<string, ReviewGroup>();
  for (const item of items) {
    const config = SOURCE_TO_GROUP[item.sourceType] ?? FALLBACK_GROUP;
    const existing = groupMap.get(config.key);
    if (existing) {
      existing.count += 1;
      existing.estimatedMinutes += item.estimatedMinutes;
      existing.priority = Math.min(existing.priority, item.priority);
    } else {
      groupMap.set(config.key, {
        key: config.key,
        label: config.label,
        emoji: config.emoji,
        actionUrl: config.actionUrl,
        estimatedMinutes: item.estimatedMinutes,
        count: 1,
        priority: item.priority,
      });
    }
  }
  return [...groupMap.values()].sort((a, b) => a.priority - b.priority);
}

// ── Legacy Links (AC: 4) ────────────────────────────────────────────────────

const LEGACY_LINKS = [
  { href: "/flashcards", label: "Flashcards", icon: <BookOutlined /> },
  { href: "/review-quiz", label: "Ôn lỗi sai", icon: <HistoryOutlined /> },
  { href: "/error-notebook", label: "Sổ lỗi sai", icon: <ExclamationCircleOutlined /> },
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ReviewHubPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<ReviewGroup[]>([]);
  const [legacy, setLegacy] = useState<{ flashcardsDue: number; unresolvedErrors: number }>({
    flashcardsDue: 0,
    unresolvedErrors: 0,
  });
  const [totalItems, setTotalItems] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);

  const fetchDue = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<DueReviewResponse>("/review/due");
      const grouped = groupItems(data.items);
      setGroups(grouped);
      setLegacy(data.legacy);
      setTotalItems(data.items.length);
      setTotalMinutes(grouped.reduce((sum, g) => sum + g.estimatedMinutes, 0));
    } catch {
      setGroups([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchDue();
  }, [fetchDue]);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 16px 40px" }}>
      <ModuleHeader
        title="Ôn tập hôm nay"
        subtitle="Ôn tập thông minh — tập trung vào những gì cần nhớ nhất"
        icon={<HistoryOutlined />}
      />

      {/* Loading */}
      {loading && (
        <Flex justify="center" align="center" style={{ padding: 60 }}>
          <LoadingOutlined style={{ fontSize: 32, color: "var(--accent)" }} />
        </Flex>
      )}

      {/* Empty state */}
      {!loading && groups.length === 0 && (
        <Card style={{ borderRadius: "var(--radius-xl)", marginTop: 20 }}>
          <Empty
            description={
              <div>
                <p style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px" }}>
                  <SmileOutlined /> Không có gì cần ôn hôm nay!
                </p>
                <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: 13 }}>
                  Hãy tiếp tục học bài mới — hệ thống sẽ tự nhắc bạn ôn tập khi cần.
                </p>
              </div>
            }
          />
        </Card>
      )}

      {/* Review Groups (AC: 1, 2) */}
      {!loading && groups.length > 0 && (
        <>
          {/* Summary strip */}
          <Flex gap={12} style={{ marginTop: 20, marginBottom: 16 }} wrap>
            <Tag
              color="blue"
              style={{ fontSize: 12, padding: "4px 12px", borderRadius: 99 }}
            >
              {totalItems} bài cần ôn
            </Tag>
            <Tag
              color="orange"
              style={{ fontSize: 12, padding: "4px 12px", borderRadius: 99 }}
            >
              ~{totalMinutes} phút
            </Tag>
          </Flex>

          {/* Group cards */}
          <Flex vertical gap={12}>
            {groups.map((group) => (
              <Card
                key={group.key}
                hoverable
                onClick={() => router.push(group.actionUrl)}
                style={{
                  borderRadius: "var(--radius-xl)",
                  cursor: "pointer",
                  border: "1px solid var(--border)",
                  transition: "box-shadow 0.15s ease, transform 0.15s ease",
                }}
                styles={{ body: { padding: "16px 20px" } }}
              >
                <Flex align="center" gap={16}>
                  <span style={{ fontSize: 28 }}>{group.emoji}</span>
                  <Flex vertical style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>
                      {group.label}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {group.count} bài · ~{group.estimatedMinutes} phút
                      {group.priority <= 30 && (
                        <Tag
                          color="red"
                          style={{ marginLeft: 8, fontSize: 10, borderRadius: 6 }}
                        >
                          Ưu tiên cao
                        </Tag>
                      )}
                    </Text>
                  </Flex>
                  <ArrowRightOutlined style={{ fontSize: 14, color: "var(--text-muted)", opacity: 0.6 }} />
                </Flex>
              </Card>
            ))}
          </Flex>

          {/* Start Mixed Review CTA (AC: 3) */}
          <button
            className="cta-shimmer"
            onClick={() => router.push("/review/session")}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              padding: "16px 24px",
              marginTop: 20,
              borderRadius: "var(--radius-xl)",
              border: "none",
              background: "linear-gradient(135deg, var(--accent), var(--secondary))",
              color: "var(--text-on-accent)",
              fontSize: 15,
              fontWeight: 700,
              fontFamily: "var(--font-body)",
              cursor: "pointer",
              boxShadow: "0 4px 16px color-mix(in srgb, var(--accent) 30%, transparent)",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.01)";
              e.currentTarget.style.boxShadow = "0 6px 24px color-mix(in srgb, var(--accent) 40%, transparent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 4px 16px color-mix(in srgb, var(--accent) 30%, transparent)";
            }}
            aria-label="Bắt đầu ôn tập"
          >
            <span style={{ fontSize: 18 }}>🚀</span>
            <span>Bắt đầu ôn tập ngay</span>
            <RightOutlined style={{ marginLeft: "auto", opacity: 0.7, fontSize: 14 }} />
          </button>
        </>
      )}

      {/* Legacy Links (AC: 4) */}
      {!loading && (
        <Card
          title={
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              <BookOutlined style={{ marginRight: 6 }} />
              Truy cập nhanh
            </span>
          }
          style={{ borderRadius: "var(--radius-xl)", marginTop: 20 }}
          styles={{ body: { padding: "8px 16px" } }}
        >
          <Flex vertical gap={4}>
            {LEGACY_LINKS.map((link) => {
              const badge =
                link.href === "/flashcards" && legacy.flashcardsDue > 0
                  ? legacy.flashcardsDue
                  : link.href === "/error-notebook" && legacy.unresolvedErrors > 0
                    ? legacy.unresolvedErrors
                    : null;
              return (
                <button
                  key={link.href}
                  onClick={() => router.push(link.href)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: "var(--radius)",
                    border: "none",
                    background: "transparent",
                    color: "var(--text)",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    width: "100%",
                    textAlign: "left",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent-muted)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ color: "var(--accent)", fontSize: 14 }}>{link.icon}</span>
                  <span>{link.label}</span>
                  {badge && (
                    <Tag color="orange" style={{ marginLeft: "auto", fontSize: 11, borderRadius: 99 }}>
                      {badge}
                    </Tag>
                  )}
                  <ArrowRightOutlined style={{ marginLeft: badge ? 0 : "auto", opacity: 0.4, fontSize: 12 }} />
                </button>
              );
            })}
          </Flex>
        </Card>
      )}
    </div>
  );
}
