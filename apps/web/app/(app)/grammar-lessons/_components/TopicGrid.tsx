"use client";

import { useState } from "react";
import {
  CheckCircleOutlined,
  RightOutlined,
  ClockCircleOutlined,
  BulbOutlined,
  SwapOutlined,
  SyncOutlined,
  LinkOutlined,
  PushpinOutlined,
} from "@ant-design/icons";
import type { ReactNode } from "react";
import { Tag } from "antd";

import type { GrammarLessonProgressItem } from "@/lib/grammar-lessons/schema";
import {
  GRAMMAR_TOPIC_CATEGORIES,
  type GrammarTopic,
  type GrammarTopicCategory,
} from "@/lib/grammar-lessons/topics";

export type { GrammarTopic };

export type GrammarCategory = GrammarTopicCategory & {
  icon: ReactNode;
};

const CATEGORY_ICONS: Record<string, ReactNode> = {
  tenses: <ClockCircleOutlined />,
  modals: <BulbOutlined />,
  conditionals: <SwapOutlined />,
  passive: <SyncOutlined />,
  clauses: <LinkOutlined />,
  determiners: <PushpinOutlined />,
};

export const GRAMMAR_CATEGORIES: GrammarCategory[] = GRAMMAR_TOPIC_CATEGORIES.map((category) => ({
  ...category,
  icon: CATEGORY_ICONS[category.id] ?? <BulbOutlined />,
}));

const LEVEL_COLORS: Record<string, string> = {
  A2: "green",
  B1: "blue",
  B2: "purple",
};

const EMPTY_PROGRESS_BY_TOPIC: Record<string, GrammarLessonProgressItem> = {};

interface Props {
  onSelectTopic: (topicId: string, topicTitle: string, level: string) => void;
  completedTopics: Set<string>;
  progressByTopic?: Record<string, GrammarLessonProgressItem>;
  recommendedTopicId?: string | null;
}

export function TopicGrid({
  onSelectTopic,
  completedTopics,
  progressByTopic = EMPTY_PROGRESS_BY_TOPIC,
  recommendedTopicId,
}: Props) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);
  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null);
  const recommendedCategoryId = GRAMMAR_CATEGORIES.find((cat) =>
    cat.topics.some((topic) => topic.id === recommendedTopicId),
  )?.id;
  const activeExpandedCategory = expandedCategory ?? recommendedCategoryId;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {GRAMMAR_CATEGORIES.map((cat) => {
        const isExpanded = activeExpandedCategory === cat.id;
        const isHovered = hoveredCat === cat.id;
        const completedCount = cat.topics.filter((t) => completedTopics.has(t.id)).length;
        const progressPct = (completedCount / cat.topics.length) * 100;
        const allDone = completedCount === cat.topics.length;

        return (
          <div
            key={cat.id}
            style={{
              borderRadius: 14,
              border: "1px solid var(--border)",
              background: "var(--card-bg)",
              overflow: "hidden",
              boxShadow: isExpanded
                ? "var(--shadow-lg)"
                : isHovered
                ? "var(--shadow-md)"
                : "var(--shadow-sm)",
              transition: "box-shadow 0.2s",
            }}
            onMouseEnter={() => setHoveredCat(cat.id)}
            onMouseLeave={() => setHoveredCat(null)}
          >
            {/* Top color accent bar */}
            <div
              style={{
                height: 4,
                background: allDone
                  ? "linear-gradient(90deg, var(--success), color-mix(in srgb, var(--success) 60%, white))"
                  : `linear-gradient(90deg, ${cat.color}, color-mix(in srgb, ${cat.color} 67%, transparent))`,
              }}
            />

            {/* Category header button */}
            <button
              onClick={() => setExpandedCategory(isExpanded ? "__none" : cat.id)}
              style={{
                display: "flex",
                width: "100%",
                alignItems: "center",
                gap: 14,
                padding: "14px 20px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              {/* Fully colored icon container */}
              <span
                style={{
                  display: "grid",
                  width: 46,
                  height: 46,
                  placeItems: "center",
                  borderRadius: 12,
                  background: allDone
                    ? "linear-gradient(135deg, var(--success), color-mix(in srgb, var(--success) 80%, black))"
                    : `linear-gradient(135deg, ${cat.color}, color-mix(in srgb, ${cat.color} 80%, transparent))`,
                  fontSize: 22,
                  flexShrink: 0,
                  boxShadow: `0 2px 8px color-mix(in srgb, ${cat.color} 27%, transparent)`,
                }}
              >
                {allDone ? <CheckCircleOutlined style={{ color: "var(--text-on-accent, #fff)" }} /> : cat.icon}
              </span>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--text)",
                    marginBottom: 6,
                    lineHeight: 1.2,
                  }}
                >
                  {cat.title}
                </div>
                {/* Visual progress bar */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      flex: 1,
                      height: 5,
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
                          ? "var(--success)"
                          : `linear-gradient(90deg, ${cat.color}, color-mix(in srgb, ${cat.color} 80%, transparent))`,
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
                      fontWeight: 600,
                      color: completedCount > 0 ? cat.color : "var(--text-muted)",
                      flexShrink: 0,
                      minWidth: 32,
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
                  padding: "8px 14px 12px",
                  background: `color-mix(in srgb, ${cat.color} 3%, transparent)`,
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
                        padding: "9px 12px",
                        borderRadius: 10,
                        border: "none",
                        background: isTopicHovered
                          ? isDone
                            ? `color-mix(in srgb, ${cat.color} 10%, transparent)`
                            : "var(--bg-deep, rgba(0,0,0,0.04))"
                          : isDone
                          ? `color-mix(in srgb, ${cat.color} 6%, transparent)`
                          : "transparent",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "background 0.15s",
                        marginBottom: idx < cat.topics.length - 1 ? 2 : 0,
                      }}
                    >
                      {/* Step indicator */}
                      <span
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 99,
                          display: "grid",
                          placeItems: "center",
                          flexShrink: 0,
                          background: isDone ? cat.color : "var(--border)",
                          color: isDone ? "var(--text-on-accent, #fff)" : "var(--text-muted)",
                          fontSize: isDone ? 13 : 12,
                          fontWeight: 700,
                          transition: "background 0.2s",
                        }}
                      >
                        {isDone ? "✓" : idx + 1}
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
                        <Tag
                          color={progress.scorePct >= 80 ? "success" : progress.scorePct >= 50 ? "warning" : "error"}
                          style={{ margin: 0, fontSize: 12, borderRadius: 6 }}
                        >
                          {progress.scorePct}%
                        </Tag>
                      )}

                      {isRecommended && (
                        <Tag color="gold" style={{ margin: 0, fontSize: 12, borderRadius: 6 }}>
                          Gợi ý
                        </Tag>
                      )}

                      <Tag
                        color={LEVEL_COLORS[topic.level] ?? "default"}
                        style={{ margin: 0, fontSize: 12, borderRadius: 6 }}
                      >
                        {topic.level}
                      </Tag>
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
