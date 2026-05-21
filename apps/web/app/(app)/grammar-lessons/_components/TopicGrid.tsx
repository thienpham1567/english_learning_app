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
import * as m from "motion/react-client";

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

const LEVEL_GLOWS: Record<string, string> = {
  A2: "rgba(16, 185, 129, 0.15)",
  B1: "rgba(59, 130, 246, 0.15)",
  B2: "rgba(139, 92, 246, 0.15)",
  C1: "rgba(236, 72, 153, 0.15)",
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
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {categories.map((cat, idx) => {
        const isExpanded = activeExpandedCategory === cat.id;
        const isHovered = hoveredCat === cat.id;
        const completedCount = cat.topics.filter((t) => completedTopics.has(t.id)).length;
        const progressPct = (completedCount / cat.topics.length) * 100;
        const allDone = completedCount === cat.topics.length && completedCount > 0;

        return (
          <m.div
            key={cat.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            style={{
              borderRadius: "var(--radius-xl)",
              border: isExpanded
                ? `1px solid color-mix(in srgb, ${cat.color} 35%, var(--border))`
                : "1px solid var(--border)",
              background: "var(--surface)",
              overflow: "hidden",
              boxShadow: isExpanded
                ? `0 10px 30px color-mix(in srgb, ${cat.color} 8%, transparent)`
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
                  width: 46,
                  height: 46,
                  placeItems: "center",
                  borderRadius: "var(--radius-lg)",
                  background: allDone
                    ? "linear-gradient(135deg, var(--success), color-mix(in srgb, var(--success) 75%, black))"
                    : `linear-gradient(135deg, ${cat.color}, color-mix(in srgb, ${cat.color} 75%, black))`,
                  color: "var(--text-on-accent)",
                  fontSize: 20,
                  flexShrink: 0,
                  boxShadow: `0 4px 12px color-mix(in srgb, ${cat.color} 20%, transparent)`,
                  transition: "transform 0.2s ease",
                  transform: isHovered ? "scale(1.05)" : "scale(1)",
                }}
              >
                {allDone ? <CheckCircleOutlined /> : cat.icon}
                {/* Completion sparkle */}
                {allDone && (
                  <StarFilled
                    style={{
                      position: "absolute",
                      top: -3,
                      right: -3,
                      fontSize: 12,
                      color: "var(--xp)",
                      filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))",
                    }}
                  />
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14.5,
                    fontWeight: 800,
                    color: "var(--text-primary)",
                    marginBottom: 6,
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
                      height: 5,
                      borderRadius: 99,
                      background: "var(--border)",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <m.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPct}%` }}
                      transition={{ type: "spring", stiffness: 80, damping: 15 }}
                      style={{
                        height: "100%",
                        borderRadius: 99,
                        background: allDone
                          ? "linear-gradient(90deg, var(--success), color-mix(in srgb, var(--success) 65%, white))"
                          : `linear-gradient(90deg, ${cat.color}, color-mix(in srgb, ${cat.color} 65%, white))`,
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
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
                  fontSize: 11,
                  color: "var(--text-muted)",
                  transform: isExpanded ? "rotate(90deg)" : "none",
                  transition: "transform 0.25s ease",
                  flexShrink: 0,
                }}
              />
            </button>

            {/* Expanded topic list using framer-motion for smooth height transition */}
            <m.div
              initial={false}
              animate={{ height: isExpanded ? "auto" : 0 }}
              style={{ overflow: "hidden" }}
            >
              <div
                style={{
                  borderTop: "1px solid var(--border)",
                  padding: "12px 16px 16px",
                  background: `color-mix(in srgb, ${cat.color} 4%, var(--surface))`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {cat.topics.map((topic, topicIdx) => {
                  const isDone = completedTopics.has(topic.id);
                  const isTopicHovered = hoveredTopic === topic.id;
                  const progress = progressByTopic[topic.id];
                  const isRecommended = recommendedTopicId === topic.id;

                  return (
                    <m.button
                      key={topic.id}
                      onClick={() => onSelectTopic(topic.id, topic.title, topic.level)}
                      onMouseEnter={() => setHoveredTopic(topic.id)}
                      onMouseLeave={() => setHoveredTopic(null)}
                      whileHover={{ scale: 1.005, x: 2 }}
                      whileTap={{ scale: 0.995 }}
                      style={{
                        display: "flex",
                        width: "100%",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 14px",
                        borderRadius: "var(--radius-lg)",
                        border: isRecommended
                          ? "1.5px solid color-mix(in srgb, var(--accent) 30%, transparent)"
                          : "1.5px solid transparent",
                        background: isRecommended
                          ? "var(--accent-light)"
                          : isTopicHovered
                          ? isDone
                            ? `color-mix(in srgb, ${cat.color} 10%, var(--surface))`
                            : "var(--surface-alt)"
                          : isDone
                          ? `color-mix(in srgb, ${cat.color} 5%, transparent)`
                          : "var(--surface)",
                        cursor: "pointer",
                        textAlign: "left",
                        boxShadow: "var(--shadow-sm)",
                        transition: "background 0.15s, border-color 0.15s",
                      }}
                    >
                      {/* Step index circle */}
                      <span
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 99,
                          display: "grid",
                          placeItems: "center",
                          flexShrink: 0,
                          background: isDone ? cat.color : "var(--surface-alt)",
                          border: isDone ? "none" : "1px solid var(--border)",
                          color: isDone ? "var(--text-on-accent)" : "var(--text-secondary)",
                          fontSize: isDone ? 11 : 11.5,
                          fontWeight: 800,
                        }}
                      >
                        {isDone ? <CheckCircleOutlined /> : topicIdx + 1}
                      </span>

                      <span
                        style={{
                          flex: 1,
                          fontSize: 13.5,
                          color: isDone ? "var(--text-primary)" : "var(--text-secondary)",
                          fontWeight: isDone || isRecommended ? 800 : 500,
                          lineHeight: 1.3,
                        }}
                      >
                        {topic.title}
                      </span>

                      {progress && progress.totalCount > 0 && (
                        <Tooltip title={`Đáp án đúng: ${progress.correctCount}/${progress.totalCount}`}>
                          <Tag
                            color={progress.scorePct >= 80 ? "success" : progress.scorePct >= 50 ? "warning" : "error"}
                            style={{ margin: 0, fontSize: 10.5, borderRadius: 6, fontWeight: 700, border: "none" }}
                          >
                            {progress.scorePct >= 90 ? "🥇 " : progress.scorePct >= 70 ? "🥈 " : progress.scorePct >= 50 ? "🥉 " : ""}
                            {progress.scorePct}%
                          </Tag>
                        </Tooltip>
                      )}

                      {isRecommended && (
                        <Tag
                          color="gold"
                          style={{
                            margin: 0,
                            fontSize: 10,
                            borderRadius: 6,
                            fontWeight: 800,
                            border: "none",
                            boxShadow: "0 0 6px rgba(245, 158, 11, 0.3)",
                          }}
                        >
                          <StarFilled style={{ marginRight: 3, fontSize: 9 }} />
                          GỢI Ý
                        </Tag>
                      )}

                      <Tag
                        color={LEVEL_COLORS[topic.level] ?? "default"}
                        style={{
                          margin: 0,
                          fontSize: 10.5,
                          borderRadius: 6,
                          fontWeight: 800,
                          border: "none",
                          background: LEVEL_GLOWS[topic.level] ?? "var(--surface-alt)",
                          color: `var(--${LEVEL_COLORS[topic.level]})`,
                        }}
                      >
                        {topic.level}
                      </Tag>

                      <RightOutlined
                        style={{
                          fontSize: 9,
                          color: "var(--text-muted)",
                          opacity: isTopicHovered ? 1 : 0,
                          transition: "opacity 0.15s",
                        }}
                      />
                    </m.button>
                  );
                })}
              </div>
            </m.div>
          </m.div>
        );
      })}
    </div>
  );
}
