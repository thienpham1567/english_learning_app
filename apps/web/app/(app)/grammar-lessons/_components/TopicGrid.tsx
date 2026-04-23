"use client";

import { useState } from "react";
import { CheckCircleOutlined, RightOutlined } from "@ant-design/icons";
import { Tag } from "antd";

export type GrammarTopic = {
  id: string;
  title: string;
  level: string;
};

export type GrammarCategory = {
  id: string;
  title: string;
  icon: string;
  color: string;
  topics: GrammarTopic[];
};

export const GRAMMAR_CATEGORIES: GrammarCategory[] = [
  {
    id: "tenses",
    title: "Thì (Tenses)",
    icon: "🕐",
    color: "var(--success)",
    topics: [
      { id: "present-simple", title: "Present Simple", level: "A2" },
      { id: "present-continuous", title: "Present Continuous", level: "A2" },
      { id: "present-perfect", title: "Present Perfect", level: "B1" },
      { id: "past-simple", title: "Past Simple", level: "A2" },
      { id: "future-will-going", title: "Future (will / going to)", level: "B1" },
    ],
  },
  {
    id: "modals",
    title: "Động từ khiếm khuyết (Modals)",
    icon: "💡",
    color: "var(--accent)",
    topics: [
      { id: "can-could-may", title: "Can / Could / May", level: "A2" },
      { id: "must-have-to", title: "Must / Have to", level: "B1" },
      { id: "should-ought", title: "Should / Ought to", level: "B1" },
    ],
  },
  {
    id: "conditionals",
    title: "Câu điều kiện (Conditionals)",
    icon: "🔀",
    color: "var(--warning)",
    topics: [
      { id: "zero-first", title: "Zero & First Conditional", level: "B1" },
      { id: "second-conditional", title: "Second Conditional", level: "B1" },
      { id: "third-conditional", title: "Third Conditional", level: "B2" },
    ],
  },
  {
    id: "passive",
    title: "Bị động (Passive Voice)",
    icon: "🔄",
    color: "var(--secondary)",
    topics: [
      { id: "passive-simple", title: "Simple Passive", level: "B1" },
      { id: "passive-perfect", title: "Perfect Passive", level: "B2" },
      { id: "causative", title: "Causative (have/get)", level: "B2" },
    ],
  },
  {
    id: "clauses",
    title: "Mệnh đề (Clauses)",
    icon: "🔗",
    color: "var(--error)",
    topics: [
      { id: "relative-who-which", title: "Relative (who/which/that)", level: "B1" },
      { id: "relative-advanced", title: "Non-defining Relatives", level: "B2" },
      { id: "noun-clauses", title: "Noun Clauses", level: "B2" },
    ],
  },
  {
    id: "determiners",
    title: "Mạo từ & Lượng từ",
    icon: "📌",
    color: "var(--xp)",
    topics: [
      { id: "articles", title: "A / An / The", level: "A2" },
      { id: "quantifiers", title: "Some / Any / Much / Many", level: "B1" },
      { id: "both-either-neither", title: "Both / Either / Neither", level: "B1" },
    ],
  },
];

const LEVEL_COLORS: Record<string, string> = {
  A2: "green",
  B1: "blue",
  B2: "purple",
};

interface Props {
  onSelectTopic: (topicId: string, topicTitle: string, level: string) => void;
  completedTopics: Set<string>;
}

export function TopicGrid({ onSelectTopic, completedTopics }: Props) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);
  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {GRAMMAR_CATEGORIES.map((cat) => {
        const isExpanded = expandedCategory === cat.id;
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
              onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
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
                  boxShadow: `0 2px 8px ${cat.color}44`,
                }}
              >
                {allDone ? "✅" : cat.icon}
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
                        width: `${progressPct}%`,
                        transition: "width 0.5s ease",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 11,
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
                  fontSize: 11,
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
                  background: `${cat.color}05`,
                }}
              >
                {cat.topics.map((topic, idx) => {
                  const isDone = completedTopics.has(topic.id);
                  const isTopicHovered = hoveredTopic === topic.id;

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
                            ? `${cat.color}18`
                            : "var(--bg-deep, rgba(0,0,0,0.04))"
                          : isDone
                          ? `${cat.color}10`
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
                          color: isDone ? "#fff" : "var(--text-muted)",
                          fontSize: isDone ? 13 : 11,
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

                      <Tag
                        color={LEVEL_COLORS[topic.level] ?? "default"}
                        style={{ margin: 0, fontSize: 11, borderRadius: 6 }}
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
