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
  ReadOutlined,
  SoundOutlined,
  FileTextOutlined,
  EditOutlined,
  AudioOutlined,
  SyncOutlined,
  ToolOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  FireOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import type { ReactNode } from "react";
import { Statistic, Skeleton, Empty, Button, Badge } from "antd";
import { api } from "@/lib/api-client";
import { ModuleHeader } from "@/components/shared/ModuleHeader";

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

// ── Group Config ────────────────────────────────────────────────────────────

interface ReviewGroup {
  key: string;
  label: string;
  description: string;
  icon: ReactNode;
  actionUrl: string;
  estimatedMinutes: number;
  count: number;
  priority: number;
  color: string;
}

const SOURCE_TO_GROUP: Record<string, { key: string; label: string; description: string; icon: ReactNode; actionUrl: string; color: string }> = {
  vocabulary: { key: "words", label: "Từ vựng cần nhớ", description: "Ôn lại flashcards từ vựng đã lưu", icon: <BookOutlined />, actionUrl: "/flashcards", color: "var(--accent)" },
  flashcard: { key: "words", label: "Từ vựng cần nhớ", description: "Ôn lại flashcards từ vựng đã lưu", icon: <BookOutlined />, actionUrl: "/flashcards", color: "var(--accent)" },
  error_log: { key: "mistakes", label: "Lỗi sai cần sửa", description: "Luyện lại các lỗi chưa nắm vững", icon: <ToolOutlined />, actionUrl: "/error-notebook", color: "var(--error)" },
  grammar_quiz: { key: "grammar", label: "Ngữ pháp cần ôn", description: "Ôn tập quy tắc ngữ pháp", icon: <ReadOutlined />, actionUrl: "/grammar-quiz", color: "var(--secondary)" },
  listening: { key: "listening", label: "Nghe cần luyện", description: "Luyện nghe bài đã học", icon: <SoundOutlined />, actionUrl: "/listening", color: "var(--info)" },
  reading: { key: "reading", label: "Bài đọc cần ôn", description: "Đọc lại bài đã lưu", icon: <FileTextOutlined />, actionUrl: "/reading", color: "var(--warning)" },
  writing: { key: "writing", label: "Bài viết cần sửa", description: "Xem lại feedback bài viết", icon: <EditOutlined />, actionUrl: "/writing-practice", color: "var(--xp)" },
  pronunciation: { key: "pronunciation", label: "Phát âm cần luyện", description: "Luyện lại phát âm yếu", icon: <AudioOutlined />, actionUrl: "/pronunciation", color: "var(--success)" },
};

const FALLBACK_GROUP = { key: "other", label: "Ôn tập khác", description: "Bài tập ôn tập bổ sung", icon: <SyncOutlined />, actionUrl: "/error-notebook", color: "var(--text-muted)" };

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
        description: config.description,
        icon: config.icon,
        actionUrl: config.actionUrl,
        estimatedMinutes: item.estimatedMinutes,
        count: 1,
        priority: item.priority,
        color: config.color,
      });
    }
  }
  return [...groupMap.values()].sort((a, b) => a.priority - b.priority);
}

// ── Quick Access Links ──────────────────────────────────────────────────────

const QUICK_LINKS = [
  { href: "/flashcards", label: "Flashcards", icon: <BookOutlined />, badgeKey: "flashcardsDue" as const },
  { href: "/error-notebook", label: "Sổ lỗi sai", icon: <ExclamationCircleOutlined />, badgeKey: "unresolvedErrors" as const },
];

// ── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ icon, value, label, color }: { icon: ReactNode; value: string; label: string; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        padding: "20px 12px",
        borderRadius: 16,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        flex: 1,
        minWidth: 0,
        transition: "transform 0.15s, box-shadow 0.15s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: `color-mix(in srgb, ${color} 12%, transparent)`,
          display: "grid",
          placeItems: "center",
          fontSize: 20,
          color,
        }}
      >
        {icon}
      </div>
      <Statistic
        value={value}
        valueStyle={{ fontSize: 24, fontWeight: 800, color: "var(--ink)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}
      />
      <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>{label}</span>
    </div>
  );
}

// ── Group Card ──────────────────────────────────────────────────────────────

function GroupCard({ group, index }: { group: ReviewGroup; index: number }) {
  const router = useRouter();

  return (
    <button
      type="button"
      className={`anim-fade-up anim-delay-${Math.min(index + 2, 8)}`}
      onClick={() => router.push(group.actionUrl)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        width: "100%",
        padding: "16px 18px",
        borderRadius: 14,
        border: "1px solid var(--border)",
        background: "var(--surface)",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.2s",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "var(--shadow-md)";
        e.currentTarget.style.borderColor = group.color;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = "var(--border)";
      }}
    >
      {/* Left accent bar */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: group.color, borderRadius: "3px 0 0 3px" }} />

      {/* Icon */}
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: `color-mix(in srgb, ${group.color} 10%, transparent)`,
          display: "grid",
          placeItems: "center",
          fontSize: 20,
          color: group.color,
          flexShrink: 0,
        }}
      >
        {group.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{group.label}</span>
          {group.priority <= 30 && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                padding: "2px 8px",
                borderRadius: 99,
                background: "color-mix(in srgb, var(--error) 12%, transparent)",
                color: "var(--error)",
              }}
            >
              Ưu tiên
            </span>
          )}
        </div>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {group.count} bài · ~{group.estimatedMinutes} phút
        </span>
      </div>

      {/* Arrow */}
      <ArrowRightOutlined style={{ fontSize: 13, color: "var(--text-muted)", opacity: 0.5, flexShrink: 0 }} />
    </button>
  );
}

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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        flex: 1,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div className="grain-overlay" style={{ opacity: 0.03, zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <ModuleHeader
          title="Ôn tập hôm nay"
          subtitle="Tập trung vào những gì cần nhớ nhất"
          icon={<HistoryOutlined />}
          gradient="var(--gradient-daily)"
        />
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "var(--space-8) var(--space-6)", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 640, margin: "0 auto", width: "100%" }}>

          {/* Loading */}
          {loading && (
            <div
              className="anim-scale-in"
              style={{
                padding: "24px",
                borderRadius: 20,
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              <Skeleton active paragraph={{ rows: 4 }} />
            </div>
          )}

          {/* Empty state */}
          {!loading && groups.length === 0 && (
            <div
              className="anim-scale-in"
              style={{
                padding: "60px 24px",
                borderRadius: 20,
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              <Empty
                image={<SmileOutlined style={{ fontSize: 34, color: "var(--success)" }} />}
                description={
                  <>
                    <h3 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700, color: "var(--ink)" }}>
                      Không có gì cần ôn hôm nay!
                    </h3>
                    <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)", maxWidth: 340, marginInline: "auto" }}>
                      Hãy tiếp tục học bài mới — hệ thống sẽ tự nhắc bạn ôn tập khi cần.
                    </p>
                  </>
                }
              />
            </div>
          )}

          {/* Main content */}
          {!loading && groups.length > 0 && (
            <>
              {/* Summary stats */}
              <div
                className="anim-fade-up"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                  gap: 12,
                  marginBottom: 24,
                }}
              >
                <StatCard
                  icon={<InboxOutlined />}
                  value={String(totalItems)}
                  label="Bài cần ôn"
                  color="var(--accent)"
                />
                <StatCard
                  icon={<ClockCircleOutlined />}
                  value={`~${totalMinutes}`}
                  label="Phút"
                  color="var(--warning)"
                />
                <StatCard
                  icon={<ThunderboltOutlined />}
                  value={String(groups.length)}
                  label="Kỹ năng"
                  color="var(--secondary)"
                />
              </div>

              {/* Section header */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <FireOutlined style={{ fontSize: 14, color: "var(--accent)" }} />
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--accent)" }}>
                  Theo kỹ năng
                </span>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              </div>

              {/* Group cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                {groups.map((group, i) => (
                  <GroupCard key={group.key} group={group} index={i} />
                ))}
              </div>

              {/* Start CTA */}
              <Button
                type="primary"
                size="large"
                block
                className="anim-fade-up anim-delay-5"
                onClick={() => router.push("/review/session")}
                icon={<ThunderboltOutlined />}
                style={{
                  borderRadius: 14,
                  height: "auto",
                  padding: "14px 24px",
                  background: "linear-gradient(135deg, var(--accent), var(--secondary))",
                  border: "none",
                  fontSize: 15,
                  fontWeight: 700,
                  boxShadow: "0 4px 16px color-mix(in srgb, var(--accent) 30%, transparent)",
                }}
              >
                Bắt đầu ôn tập ngay <RightOutlined style={{ fontSize: 12, opacity: 0.7 }} />
              </Button>
            </>
          )}

          {/* Quick access links */}
          {!loading && (
            <div className="anim-fade-up anim-delay-6" style={{ marginTop: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <BookOutlined style={{ fontSize: 13, color: "var(--text-muted)" }} />
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--text-muted)" }}>
                  Truy cập nhanh
                </span>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                {QUICK_LINKS.map((link) => {
                  const badgeValue = legacy[link.badgeKey];
                  return (
                    <Button
                      key={link.href}
                      onClick={() => router.push(link.href)}
                      icon={link.icon}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "12px 16px",
                        borderRadius: 12,
                        height: "auto",
                        fontWeight: 600,
                      }}
                    >
                      {link.label}
                      {badgeValue > 0 && (
                        <Badge
                          count={badgeValue}
                          size="small"
                          style={{
                            marginLeft: "auto",
                            backgroundColor: "var(--warning)",
                          }}
                        />
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
