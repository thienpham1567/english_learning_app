"use client";

import { useMemo, useState } from "react";
import {
  CheckCircleOutlined,
  RightOutlined,
  ClockCircleOutlined,
  BulbOutlined,
  SwapOutlined,
  SyncOutlined,
  LinkOutlined,
  PushpinOutlined,
  CheckSquareOutlined,
  FontSizeOutlined,
  EnvironmentOutlined,
  ApartmentOutlined,
  PercentageOutlined,
  FileTextOutlined,
  UserOutlined,
  BlockOutlined,
  ColumnHeightOutlined,
  FormOutlined,
  ThunderboltOutlined,
  StarFilled,
} from "@ant-design/icons";
import type { ReactNode } from "react";
import { Tag, Tooltip } from "antd";

import type { GrammarLessonProgressItem } from "@/lib/grammar-lessons/schema";
import {
  getCategoriesForExam,
  GRAMMAR_TOPIC_CATEGORIES,
  type ExamType,
  type GrammarTopic,
  type GrammarTopicCategory,
} from "@/lib/grammar-lessons/topics";

export type { GrammarTopic };

export type GrammarCategory = GrammarTopicCategory & {
  icon: ReactNode;
};

const CATEGORY_ICONS: Record<string, ReactNode> = {
  tenses: <ClockCircleOutlined />,
  "subject-verb-agreement": <CheckSquareOutlined />,
  "parts-of-speech": <FontSizeOutlined />,
  modals: <BulbOutlined />,
  prepositions: <EnvironmentOutlined />,
  conjunctions: <ApartmentOutlined />,
  conditionals: <SwapOutlined />,
  comparatives: <PercentageOutlined />,
  "gerunds-infinitives": <FileTextOutlined />,
  passive: <SyncOutlined />,
  pronouns: <UserOutlined />,
  clauses: <LinkOutlined />,
  determiners: <PushpinOutlined />,
  "complex-sentences": <BlockOutlined />,
  inversion: <ColumnHeightOutlined />,
  nominalization: <FormOutlined />,
  "advanced-structures": <ThunderboltOutlined />,
};

function buildCategories(exam?: ExamType): GrammarCategory[] {
  const source = exam ? getCategoriesForExam(exam) : GRAMMAR_TOPIC_CATEGORIES;
  return source.map((category) => ({
    ...category,
    icon: CATEGORY_ICONS[category.id] ?? <BulbOutlined />,
  }));
}

const LEVEL_COLORS: Record<string, string> = {
  A2: "green",
  B1: "blue",
  B2: "purple",
  C1: "magenta",
};

const EMPTY_PROGRESS_BY_TOPIC: Record<string, GrammarLessonProgressItem> = {};

interface Props {
  onSelectTopic: (topicId: string, topicTitle: string, level: string) => void;
  completedTopics: Set<string>;
  progressByTopic?: Record<string, GrammarLessonProgressItem>;
  recommendedTopicId?: string | null;
  examFilter?: ExamType;
}

export function TopicGrid({
  onSelectTopic,
  completedTopics,
  progressByTopic = EMPTY_PROGRESS_BY_TOPIC,
  recommendedTopicId,
  examFilter,
}: Props) {
  const categories = useMemo(() => buildCategories(examFilter), [examFilter]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);
  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null);
  const recommendedCategoryId = categories.find((cat) =>
    cat.topics.some((topic) => topic.id === recommendedTopicId),
  )?.id;
  const activeExpandedCategory = expandedCategory ?? recommendedCategoryId;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {categories.map((cat) => {
        const isExpanded = activeExpandedCategory === cat.id;
        const isHovered = hoveredCat === cat.id;
        const completedCount = cat.topics.filter((t) => completedTopics.has(t.id)).length;
        const progressPct = (completedCount / cat.topics.length) * 100;
        const allDone = completedCount === cat.topics.length && completedCount > 0;

        return (
          <div
            key={cat.id}
            style={{
              borderRadius: 16,
              border: isExpanded
                ? `1px solid color-mix(in srgb, ${cat.color} 35%, var(--border))`
                : "1px solid var(--border)",
              background: "var(--card-bg)",
              overflow: "hidden",
              boxShadow: isExpanded
                ? `0 8px 24px color-mix(in srgb, ${cat.color} 10%, transparent)`
                : isHovered
                ? "var(--shadow-md)"
                : "var(--shadow-sm)",
              transition: "box-shadow 0.25s ease, border-color 0.25s ease",
            }}
            onMouseEnter={() => setHoveredCat(cat.id)}
            onMouseLeave={() => setHoveredCat(null)}
          >
            {/* Category header button */}
            <button
              onClick={() => setExpandedCategory(isExpanded ? "__none" : cat.id)}
              style={{
                display: "flex",
                width: "100%",
                alignItems: "center",
                gap: 14,
                padding: "16px 20px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              {/* Icon container with gradient */}
              <div
                style={{
                  position: "relative",
                  display: "grid",
                  width: 48,
                  height: 48,
                  placeItems: "center",
                  borderRadius: 14,
                  background: allDone
                    ? "linear-gradient(135deg, var(--success), color-mix(in srgb, var(--success) 75%, #047857))"
                    : `linear-gradient(135deg, ${cat.color}, color-mix(in srgb, ${cat.color} 75%, black))`,
                  color: "var(--text-on-accent, #fff)",
                  fontSize: 22,
                  flexShrink: 0,
                  boxShadow: `0 4px 12px color-mix(in srgb, ${cat.color} 25%, transparent)`,
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  transform: isHovered ? "scale(1.05)" : "scale(1)",
                }}
              >
                {allDone ? <CheckCircleOutlined /> : cat.icon}
                {/* Completion sparkle */}
                {allDone && (
                  <StarFilled
                    style={{
                      position: "absolute",
                      top: -4,
                      right: -4,
                      fontSize: 14,
                      color: "var(--xp)",
                      filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))",
                    }}
                  />
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--text)",
                    marginBottom: 8,
                    lineHeight: 1.2,
                  }}
                >
                  {cat.title}
                </div>
                {/* Visual progress bar */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      flex: 1,
                      height: 6,
                      borderRadius: 99,
                      background: "var(--border)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        borderRadius: 99,
                        background: allDone
                          ? "linear-gradient(90deg, var(--success), color-mix(in srgb, var(--success) 65%, #34d399))"
                          : `linear-gradient(90deg, ${cat.color}, color-mix(in srgb, ${cat.color} 65%, white))`,
                        transform: `scaleX(${progressPct / 100})`,
                        transformOrigin: "left",
                        width: "100%",
                        transition: "transform 0.5s ease",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: allDone ? "var(--success)" : completedCount > 0 ? cat.color : "var(--text-muted)",
                      flexShrink: 0,
                      minWidth: 36,
                      textAlign: "right",
                    }}
                  >
                    {completedCount}/{cat.topics.length}
                  </span>
                </div>
              </div>

              <RightOutlined
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  transform: isExpanded ? "rotate(90deg)" : "none",
                  transition: "transform 0.25s ease",
                  flexShrink: 0,
                }}
              />
            </button>

            {/* Expanded topic list */}
            {isExpanded && (
              <div
                style={{
                  borderTop: "1px solid var(--border)",
                  padding: "10px 16px 14px",
                  background: `color-mix(in srgb, ${cat.color} 3%, var(--surface))`,
                }}
              >
                {cat.topics.map((topic, idx) => {
                  const isDone = completedTopics.has(topic.id);
                  const isTopicHovered = hoveredTopic === topic.id;
                  const progress = progressByTopic[topic.id];
                  const isRecommended = recommendedTopicId === topic.id;

                  return (
                    <button
                      key={topic.id}
                      onClick={() => onSelectTopic(topic.id, topic.title, topic.level)}
                      onMouseEnter={() => setHoveredTopic(topic.id)}
                      onMouseLeave={() => setHoveredTopic(null)}
                      style={{
                        display: "flex",
                        width: "100%",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 14px",
                        borderRadius: 12,
                        border: isRecommended
                          ? "1px solid color-mix(in srgb, var(--xp) 40%, transparent)"
                          : "1px solid transparent",
                        background: isRecommended
                          ? "color-mix(in srgb, var(--xp) 6%, var(--surface))"
                          : isTopicHovered
                          ? isDone
                            ? `color-mix(in srgb, ${cat.color} 10%, var(--surface))`
                            : "var(--surface-hover)"
                          : isDone
                          ? `color-mix(in srgb, ${cat.color} 5%, transparent)`
                          : "transparent",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "background 0.15s, border-color 0.15s, transform 0.1s",
                        marginBottom: idx < cat.topics.length - 1 ? 3 : 0,
                        transform: isTopicHovered ? "translateX(2px)" : "none",
                      }}
                    >
                      {/* Step indicator */}
                      <span
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 99,
                          display: "grid",
                          placeItems: "center",
                          flexShrink: 0,
                          background: isDone ? cat.color : "var(--border)",
                          color: isDone ? "var(--text-on-accent, #fff)" : "var(--text-muted)",
                          fontSize: isDone ? 14 : 12,
                          fontWeight: 700,
                          transition: "background 0.2s, transform 0.2s",
                          transform: isDone ? "scale(1)" : "scale(0.95)",
                        }}
                      >
                        {isDone ? <CheckCircleOutlined /> : idx + 1}
                      </span>

                      <span
                        style={{
                          flex: 1,
                          fontSize: 14,
                          color: "var(--text)",
                          fontWeight: isDone ? 600 : 400,
                          lineHeight: 1.3,
                        }}
                      >
                        {topic.title}
                      </span>

                      {progress && progress.totalCount > 0 && (
                        <Tooltip title={`Điểm: ${progress.correctCount}/${progress.totalCount}`}>
                          <Tag
                            color={progress.scorePct >= 80 ? "success" : progress.scorePct >= 50 ? "warning" : "error"}
                            style={{ margin: 0, fontSize: 11, borderRadius: 6, fontWeight: 700 }}
                          >
                            {progress.scorePct}%
                          </Tag>
                        </Tooltip>
                      )}

                      {isRecommended && (
                        <Tag
                          color="gold"
                          style={{
                            margin: 0,
                            fontSize: 11,
                            borderRadius: 6,
                            fontWeight: 700,
                            animation: "pulse 2s infinite",
                          }}
                        >
                          <StarFilled style={{ marginRight: 3, fontSize: 10 }} />
                          Gợi ý
                        </Tag>
                      )}

                      <Tag
                        color={LEVEL_COLORS[topic.level] ?? "default"}
                        style={{ margin: 0, fontSize: 11, borderRadius: 6, fontWeight: 600 }}
                      >
                        {topic.level}
                      </Tag>

                      <RightOutlined
                        style={{
                          fontSize: 10,
                          color: "var(--text-muted)",
                          opacity: isTopicHovered ? 1 : 0,
                          transition: "opacity 0.15s",
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
