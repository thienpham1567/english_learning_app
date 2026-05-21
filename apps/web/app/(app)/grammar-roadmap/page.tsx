"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import * as m from "motion/react-client";
import { AnimatePresence } from "motion/react";
import {
  BookOutlined,
  CheckCircleFilled,
  LockOutlined,
  RocketOutlined,
  StarFilled,
  ThunderboltOutlined,
  ArrowRightOutlined,
  TrophyOutlined,
  NodeIndexOutlined,
  FireOutlined,
  BulbOutlined,
  AimOutlined,
  GlobalOutlined,
  ToolOutlined,
  SafetyCertificateOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { Progress, Tooltip } from "antd";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { api } from "@/lib/api-client";
import {
  getCategoriesForExam,
  type GrammarTopicCategory,
  type GrammarTopic,
} from "@/lib/grammar-lessons/topics";
import type { GrammarLessonProgressItem } from "@/lib/grammar-lessons/schema";

// ── Progress response from API ──
type ProgressResponse = {
  progress: GrammarLessonProgressItem[];
  summary: {
    totalTopics: number;
    totalCompleted: number;
    completedTopicIds: string[];
    progressByTopic: Record<string, GrammarLessonProgressItem>;
  };
  recommendedTopic: GrammarTopic | null;
};

// ── Phase mapping — TOEIC expert roadmap ──
// As someone who scored 900 L&R, this is the strategic learning order
const PHASE_CONFIG = [
  {
    id: 1,
    title: "Nền Tảng Vững Chắc",
    sub: "Xây dựng gốc rễ ngữ pháp — nền tảng bắt buộc trước khi chạm Part 5/6",
    color: "var(--success)",
    gradient: "linear-gradient(135deg, #059669, #10b981)",
    emoji: "🌱",
    categoryIds: ["tenses", "subject-verb-agreement", "parts-of-speech", "determiners", "pronouns"],
    tip: "Giai đoạn này quyết định 70% số điểm Part 5. Đừng bỏ qua!",
  },
  {
    id: 2,
    title: "Cấu Trúc Chuyên Sâu",
    sub: "Nắm vững cấu trúc nâng cao — chìa khóa để vượt 700+ điểm",
    color: "var(--accent)",
    gradient: "linear-gradient(135deg, #6d28d9, #7c3aed)",
    emoji: "⚡",
    categoryIds: ["modals", "prepositions", "conjunctions", "conditionals", "comparatives"],
    tip: "Từ đây bắt đầu phân biệt được người 600 vs 800 điểm.",
  },
  {
    id: 3,
    title: "Chinh Phục 800–900",
    sub: "Cấu trúc phức tạp & chiến thuật phòng thi thực tế",
    color: "var(--error)",
    gradient: "linear-gradient(135deg, #dc2626, #f97316)",
    emoji: "🔥",
    categoryIds: ["gerunds-infinitives", "passive", "clauses"],
    tip: "Đây là lúc bạn cần luyện đề thật để kiểm tra kiến thức.",
  },
];

// Category icon mapping
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  tenses: <NodeIndexOutlined />,
  "subject-verb-agreement": <SafetyCertificateOutlined />,
  "parts-of-speech": <ToolOutlined />,
  determiners: <GlobalOutlined />,
  pronouns: <QuestionCircleOutlined />,
  modals: <ThunderboltOutlined />,
  prepositions: <AimOutlined />,
  conjunctions: <BulbOutlined />,
  conditionals: <FireOutlined />,
  comparatives: <StarFilled />,
  "gerunds-infinitives": <RocketOutlined />,
  passive: <BookOutlined />,
  clauses: <TrophyOutlined />,
};

// ── Main Page ────────────────────────────────────────────
export default function GrammarRoadmapPage() {
  const [progressByTopic, setProgressByTopic] = useState<Record<string, GrammarLessonProgressItem>>({});
  const [loading, setLoading] = useState(true);
  const [recommendedTopic, setRecommendedTopic] = useState<GrammarTopic | null>(null);
  const [expandedPhase, setExpandedPhase] = useState<number | null>(1);

  // Load progress
  useEffect(() => {
    let cancelled = false;
    api
      .get<ProgressResponse>("/grammar-lessons/progress", { params: { examMode: "toeic" } })
      .then((data) => {
        if (cancelled) return;
        setProgressByTopic(data.summary.progressByTopic);
        setRecommendedTopic(data.recommendedTopic);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // All TOEIC categories
  const allCategories = useMemo(() => getCategoriesForExam("toeic"), []);

  // Computed stats
  const completedSet = useMemo(
    () => new Set(
      Object.values(progressByTopic)
        .filter((p) => p.status === "completed")
        .map((p) => p.topicId),
    ),
    [progressByTopic],
  );

  const inProgressSet = useMemo(
    () => new Set(
      Object.values(progressByTopic)
        .filter((p) => p.status === "in_progress")
        .map((p) => p.topicId),
    ),
    [progressByTopic],
  );

  const totalTopics = allCategories.reduce((s, c) => s + c.topics.length, 0);
  const totalCompleted = completedSet.size;
  const totalInProgress = inProgressSet.size;
  const overallPct = totalTopics > 0 ? Math.round((totalCompleted / totalTopics) * 100) : 0;

  // Phase stats
  const getPhaseStats = useCallback(
    (categoryIds: string[]) => {
      const cats = allCategories.filter((c) => categoryIds.includes(c.id));
      const topics = cats.flatMap((c) => c.topics);
      const completed = topics.filter((t) => completedSet.has(t.id)).length;
      const inProg = topics.filter((t) => inProgressSet.has(t.id)).length;
      return { total: topics.length, completed, inProgress: inProg, pct: topics.length > 0 ? Math.round((completed / topics.length) * 100) : 0 };
    },
    [allCategories, completedSet, inProgressSet],
  );

  // Determine current phase for the user
  const currentPhase = useMemo(() => {
    for (let i = 0; i < PHASE_CONFIG.length; i++) {
      const stats = getPhaseStats(PHASE_CONFIG[i].categoryIds);
      if (stats.pct < 100) return i + 1;
    }
    return 3; // All done
  }, [getPhaseStats]);

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "var(--space-6)" }} className="anim-fade-up">
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <ModuleHeader
          icon={<BookOutlined />}
          gradient="var(--gradient-grammar)"
          title="Lộ trình Ngữ pháp TOEIC"
          subtitle="Bản đồ chinh phục 900 điểm — từ nền tảng đến chiến thuật phòng thi"
        />

        {/* ── Overall Progress Card ── */}
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: "var(--surface)",
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--border)",
            padding: "24px",
            boxShadow: "var(--shadow-md)",
            marginTop: 20,
            marginBottom: 24,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, var(--success), var(--accent), var(--error))" }} />

          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            {/* Circle progress */}
            <Progress
              type="circle"
              percent={overallPct}
              size={90}
              strokeWidth={8}
              strokeColor={{ "0%": "var(--success)", "50%": "var(--accent)", "100%": "var(--error)" }}
              trailColor="var(--border)"
              format={() => (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "var(--ink)", fontFamily: "var(--font-display)" }}>{overallPct}%</div>
                  <div style={{ fontSize: 9.5, color: "var(--text-muted)", fontWeight: 700 }}>Hoàn thành</div>
                </div>
              )}
            />

            {/* Stats */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: "var(--ink)", fontFamily: "var(--font-display)", marginBottom: 4 }}>
                Tiến độ tổng quan
              </div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 12 }}>
                <StatPill icon={<CheckCircleFilled style={{ color: "var(--success)" }} />} label="Đã hoàn thành" value={`${totalCompleted}/${totalTopics}`} />
                <StatPill icon={<ThunderboltOutlined style={{ color: "var(--accent)" }} />} label="Đang học" value={String(totalInProgress)} />
                <StatPill icon={<FireOutlined style={{ color: "var(--error)" }} />} label="Giai đoạn" value={`${currentPhase}/3`} />
              </div>

              {/* Phase progress mini-bars */}
              <div style={{ display: "flex", gap: 4 }}>
                {PHASE_CONFIG.map((phase) => {
                  const stats = getPhaseStats(phase.categoryIds);
                  return (
                    <Tooltip key={phase.id} title={`${phase.title}: ${stats.completed}/${stats.total} (${stats.pct}%)`}>
                      <div style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--border)", overflow: "hidden" }}>
                        <div style={{
                          width: `${stats.pct}%`,
                          height: "100%",
                          borderRadius: 3,
                          background: phase.gradient,
                          transition: "width 0.5s ease",
                        }} />
                      </div>
                    </Tooltip>
                  );
                })}
              </div>
            </div>

            {/* Recommended action */}
            {recommendedTopic && (
              <Link
                href={`/grammar-lessons?topic=${recommendedTopic.id}`}
                style={{ textDecoration: "none" }}
              >
                <m.div
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    padding: "14px 20px",
                    borderRadius: "var(--radius-xl)",
                    background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                    color: "var(--text-on-accent)",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    boxShadow: "0 6px 20px var(--accent-muted)",
                    cursor: "pointer",
                    minWidth: 200,
                  }}
                >
                  <RocketOutlined style={{ fontSize: 18 }} />
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.8 }}>
                      Gợi ý tiếp theo
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800 }}>
                      {recommendedTopic.title}
                    </div>
                  </div>
                  <ArrowRightOutlined style={{ marginLeft: "auto", fontSize: 14 }} />
                </m.div>
              </Link>
            )}
          </div>
        </m.div>

        {/* ── Phase Accordion ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {PHASE_CONFIG.map((phase, phaseIdx) => {
            const stats = getPhaseStats(phase.categoryIds);
            const isExpanded = expandedPhase === phase.id;
            const phaseCats = allCategories.filter((c) => phase.categoryIds.includes(c.id));
            const isCurrentPhase = currentPhase === phase.id;
            const isPastPhase = currentPhase > phase.id;

            return (
              <m.div
                key={phase.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + phaseIdx * 0.1 }}
                style={{
                  background: "var(--surface)",
                  borderRadius: "var(--radius-xl)",
                  border: isCurrentPhase ? `2px solid ${phase.color}` : "1px solid var(--border)",
                  boxShadow: isCurrentPhase ? `0 6px 24px color-mix(in srgb, ${phase.color} 12%, transparent)` : "var(--shadow-sm)",
                  overflow: "hidden",
                }}
              >
                {/* Phase Header (clickable) */}
                <m.button
                  onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
                  whileHover={{ backgroundColor: "var(--surface-hover)" }}
                  style={{
                    width: "100%",
                    padding: "20px 24px",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    textAlign: "left",
                  }}
                >
                  {/* Phase number badge */}
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: phase.gradient,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    fontSize: 22,
                  }}>
                    {isPastPhase ? <CheckCircleFilled style={{ color: "#fff" }} /> : phase.emoji}
                  </div>

                  {/* Phase info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em", color: phase.color }}>
                        Giai đoạn {String(phase.id).padStart(2, "0")}
                      </span>
                      {isCurrentPhase && (
                        <span style={{
                          fontSize: 9,
                          fontWeight: 800,
                          padding: "2px 8px",
                          borderRadius: 6,
                          background: `color-mix(in srgb, ${phase.color} 12%, var(--surface))`,
                          color: phase.color,
                          border: `1px solid color-mix(in srgb, ${phase.color} 25%, transparent)`,
                        }}>
                          ĐAng HỌC
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: "var(--ink)", fontFamily: "var(--font-display)" }}>
                      {phase.title}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, marginTop: 2 }}>
                      {phase.sub}
                    </div>
                  </div>

                  {/* Phase progress */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: phase.color, fontFamily: "var(--font-display)" }}>
                      {stats.pct}%
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>
                      {stats.completed}/{stats.total} chủ đề
                    </div>
                  </div>

                  {/* Chevron */}
                  <m.div
                    animate={{ rotate: isExpanded ? 90 : 0 }}
                    style={{ fontSize: 14, color: "var(--text-muted)", flexShrink: 0 }}
                  >
                    <ArrowRightOutlined />
                  </m.div>
                </m.button>

                {/* Expanded content */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <m.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      style={{ overflow: "hidden" }}
                    >
                      <div style={{ padding: "0 24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                        {/* Expert tip */}
                        <div style={{
                          padding: "12px 16px",
                          borderRadius: "var(--radius-lg)",
                          background: `color-mix(in srgb, ${phase.color} 5%, var(--surface-alt))`,
                          border: `1px solid color-mix(in srgb, ${phase.color} 15%, transparent)`,
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 10,
                        }}>
                          <BulbOutlined style={{ color: phase.color, fontSize: 16, marginTop: 2 }} />
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 800, color: phase.color, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              Kinh nghiệm 900 điểm
                            </div>
                            <div style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600, lineHeight: 1.5, marginTop: 2 }}>
                              {phase.tip}
                            </div>
                          </div>
                        </div>

                        {/* Categories */}
                        {phaseCats.map((cat, catIdx) => (
                          <CategoryCard
                            key={cat.id}
                            category={cat}
                            completedSet={completedSet}
                            inProgressSet={inProgressSet}
                            delay={catIdx * 0.05}
                            phaseColor={phase.color}
                          />
                        ))}
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>
              </m.div>
            );
          })}
        </div>

        {/* ── Expert Tips Section ── */}
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            background: "var(--surface)",
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--border)",
            padding: "24px",
            boxShadow: "var(--shadow-sm)",
            marginTop: 24,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 900, color: "var(--ink)", fontFamily: "var(--font-display)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <TrophyOutlined style={{ color: "var(--xp)" }} />
            Chiến lược từ người đạt 900 L&R
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
            {[
              {
                emoji: "🎯",
                title: "Part 5: 20 giây/câu",
                desc: "Nhận diện từ loại trước, loại trừ 2 đáp án ngay lập tức. 80% câu Part 5 test từ loại + thì + hòa hợp chủ vị.",
              },
              {
                emoji: "📚",
                title: "Học theo cặp đối lập",
                desc: "Luôn học Because vs Because of, Although vs Despite cùng lúc. TOEIC thích test sự khác biệt giữa liên từ và giới từ.",
              },
              {
                emoji: "🔁",
                title: "Luyện lặp lại cách quãng",
                desc: "Sau mỗi bài học, hệ thống AI sẽ tạo bài tập 4 tầng: nhận diện → áp dụng → tự viết → ngữ cảnh đề thi.",
              },
              {
                emoji: "⚡",
                title: "Đừng bỏ qua Passive Voice",
                desc: "10–15% câu Part 5/6 test thể bị động. Nắm vững be + V3 và causative (have something done) là ăn điểm chắc.",
              },
            ].map((tip, i) => (
              <div
                key={i}
                style={{
                  padding: "14px 16px",
                  borderRadius: "var(--radius-lg)",
                  background: "var(--surface-alt)",
                  border: "1px solid var(--border)",
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 6 }}>{tip.emoji}</div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--ink)", marginBottom: 4 }}>{tip.title}</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, fontWeight: 500 }}>{tip.desc}</div>
              </div>
            ))}
          </div>
        </m.div>

        {/* Quick links */}
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{
            display: "flex",
            gap: 10,
            marginTop: 20,
            marginBottom: 40,
            flexWrap: "wrap",
          }}
        >
          <QuickLinkCard href="/grammar-lessons" emoji="📖" label="Thư viện bài học" desc="50+ chủ đề AI-generated" />
          <QuickLinkCard href="/grammar-quiz" emoji="📝" label="Part 5 Quiz" desc="Luyện đề thực chiến" />
          <QuickLinkCard href="/toeic/grammar/drill" emoji="🎯" label="Grammar Drill" desc="Luyện theo kỹ năng yếu" />
          <QuickLinkCard href="/toeic/practice" emoji="🏆" label="Luyện đề TOEIC" desc="Full test Part 3-7" />
        </m.div>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────

function CategoryCard({
  category,
  completedSet,
  inProgressSet,
  delay,
  phaseColor,
}: {
  category: GrammarTopicCategory;
  completedSet: Set<string>;
  inProgressSet: Set<string>;
  delay: number;
  phaseColor: string;
}) {
  const completed = category.topics.filter((t) => completedSet.has(t.id)).length;
  const pct = category.topics.length > 0 ? Math.round((completed / category.topics.length) * 100) : 0;
  const icon = CATEGORY_ICONS[category.id] ?? <BookOutlined />;

  return (
    <m.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      style={{
        background: "var(--surface-alt)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border)",
        padding: "16px 18px",
      }}
    >
      {/* Category header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: `color-mix(in srgb, ${category.color} 10%, var(--surface))`,
          color: category.color,
          display: "grid",
          placeItems: "center",
          fontSize: 15,
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>
            {category.title}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>
            {completed}/{category.topics.length} · {pct}%
          </div>
        </div>
        <div style={{ width: 60 }}>
          <div style={{ height: 5, borderRadius: 3, background: "var(--border)" }}>
            <div style={{
              width: `${pct}%`,
              height: "100%",
              borderRadius: 3,
              background: category.color,
              transition: "width 0.4s ease",
            }} />
          </div>
        </div>
      </div>

      {/* Topic chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {category.topics.map((topic) => {
          const isDone = completedSet.has(topic.id);
          const isInProg = inProgressSet.has(topic.id);

          return (
            <Link
              key={topic.id}
              href={`/grammar-lessons?topic=${topic.id}`}
              style={{ textDecoration: "none" }}
            >
              <m.div
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "6px 12px",
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  border: isDone
                    ? "1px solid rgba(16, 185, 129, 0.3)"
                    : isInProg
                    ? "1px solid color-mix(in srgb, var(--accent) 30%, transparent)"
                    : "1px solid var(--border)",
                  background: isDone
                    ? "rgba(16, 185, 129, 0.06)"
                    : isInProg
                    ? "color-mix(in srgb, var(--accent) 5%, var(--surface))"
                    : "var(--surface)",
                  color: isDone
                    ? "var(--success)"
                    : isInProg
                    ? "var(--accent)"
                    : "var(--text-secondary)",
                }}
              >
                {isDone ? (
                  <CheckCircleFilled style={{ fontSize: 11, color: "var(--success)" }} />
                ) : isInProg ? (
                  <ThunderboltOutlined style={{ fontSize: 11, color: "var(--accent)" }} />
                ) : (
                  <span style={{
                    fontSize: 8.5,
                    fontWeight: 800,
                    padding: "1px 4px",
                    borderRadius: 4,
                    background: topic.level === "A2" ? "rgba(16, 185, 129, 0.1)" : topic.level === "B1" ? "rgba(59, 130, 246, 0.1)" : "rgba(245, 158, 11, 0.1)",
                    color: topic.level === "A2" ? "var(--success)" : topic.level === "B1" ? "var(--info)" : "var(--warning)",
                  }}>
                    {topic.level}
                  </span>
                )}
                <span>{topic.title}</span>
              </m.div>
            </Link>
          );
        })}
      </div>
    </m.div>
  );
}

function StatPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {icon}
      <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>{label}:</span>
      <span style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)" }}>{value}</span>
    </div>
  );
}

function QuickLinkCard({ href, emoji, label, desc }: { href: string; emoji: string; label: string; desc: string }) {
  return (
    <Link href={href} style={{ textDecoration: "none", flex: "1 1 200px" }}>
      <m.div
        whileHover={{ y: -3, boxShadow: "var(--shadow-md)" }}
        whileTap={{ scale: 0.98 }}
        style={{
          padding: "16px 18px",
          borderRadius: "var(--radius-xl)",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          cursor: "pointer",
          transition: "all 0.15s",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <span style={{ fontSize: 22 }}>{emoji}</span>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--ink)" }}>{label}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>{desc}</div>
        </div>
      </m.div>
    </Link>
  );
}
