"use client";

import { useState } from "react";
import { BookOutlined, CheckCircleOutlined, RightOutlined } from "@ant-design/icons";
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
    color: "#52c41a",
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
    color: "#6366f1",
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
    color: "#f59e0b",
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
    color: "#8b5cf6",
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
    color: "#ec4899",
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
    color: "#14b8a6",
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {GRAMMAR_CATEGORIES.map((cat) => {
        const isExpanded = expandedCategory === cat.id;
        const completedCount = cat.topics.filter((t) => completedTopics.has(t.id)).length;

        return (
          <div key={cat.id} style={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card-bg)", overflow: "hidden" }}>
            {/* Category header */}
            <button
              onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
              style={{
                display: "flex", width: "100%", alignItems: "center", gap: 12,
                padding: "16px 20px", border: "none", background: "transparent",
                cursor: "pointer", textAlign: "left",
              }}
            >
              <span style={{
                display: "grid", width: 40, height: 40, placeItems: "center",
                borderRadius: 10, background: `${cat.color}15`, fontSize: 20,
              }}>
                {cat.icon}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{cat.title}</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  {completedCount}/{cat.topics.length} bài học
                </div>
              </div>
              <RightOutlined style={{
                fontSize: 12, color: "var(--text-muted)",
                transform: isExpanded ? "rotate(90deg)" : "none",
                transition: "transform 0.2s",
              }} />
            </button>

            {/* Topics list */}
            {isExpanded && (
              <div style={{ borderTop: "1px solid var(--border)", padding: "8px 12px" }}>
                {cat.topics.map((topic) => {
                  const isDone = completedTopics.has(topic.id);
                  return (
                    <button
                      key={topic.id}
                      onClick={() => onSelectTopic(topic.id, topic.title, topic.level)}
                      style={{
                        display: "flex", width: "100%", alignItems: "center", gap: 10,
                        padding: "10px 12px", borderRadius: 8, border: "none",
                        background: isDone ? "#52c41a08" : "transparent",
                        cursor: "pointer", textAlign: "left",
                        transition: "background 0.15s",
                      }}
                    >
                      {isDone ? (
                        <CheckCircleOutlined style={{ fontSize: 16, color: "#52c41a" }} />
                      ) : (
                        <BookOutlined style={{ fontSize: 16, color: "var(--text-muted)" }} />
                      )}
                      <span style={{ flex: 1, fontSize: 14, color: "var(--text)", fontWeight: isDone ? 500 : 400 }}>
                        {topic.title}
                      </span>
                      <Tag color={LEVEL_COLORS[topic.level] ?? "default"} style={{ margin: 0, fontSize: 11 }}>
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
